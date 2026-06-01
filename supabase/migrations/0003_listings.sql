-- Migration 0003: listings table + RLS
-- Phase 2 Slice 4 — listings schema + read-only browse
--
-- Source of truth for the listings schema. If the database is ever rebuilt,
-- run this file (in order with the earlier-numbered migrations).
--
-- Plain English, what it does:
--   1. Creates the public.listings table — one row per listing. A single table
--      holds every category (apartment, furniture, later jobs/services). Shared
--      fields are real columns; category-specific fields live in the `details`
--      JSON column so we can extend without a schema change.
--   2. Adds indexes for the queries we actually run (browse by status+type,
--      newest-first feed, a listing's author).
--   3. Bumps updated_at on every UPDATE (same trigger pattern as 0001).
--   4. Turns on Row-Level Security and adds the Tier wall:
--      - anyone signed in can READ published listings (Tier 0 → Tier 1 gate)
--      - only the author, if they're a member, can write their own listings
--        (Tier 1 → Tier 2 gate). Posting UI is a later slice; the policy is
--        in place now so the wall is real the moment posting ships.
--   5. The member check goes through an is_member() SECURITY DEFINER helper —
--      same pattern as is_admin() in 0002. It bypasses RLS for the inner
--      lookup against public.accounts, avoiding the recursion bug from Slice 2.

-- ---------------------------------------------------------------------------
-- 1. is_member() — RLS-bypassing helper
-- ---------------------------------------------------------------------------
-- Returns true if the signed-in user's accounts row has is_member = true.
-- SECURITY DEFINER runs the function as its owner, bypassing RLS on the inner
-- query — so a policy that calls this never triggers recursive RLS evaluation.
-- Never subquery public.accounts directly from inside a policy; always go
-- through a helper like this. (See 0002 for the recursion post-mortem.)
create or replace function public.is_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_member from public.accounts where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_member() from public;
grant execute on function public.is_member() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. listings table
-- ---------------------------------------------------------------------------
create table public.listings (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.accounts(id) on delete cascade,
  type         text not null check (type in ('apartment', 'furniture')),
  title        text not null,
  description  text not null,
  price_cents  int  not null check (price_cents >= 0),
  details      jsonb not null default '{}'::jsonb,
  status       text not null default 'draft'
                 check (status in ('draft', 'published', 'archived')),
  -- Flag for seed/example listings. Stripped from public views before launch.
  is_example   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index listings_author_id_idx  on public.listings (author_id);
-- (status, type) is the most common browse query: published listings of a kind.
create index listings_status_type_idx on public.listings (status, type);
-- Newest-first feed.
create index listings_created_at_idx  on public.listings (created_at desc);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger (reuses public.touch_updated_at() from 0001)
-- ---------------------------------------------------------------------------
create trigger listings_touch_updated_at
  before update on public.listings
  for each row
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.listings enable row level security;

-- READ: any signed-in user can see published listings. No anonymous read
-- (auth.uid() is null when logged out → no rows). No draft/archived read.
-- This is the Tier 0 → Tier 1 gate: you must have an account to browse.
create policy listings_read_published_for_accounts
  on public.listings
  for select
  using (status = 'published' and auth.uid() is not null);

-- WRITE: only the author, and only if they're a member. is_member() does the
-- accounts lookup safely (SECURITY DEFINER). Posting UI ships in a later slice;
-- the policy is here now so the Tier 1 → Tier 2 wall is enforced from day one.
create policy listings_write_member_own_insert
  on public.listings
  for insert
  with check (author_id = auth.uid() and public.is_member());

create policy listings_write_member_own_update
  on public.listings
  for update
  using (author_id = auth.uid() and public.is_member())
  with check (author_id = auth.uid() and public.is_member());

create policy listings_write_member_own_delete
  on public.listings
  for delete
  using (author_id = auth.uid() and public.is_member());

-- ---------------------------------------------------------------------------
-- 6. Verify with:
--    select polname, polcmd, pg_get_expr(polqual, polrelid) as using_clause
--    from pg_policy where polrelid = 'public.listings'::regclass;
--    -- expect 4 policies: 1 SELECT + insert/update/delete
-- ---------------------------------------------------------------------------
