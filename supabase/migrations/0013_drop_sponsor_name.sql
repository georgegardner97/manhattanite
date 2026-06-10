-- Migration 0013: drop the legacy listings.sponsor_name column
-- Multi-Sponsor cleanup (follows 0012, 2026-06-10)
--
-- 0012 moved bylines to listings.sponsor_names (text[]) but deliberately KEPT
-- the old singular sponsor_name column, dual-written (= primary sponsor), so
-- the live site rendered correctly whichever landed first — the migration or
-- the deploy. The new frontend (app/listings/page.tsx, [id]/page.tsx,
-- mine/page.tsx via lib/listings/byline.ts) is now confirmed live in prod and
-- reads only sponsor_names. Nothing in app/ or lib/ references sponsor_name,
-- so the cutover is complete and the legacy column can go.
--
-- Two parts:
--   1. Recreate rebuild_sponsor_names() and populate_listing_byline() WITHOUT
--      the dual-write assignments (the `sponsor_name = v_names[1]` /
--      `new.sponsor_name := v_names[1]` lines from 0012). Bodies are otherwise
--      identical; create or replace preserves the existing ACLs, and the 0006
--      trigger keeps pointing at populate_listing_byline unchanged.
--   2. Drop the column. Functions go first so nothing references the column
--      at the moment it's dropped.

-- ---------------------------------------------------------------------------
-- 1a. rebuild_sponsor_names(member) — same as 0012, minus the dual-write
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 1b. populate_listing_byline() — same as 0012, minus the dual-write
-- ---------------------------------------------------------------------------
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
-- 2. Drop the legacy column
-- ---------------------------------------------------------------------------
alter table public.listings drop column sponsor_name;

-- ---------------------------------------------------------------------------
-- 3. Verify
-- ---------------------------------------------------------------------------
-- (a) Column gone.
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'listings' and column_name = 'sponsor_name';
--     -- expect: 0 rows
--
-- (b) Bylines still intact (array untouched by this migration).
--   select title, author_name, sponsor_names from public.listings;
--     -- founder's listings → sponsor_names {John Robinson} as before
--
-- (c) Function bodies no longer mention sponsor_name (singular). The regex
--     requires a non-word character after "sponsor_name" so the plural
--     sponsor_names column (used everywhere) doesn't match.
--   select proname from pg_proc
--    where pronamespace = 'public'::regnamespace
--      and prosrc ~ 'sponsor_name\W';
--     -- expect: 0 rows
-- ---------------------------------------------------------------------------
