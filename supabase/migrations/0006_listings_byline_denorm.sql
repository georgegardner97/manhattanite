-- Migration 0006: denormalized author_name + sponsor_name on listings
-- Phase 4 Slice 1 — byline display (close the "a member · sponsored by —" gap)
--
-- Plain English, what this does:
--   1. Sets the founder's accounts.name = 'George Gardner' so there's
--      something meaningful to denormalize for his existing listings.
--      Full-name (not initial) per the GdC-style byline convention picked
--      2026-06-04 — Manhattanite uses "Listed by George Gardner", not
--      "Listed by George G."
--   2. Adds two columns to public.listings: author_name + sponsor_name.
--      Both are text, nullable. They're a denormalized cache of the author's
--      name and the author's sponsor's name at insert time.
--   3. BEFORE INSERT trigger on listings: SECURITY DEFINER lookup against
--      public.accounts to populate both fields from the current author +
--      author's sponsor. Bypasses accounts RLS (the read-own policy would
--      otherwise block reading other members' rows during sponsor lookup).
--   4. AFTER UPDATE trigger on accounts: when name OR sponsor_id changes,
--      propagates the change to every listing it affects. Same SECURITY
--      DEFINER pattern.
--   5. Backfills the two existing listings from current accounts state.
--   6. Manually overrides sponsor_name = 'John R.' on the two existing
--      founder listings — placeholder text for demo visibility of the
--      byline mechanic. George has no real sponsor (sponsor_id stays null
--      on his accounts row); when real members exist this override goes
--      away and sponsor_name will derive from the trigger again.
--
-- Why denormalize over an RLS public-profile policy:
--   - Postgres RLS is row-level, not column-level. A SELECT policy that
--     allowed reading other accounts rows would expose every column
--     (email, role, is_member). Bad.
--   - SECURITY DEFINER views break PostgREST's embedded-select syntax;
--     no clean way to write listings.author:account_profiles(name).
--   - Denormalize is the lowest-friction pattern that keeps the trust
--     mechanic intact and keeps reads to a single table.
--   - Trade-off: rename propagation needs a trigger, which we built. Fine.

-- ---------------------------------------------------------------------------
-- 1. Backfill George's name on accounts so the trigger has something to copy
-- ---------------------------------------------------------------------------
-- The Slice 2 thread "name not collected at signup" left this NULL. Setting
-- it explicitly per George's call (display = "George Gardner" on his listings).
update public.accounts
  set name = 'George Gardner'
  where email = 'info@manhattanite.com'
    and name is null;

-- ---------------------------------------------------------------------------
-- 2. Add denormalized byline columns
-- ---------------------------------------------------------------------------
alter table public.listings
  add column author_name text,
  add column sponsor_name text;

-- ---------------------------------------------------------------------------
-- 3. BEFORE INSERT trigger — populate from accounts
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER lets the trigger read accounts rows (including the
-- author's sponsor's row) without being blocked by the accounts read-own
-- RLS policy. The trigger always overwrites NEW.author_name and
-- NEW.sponsor_name with the looked-up values — opinionated, but means
-- the byline is always grounded in the current accounts state at insert
-- time. Post-insert manual overrides via UPDATE are still possible (used
-- below to set the John R. placeholder).
create or replace function public.populate_listing_byline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_name      text;
  v_author_sponsor   uuid;
  v_sponsor_name     text;
begin
  -- Look up author's name + sponsor reference in one query.
  select name, sponsor_id
    into v_author_name, v_author_sponsor
    from public.accounts
    where id = new.author_id;

  -- If author has a sponsor, look up the sponsor's name.
  if v_author_sponsor is not null then
    select name into v_sponsor_name
      from public.accounts
      where id = v_author_sponsor;
  end if;

  new.author_name  := v_author_name;
  new.sponsor_name := v_sponsor_name;

  return new;
end;
$$;

revoke all on function public.populate_listing_byline() from public;
-- Trigger functions don't need explicit grants — they execute as the owner.

create trigger listings_populate_byline_on_insert
  before insert on public.listings
  for each row
  execute function public.populate_listing_byline();

-- ---------------------------------------------------------------------------
-- 4. AFTER UPDATE trigger on accounts — propagate name + sponsor changes
-- ---------------------------------------------------------------------------
-- Two propagation paths:
--   a. accounts.name changes  → update author_name on all listings authored
--                                by this account, AND update sponsor_name
--                                on all listings authored by anyone whose
--                                sponsor_id IS this account.
--   b. accounts.sponsor_id changes → refresh sponsor_name on all listings
--                                authored by this account (using the new
--                                sponsor's current name).
create or replace function public.propagate_account_changes_to_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_sponsor_name text;
begin
  -- (a) name changed
  if new.name is distinct from old.name then
    update public.listings
      set author_name = new.name
      where author_id = new.id;

    update public.listings
      set sponsor_name = new.name
      where author_id in (
        select id from public.accounts where sponsor_id = new.id
      );
  end if;

  -- (b) sponsor_id changed
  if new.sponsor_id is distinct from old.sponsor_id then
    if new.sponsor_id is null then
      v_new_sponsor_name := null;
    else
      select name into v_new_sponsor_name
        from public.accounts
        where id = new.sponsor_id;
    end if;

    update public.listings
      set sponsor_name = v_new_sponsor_name
      where author_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.propagate_account_changes_to_listings() from public;

create trigger accounts_propagate_byline_changes
  after update on public.accounts
  for each row
  when (
    new.name is distinct from old.name
    or new.sponsor_id is distinct from old.sponsor_id
  )
  execute function public.propagate_account_changes_to_listings();

-- ---------------------------------------------------------------------------
-- 5. Backfill the two existing founder listings
-- ---------------------------------------------------------------------------
-- Runs the same lookup the BEFORE INSERT trigger would have run, but on
-- already-existing rows. After this, both founder listings have
-- author_name = 'George Gardner' and sponsor_name = NULL (founder has no sponsor).
update public.listings l
  set author_name  = author.name,
      sponsor_name = sponsor.name
from public.accounts author
left join public.accounts sponsor on sponsor.id = author.sponsor_id
where l.author_id = author.id;

-- ---------------------------------------------------------------------------
-- 6. Manual override: set sponsor_name = 'John Robinson' on the founder's listings
-- ---------------------------------------------------------------------------
-- Demo-visibility move. George has no real sponsor, but the byline mechanic
-- ("Listed by X · sponsored by Y") only reads correctly when both halves are
-- present. 'John Robinson' is a placeholder until real sponsored members
-- exist. When a real sponsor is added to George's accounts.sponsor_id, the
-- AFTER UPDATE trigger above will overwrite this. Full-name format matches
-- the GdC-style byline convention picked 2026-06-04.
update public.listings
  set sponsor_name = 'John Robinson'
  where author_id = (
    select id from public.accounts where email = 'info@manhattanite.com'
  );

-- ---------------------------------------------------------------------------
-- 7. Verify with:
--    select title, author_name, sponsor_name from public.listings;
--    -- expect: both listings → ('George Gardner', 'John R.')
--    select tgname from pg_trigger
--      where tgrelid in ('public.listings'::regclass, 'public.accounts'::regclass)
--      and tgname like '%byline%';
--    -- expect: 2 triggers (listings_populate_byline_on_insert, accounts_propagate_byline_changes)
-- ---------------------------------------------------------------------------
