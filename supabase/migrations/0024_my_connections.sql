-- Migration 0024: get_my_connections() — surface a member's sponsorship web
-- on their own profile (Profile Connections slice, 2026-06-16).
--
-- The sponsorships table (0012) is RLS-locked with NO client policies: every
-- direct client read returns zero rows. That is deliberate — the only write
-- path is the SECURITY DEFINER helpers, and the only listing-side read the UI
-- needs is the denormalized listings.sponsor_names.
--
-- The profile page wants something the byline cache can't give it: the two
-- directions of the trust web for the SIGNED-IN member —
--   1. "Sponsored by"   — the members who vouched for me   (I am member_id)
--   2. "You've sponsored" — the members I brought in       (I am sponsor_id)
-- ...including people I sponsor who have posted nothing (so sponsor_names,
-- which only lives on listings, would miss them).
--
-- Rather than open the table with a broad SELECT policy, we expose exactly the
-- caller's own slice through a SECURITY DEFINER function keyed on auth.uid().
-- A member can only ever read their own connections; the table stays locked.
-- This keeps RLS load-bearing (tech-architecture.md) — the wall isn't weakened
-- for a convenience read.
--
-- Returns one row per connection:
--   direction   'sponsor'  = this person sponsors me
--               'sponsee'  = I sponsor this person
--   account_id  the other party's account id
--   name        their display name (rows with a null name are dropped)
--   is_primary  whether that sponsorship is the primary (inviter) link
--
-- Read-only, no side effects. Granted to authenticated only.

create or replace function public.get_my_connections()
returns table (
  direction  text,
  account_id uuid,
  name       text,
  is_primary boolean
)
language sql
security definer
set search_path = public
as $$
  -- People who sponsor me (I am the member).
  select 'sponsor'::text, a.id, a.name, s.is_primary
    from public.sponsorships s
    join public.accounts a on a.id = s.sponsor_id
   where s.member_id = auth.uid()
     and a.name is not null

  union all

  -- People I sponsor (I am the sponsor).
  select 'sponsee'::text, a.id, a.name, s.is_primary
    from public.sponsorships s
    join public.accounts a on a.id = s.member_id
   where s.sponsor_id = auth.uid()
     and a.name is not null

  order by 1, 4 desc, 3 asc;  -- direction, primary first, then name
$$;

revoke all on function public.get_my_connections() from public;
grant execute on function public.get_my_connections() to authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select proname from pg_proc where pronamespace = 'public'::regnamespace
--     and proname = 'get_my_connections';                       -- 1 row
--   -- As a signed-in member (via the app / a user JWT):
--   select * from public.get_my_connections();                  -- own web only
