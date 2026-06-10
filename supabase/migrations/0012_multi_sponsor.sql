-- Migration 0012: multi-sponsor — many sponsors per member
-- Multi-Sponsor slice (Build Plan v1, 2026-06-10)
--
-- The architectural change: we move from ONE sponsor per member
-- (accounts.sponsor_id, copied onto each listing as a single sponsor_name text)
-- to MANY sponsors per member. A new public.sponsorships table becomes the
-- source of truth; the listing keeps a denormalized, ordered CACHE of sponsor
-- names (sponsor_names text[]) so the page still reads from one table; the
-- frontend renders them with the hybrid-at-2 byline (lib/listings/byline.ts).
--
-- accounts.sponsor_id STAYS — it is now the "primary sponsor" (inviter) pointer,
-- always rendered first. The new table holds EVERY sponsor, the primary included.
-- This keeps the 0001 column-protection and the 0008 approval flow intact.
--
-- Plain English, section by section:
--   1. sponsorships table — one row per (member, sponsor). RLS on, NO client
--      policies (same lockdown as listing_contacts in 0011): the only write
--      path is the SECURITY DEFINER functions below; the only read the UI needs
--      is the denormalized listings.sponsor_names. Direct client access to this
--      table is refused.
--   2. Backfill existing accounts.sponsor_id into the table as primary rows.
--   3. listings.sponsor_name (text) → sponsor_names (text[]): add the array,
--      backfill from the old column (array-wrap non-null, preserving the
--      founder's 'John Robinson' placeholder), then DROP the old column.
--   4. rebuild_sponsor_names(member) — recompute one member's cached array.
--   5. populate_listing_byline() — reworked BEFORE INSERT body: author_name as
--      before, sponsor_names assembled from the table (primary first).
--   6. Propagation triggers: sponsorship added/removed → rebuild; account
--      name/sponsor_id changed → refresh own listings + everyone they sponsor.
--   7. add_sponsor() — seed-phase helper to add an extra sponsor.
--   8. approve_application() — also write a primary sponsorship row on approval.
--
-- ⚠️ Dropping listings.sponsor_name means every TypeScript reference moves to
-- sponsor_names IN THE SAME SLICE. Claude Code did that (app/listings/page.tsx,
-- app/listings/[id]/page.tsx, app/listings/mine/page.tsx, lib/listings/byline.ts)
-- and deploys only AFTER this migration runs, so prod never sees a mismatch.

-- ---------------------------------------------------------------------------
-- 1. sponsorships table
-- ---------------------------------------------------------------------------
create table public.sponsorships (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.accounts(id) on delete cascade,
  sponsor_id  uuid not null references public.accounts(id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (member_id, sponsor_id),        -- can't sponsor the same person twice
  check (member_id <> sponsor_id)         -- can't sponsor yourself
);

-- At most one primary (inviter) per member. Partial unique index — only rows
-- where is_primary is true are constrained, so a member has many sponsors but
-- exactly one (or zero) primary.
create unique index sponsorships_one_primary_per_member
  on public.sponsorships (member_id) where is_primary;

-- Fast "who sponsors this member" lookup for the byline rebuild.
create index sponsorships_member_idx on public.sponsorships (member_id);

-- ---------------------------------------------------------------------------
-- 1b. Row-Level Security — locked down on purpose (mirrors 0011)
-- ---------------------------------------------------------------------------
-- RLS on, no policies for authenticated/anon. With RLS enabled and no matching
-- policy, every direct client select/insert/update/delete is refused / returns
-- zero rows. The only write path is the SECURITY DEFINER functions below; the
-- only read the UI needs is the denormalized listings.sponsor_names. Admin /
-- moderation reads come with the future admin UI.
alter table public.sponsorships enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Backfill existing sponsor data
-- ---------------------------------------------------------------------------
-- Migrate any existing single sponsor_id into the table as the primary. The
-- founder's sponsor_id is null, so nothing migrates today — this is written
-- generically for when real sponsored members exist.
insert into public.sponsorships (member_id, sponsor_id, is_primary)
select id, sponsor_id, true
  from public.accounts
 where sponsor_id is not null
on conflict (member_id, sponsor_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. listings.sponsor_name (text) → sponsor_names (text[])
-- ---------------------------------------------------------------------------
alter table public.listings
  add column sponsor_names text[] not null default '{}';

-- Preserve current bylines, including the founder's 'John Robinson' placeholder
-- (a demo string set in 0006 — George has no real sponsor). Non-null/non-empty
-- becomes a single-element array; null/empty becomes the empty array.
update public.listings
   set sponsor_names = case
         when sponsor_name is null or sponsor_name = '' then '{}'
         else array[sponsor_name]
       end;

alter table public.listings drop column sponsor_name;

-- ---------------------------------------------------------------------------
-- 4. rebuild_sponsor_names(member) — recompute one member's cached array
-- ---------------------------------------------------------------------------
-- Both propagation triggers reuse this. Assembles the ordered array
-- (primary first, then oldest-added first) and writes it onto every listing
-- the member authored. SECURITY DEFINER so it can read other members' names
-- (accounts is read-own under RLS) and write listings.
create or replace function public.rebuild_sponsor_names(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_names text[];
begin
  select array_agg(a.name order by s.is_primary desc, s.created_at asc)
    into v_names
    from public.sponsorships s
    join public.accounts a on a.id = s.sponsor_id
   where s.member_id = p_member_id
     and a.name is not null;

  update public.listings
     set sponsor_names = coalesce(v_names, '{}')
   where author_id = p_member_id;
end;
$$;

revoke all on function public.rebuild_sponsor_names(uuid) from public;

-- ---------------------------------------------------------------------------
-- 5. Rework the BEFORE INSERT byline trigger (replaces 0006's body)
-- ---------------------------------------------------------------------------
-- author_name as before; sponsor_names now assembled from the sponsorships
-- table (primary first). The listings_populate_byline_on_insert trigger (0006)
-- keeps pointing at this function — only the body changes.
create or replace function public.populate_listing_byline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_name text;
  v_names       text[];
begin
  select name into v_author_name from public.accounts where id = new.author_id;

  select array_agg(a.name order by s.is_primary desc, s.created_at asc)
    into v_names
    from public.sponsorships s
    join public.accounts a on a.id = s.sponsor_id
   where s.member_id = new.author_id
     and a.name is not null;

  new.author_name   := v_author_name;
  new.sponsor_names := coalesce(v_names, '{}');
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Propagation triggers
-- ---------------------------------------------------------------------------
-- (a) Sponsorship added/removed → rebuild that member's listings.
create or replace function public.sponsorship_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rebuild_sponsor_names(coalesce(new.member_id, old.member_id));
  return null;
end;
$$;

revoke all on function public.sponsorship_changed() from public;

create trigger sponsorships_refresh_byline
  after insert or delete on public.sponsorships
  for each row execute function public.sponsorship_changed();

-- (b) Account name changed → refresh own listings' author_name AND the bylines
--     of everyone this person sponsors (their name appears there). sponsor_id
--     changed → keep the primary sponsorship row in sync, then rebuild.
--     Replaces 0006's propagate_account_changes_to_listings(). The
--     accounts_propagate_byline_changes trigger (0006) keeps its WHEN clause
--     (name OR sponsor_id changed) and points at this updated function.
create or replace function public.propagate_account_changes_to_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if new.name is distinct from old.name then
    update public.listings set author_name = new.name where author_id = new.id;
    -- Rebuild bylines for everyone this account sponsors.
    for r in select member_id from public.sponsorships where sponsor_id = new.id loop
      perform public.rebuild_sponsor_names(r.member_id);
    end loop;
  end if;

  -- sponsor_id (the primary pointer) changed → keep the table in sync, rebuild.
  if new.sponsor_id is distinct from old.sponsor_id then
    delete from public.sponsorships where member_id = new.id and is_primary;
    if new.sponsor_id is not null then
      insert into public.sponsorships (member_id, sponsor_id, is_primary)
      values (new.id, new.sponsor_id, true)
      on conflict (member_id, sponsor_id) do update set is_primary = true;
    end if;
    perform public.rebuild_sponsor_names(new.id);
  end if;

  return new;
end;
$$;

revoke all on function public.propagate_account_changes_to_listings() from public;

-- ---------------------------------------------------------------------------
-- 7. add_sponsor() — seed-phase "add an extra sponsor" helper
-- ---------------------------------------------------------------------------
-- The real "add a sponsor" path until an admin UI exists. Lets George stand up
-- 2- and 3-sponsor members to test the byline. SECURITY DEFINER; validates both
-- parties are members and not the same person, manages the single-primary rule,
-- then inserts (the AFTER INSERT trigger rebuilds the byline cache).
create or replace function public.add_sponsor(
  p_member_id uuid,
  p_sponsor_id uuid,
  p_is_primary boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_member_id = p_sponsor_id then
    raise exception 'A member cannot sponsor themselves';
  end if;
  if not exists (select 1 from public.accounts where id = p_member_id and is_member) then
    raise exception 'Member % is not a member', p_member_id;
  end if;
  if not exists (select 1 from public.accounts where id = p_sponsor_id and is_member) then
    raise exception 'Sponsor % is not a member', p_sponsor_id;
  end if;

  -- Enforce the single-primary rule before inserting a new primary.
  if p_is_primary then
    update public.sponsorships set is_primary = false
     where member_id = p_member_id and is_primary;
  end if;

  insert into public.sponsorships (member_id, sponsor_id, is_primary)
  values (p_member_id, p_sponsor_id, p_is_primary)
  on conflict (member_id, sponsor_id) do update set is_primary = excluded.is_primary;
  -- The sponsorships_refresh_byline trigger rebuilds the byline cache.
end;
$$;

revoke all on function public.add_sponsor(uuid, uuid, boolean) from public;
-- Seed/test path: the prod test harness (scripts/test-multi-sponsor.ts) calls
-- this over the service-role key via rpc(), exactly as scripts/approve-application.ts
-- calls approve_application (granted in 0009). Same wall: authenticated/anon
-- still cannot call it — only the privileged backend key.
grant execute on function public.add_sponsor(uuid, uuid, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- 8. Rework approve_application() — write a primary sponsorship row on approval
-- ---------------------------------------------------------------------------
-- Same atomic transaction as 0008, with one addition: after flipping is_member
-- and writing accounts.sponsor_id, insert the matching PRIMARY sponsorship row
-- so the new member's byline lights up. (The 0006/6b sponsor_id-change trigger
-- already inserts this row; the explicit insert is kept for clarity and is
-- idempotent via on conflict.) Signature is unchanged, so the service_role
-- grant from 0009 carries over (create or replace preserves the ACL).
create or replace function public.approve_application(
  p_application_id uuid,
  p_sponsor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_status     public.application_status;
begin
  -- Default the sponsor to the founder during seed phase.
  if p_sponsor_id is null then
    p_sponsor_id := '85ce5315-2c38-4dc6-b3f3-48f224f26dba';
  end if;

  -- Lock the application row and read its account + status.
  select account_id, status
    into v_account_id, v_status
    from public.applications
   where id = p_application_id
   for update;

  if v_account_id is null then
    raise exception 'Application % not found', p_application_id;
  end if;

  if v_status <> 'pending' then
    raise exception 'Application % is %, not pending', p_application_id, v_status;
  end if;

  -- Don't re-admit someone who's already a member.
  if (select is_member from public.accounts where id = v_account_id) then
    raise exception 'Account % is already a member', v_account_id;
  end if;

  -- The sponsor must exist and be a member — you can't be vouched for by
  -- someone who isn't inside the network.
  if not exists (
    select 1 from public.accounts where id = p_sponsor_id and is_member
  ) then
    raise exception 'Sponsor % is not a member', p_sponsor_id;
  end if;

  -- The transaction: account becomes a sponsored member; application approved.
  update public.accounts
     set is_member = true,
         sponsor_id = p_sponsor_id
   where id = v_account_id;

  -- Multi-sponsor: record the primary sponsorship explicitly.
  -- MIN_SPONSORS = 1 (raise to 2 when the multi-sponsor apply flow lands)
  insert into public.sponsorships (member_id, sponsor_id, is_primary)
  values (v_account_id, p_sponsor_id, true)
  on conflict (member_id, sponsor_id) do update set is_primary = true;

  update public.applications
     set status = 'approved',
         reviewed_at = now()
   where id = p_application_id;
end;
$$;

revoke all on function public.approve_application(uuid, uuid) from public;
grant execute on function public.approve_application(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 9. Verify
-- ---------------------------------------------------------------------------
-- (a) Table + lockdown: sponsorships exists, RLS on, zero policies.
--   select relrowsecurity from pg_class where oid = 'public.sponsorships'::regclass;  -- t
--   select polname from pg_policy where polrelid = 'public.sponsorships'::regclass;   -- 0 rows
--
-- (b) Triggers exist.
--   select tgname from pg_trigger where tgrelid = 'public.sponsorships'::regclass;
--     -- expect: sponsorships_refresh_byline
--   select tgname from pg_trigger
--    where tgrelid in ('public.listings'::regclass, 'public.accounts'::regclass)
--      and tgname like '%byline%';
--     -- expect: listings_populate_byline_on_insert, accounts_propagate_byline_changes
--
-- (c) Column moved + sample byline array.
--   select title, author_name, sponsor_names from public.listings;
--     -- founder's two listings → author_name 'George Gardner', sponsor_names {John Robinson}
--   -- the old singular column is gone:
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'listings' and column_name = 'sponsor_name';
--     -- expect: 0 rows
--
-- (d) Functions present.
--   select proname from pg_proc where pronamespace = 'public'::regnamespace
--     and proname in ('rebuild_sponsor_names','add_sponsor','sponsorship_changed',
--                     'populate_listing_byline','propagate_account_changes_to_listings',
--                     'approve_application');
-- ---------------------------------------------------------------------------
