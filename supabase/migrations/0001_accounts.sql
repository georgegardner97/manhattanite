-- Migration 0001: accounts table + RLS + auth trigger
-- Phase 1 Slice 2 — email + password auth
--
-- Source of truth for the accounts schema. If the database is ever rebuilt,
-- run this file (and any later-numbered migrations) in order.
--
-- Plain English, what it does:
--   1. Defines a "role" type with three values: account, member, admin.
--   2. Creates the public.accounts table — one row per signed-in person.
--   3. Turns on Row-Level Security (RLS) so the database itself enforces who
--      can see what (this is what makes the Tier 1 / Tier 2 wall real).
--   4. Adds policies so a signed-in user can read and update their own row;
--      a BEFORE UPDATE trigger refuses any attempt to change protected
--      columns (role, is_member, sponsor_id, email). Admins bypass this.
--   5. Wires a trigger so that whenever Supabase Auth creates a new auth
--      user, a matching row is auto-created in public.accounts with the
--      default role of "account".

-- ---------------------------------------------------------------------------
-- 1. Role enum
-- ---------------------------------------------------------------------------
create type public.account_role as enum ('account', 'member', 'admin');

-- ---------------------------------------------------------------------------
-- 2. accounts table
-- ---------------------------------------------------------------------------
create table public.accounts (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text,
  neighborhood    text,
  bio             text,
  role            public.account_role not null default 'account',
  is_member       boolean not null default false,
  sponsor_id      uuid references public.accounts(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Keep updated_at fresh on any change.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Protected-column trigger
-- ---------------------------------------------------------------------------
-- Refuses any UPDATE from a non-admin that tries to change role, is_member,
-- sponsor_id, or email. Admins (role = 'admin') bypass the check so the
-- review queue can flip is_member and set sponsor_id on approval.
--
-- This is enforcement #1. RLS (below) is enforcement #2. Together they mean:
-- - non-admin can't even reach a row they don't own (RLS)
-- - non-admin can't escalate themselves to member on their own row (trigger)
create or replace function public.protect_account_columns()
returns trigger
language plpgsql
as $$
declare
  caller_role public.account_role;
begin
  -- Look up the caller's role. auth.uid() is the signed-in user's id;
  -- it's null for the service role key (which bypasses RLS entirely and
  -- needs to be allowed through for admin/server-side flows).
  if auth.uid() is null then
    return new;
  end if;

  select role into caller_role from public.accounts where id = auth.uid();

  if caller_role = 'admin' then
    return new;
  end if;

  if new.role       is distinct from old.role       then raise exception 'role is protected'; end if;
  if new.is_member  is distinct from old.is_member  then raise exception 'is_member is protected'; end if;
  if new.sponsor_id is distinct from old.sponsor_id then raise exception 'sponsor_id is protected'; end if;
  if new.email      is distinct from old.email      then raise exception 'email is protected'; end if;

  return new;
end;
$$;

create trigger accounts_protect_columns
  before update on public.accounts
  for each row
  execute function public.protect_account_columns();

-- ---------------------------------------------------------------------------
-- 4. Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.accounts enable row level security;

-- Signed-in user can read their own row.
create policy "accounts: read own row"
  on public.accounts
  for select
  using (auth.uid() = id);

-- Signed-in user can update their own row. Column protection (role,
-- is_member, sponsor_id, email) is enforced by the trigger above, not here.
create policy "accounts: update own row"
  on public.accounts
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read every row (review queue, listings moderation, etc.).
create policy "accounts: admin reads all"
  on public.accounts
  for select
  using (
    exists (
      select 1 from public.accounts a
      where a.id = auth.uid() and a.role = 'admin'
    )
  );

-- Admins can update any row (approve members, set sponsor_id, change role).
create policy "accounts: admin updates all"
  on public.accounts
  for update
  using (
    exists (
      select 1 from public.accounts a
      where a.id = auth.uid() and a.role = 'admin'
    )
  );

-- Inserts come exclusively from the auth trigger below, which runs with
-- SECURITY DEFINER and so bypasses RLS. No INSERT policy is needed for
-- normal users — they cannot create their own accounts row directly.

-- ---------------------------------------------------------------------------
-- 5. Auth trigger — auto-create accounts row on signup
-- ---------------------------------------------------------------------------
-- When Supabase Auth creates a new row in auth.users (which happens on
-- signUp), this function inserts a matching row into public.accounts.
-- SECURITY DEFINER lets it bypass RLS on the INSERT.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 6. Done. Verify with:
--    select * from public.accounts;
--    select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
--    select tgname from pg_trigger where tgrelid = 'public.accounts'::regclass;
-- ---------------------------------------------------------------------------
