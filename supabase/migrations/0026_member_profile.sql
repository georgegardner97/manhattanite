-- Migration 0026: get_member_profile() — the public slice of a member row.
--
-- ⚠️  REWRITTEN 2026-08-31, AND THIS VERSION IS APPLIED TO PROD. The first
-- version of this file was written and never applied; nothing had called it, so
-- editing it in place was safe and kept the numbering honest. It now also
-- returns the sponsors of that member, for the reason in the next paragraph.
--
-- APPLIED — VERIFIED BY PROBING THE LIVE FUNCTION, NOT BY THE EDITOR BANNER
-- (2026-08-31). get_member_profile() in prod returns seven columns including
-- sponsor_names; a member answers with their vouchers (Anna, Max, Lila and Sam
-- each return array["George Gardner"]), the founder answers array[] because
-- nobody vouched him in, and a Tier 1 account answers ZERO ROWS. This header
-- said "still hand-run" for a few minutes after the rewrite, which reads as
-- "not yet applied" — the exact stale-status trap CLAUDE.md warns about, where
-- the migration line claimed 0017 while nine more had shipped.
--
-- IF THIS EVER NEEDS CHANGING AGAIN, NOTE THE SHAPE OF THE TRAP: the return
-- type changed between the two versions, and `create or replace function`
-- CANNOT change a function signature — Postgres rejects it with "cannot change
-- return type of existing function". It only worked here because the first
-- version had never been applied. A third version that adds or drops a column
-- must `drop function public.get_member_profile(uuid);` first.
--
-- WHY IT IS BEING APPLIED NOW. /members/[id] was built entirely from the
-- denormalized byline on `listings` (author_name, sponsor_names), so a member
-- with no PUBLISHED listing had no name anywhere the page could read, and the
-- page answered 404. That is most new members: you are vouched in, your name
-- appears in the vouching list of whoever brought you in, the link goes nowhere. George hit it
-- clicking through from his own vouching list on 2026-08-31. A profile cannot
-- be a by-product of having posted something.
--
-- WHAT THIS DECIDES: what does knowing the name of a member buy you? As of
-- 2026-08-31 (George), for a SIGNED-IN viewer it buys the fixed set below:
--
--   name, avatar_path, neighborhood, bio, linkedin_url, member_since,
--   sponsor_names
--
-- Deliberately NOT exposed: email (contact goes through the logged, forwarded
-- form — publishing addresses would undo the whole point of migration 0011), role,
-- is_member for non-members, sponsor_id, and anything about accounts that are
-- not members. A Tier 1 account has no public profile at all.
--
-- SPONSORS ARE THE POINT OF THE PAGE, so they cannot come from listings. The
-- `sponsorships` table is RLS-locked with no client policies and
-- get_my_connections() (0024) is keyed on auth.uid(), so a viewer can only ask
-- about their own. The names returned here are the same names already printed
-- on every listing byline this member has ever posted — no new class of fact,
-- just one that no longer depends on them having posted. Ordered primary first.
-- Still NOT exposed: how many people this member has vouched FOR, which is the
-- most socially loaded number on the screen and is a separate decision.
--
-- SECURITY DEFINER with a narrow return type, rather than a SELECT policy on
-- accounts: a policy would open whole rows and every future column added to
-- that table would be public by default. This function exposes a list someone
-- had to type out, which is the property worth having.
--
-- Requires `authenticated`, not `anon`: the face and neighborhood of a member should
-- not be available to a logged-out crawler. /members/[id] shows a guest the
-- members-only wall before it reads anything, so the two agree.
--
-- NO APOSTROPHES ANYWHERE IN THIS FILE, ON PURPOSE — the Supabase SQL editor
-- auto-pairs a typed apostrophe and silently doubles it. Hence array[]::text[]
-- rather than the empty-array literal.

create or replace function public.get_member_profile(target uuid)
returns table (
  name          text,
  avatar_path   text,
  neighborhood  text,
  bio           text,
  linkedin_url  text,
  member_since  timestamptz,
  sponsor_names text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select a.name,
         a.avatar_path,
         a.neighborhood,
         a.bio,
         a.linkedin_url,
         a.created_at,
         coalesce(
           (select array_agg(sa.name order by s.is_primary desc, sa.name)
              from public.sponsorships s
              join public.accounts sa on sa.id = s.sponsor_id
             where s.member_id = a.id
               and sa.name is not null),
           array[]::text[]
         )
    from public.accounts a
   where a.id = target
     -- Members only. An account that has not been approved has no public face.
     and a.is_member = true;
$$;

revoke all on function public.get_member_profile(uuid) from public, anon;
grant execute on function public.get_member_profile(uuid) to authenticated;

-- Verify (as a signed-in member, or in the editor with any member id):
--   select * from public.get_member_profile(<a member uuid>);
--     -> one row, sponsor_names populated
--   select * from public.get_member_profile(<a Tier 1 account uuid>);
--     -> zero rows
