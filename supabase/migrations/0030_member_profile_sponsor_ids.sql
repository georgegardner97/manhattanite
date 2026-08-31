-- Migration 0030: get_member_profile() also returns the ids of the vouchers.
--
-- ⚠️  NOT YET APPLIED. Hand-run in the Supabase SQL editor, like every migration
-- in this project. The page ships BEFORE this runs and degrades cleanly until it
-- does — see the note at the bottom.
--
-- WHY. "When you click through to someone profile, it is important that you are
-- able to see who vouched for them by name, and equally are able to click
-- through to that person profile too" (George, 2026-08-31). The first half has
-- worked since 0026; the second half was impossible, and not because anyone
-- forgot the link. 0026 returns the vouchers as NAMES ONLY, and you cannot
-- address a profile with a name — /members/[id] is keyed on the account id. The
-- missing link was a missing column.
--
-- THE SIGNATURE CHANGE IS THE WHOLE REASON THIS IS A NEW FILE AND NOT AN EDIT
-- TO 0026. 0026 is APPLIED TO PROD, and `create or replace function` cannot
-- change what an existing function returns — Postgres rejects it with "cannot
-- change return type of existing function". 0026 could be rewritten in place
-- only because it had never been applied; that is spent. Hence the explicit
-- drop below. This is exactly the trap 0026 header predicted for a third
-- version, arriving one day later.
--
-- WHAT IS NEW: sponsor_ids uuid[], NOTHING ELSE. Every other column is
-- unchanged, so CLAUDE.md note 17 still describes what knowing a member name
-- buys you, with one addition. An id is not a new fact about anybody — it is the
-- address of a profile this viewer can already open and already sees named. It
-- buys the link and nothing more.
--
-- ⚠️  sponsor_ids AND sponsor_names ARE PAIRED BY INDEX. sponsor_ids[i] is the
-- id of sponsor_names[i], and the page relies on it to build each link. That
-- pairing is only safe if BOTH aggregates order by the SAME TOTAL expression,
-- which is why `sa.id` is the last ORDER BY key in both. Without it, two
-- vouchers who share a name and is_primary have an undefined order between them
-- and the arrays can pair a name to the wrong profile — a silent mis-link that
-- points at a real member, so nothing looks broken. IF YOU EVER TOUCH ONE OF
-- THESE TWO ORDER BY CLAUSES, TOUCH BOTH. Ordered primary/inviter first, then
-- by name.
--
-- Still NOT exposed, unchanged from 0026: email, role, sponsor_id, is_primary
-- (the ordering implies the primary without publishing the flag), anything at
-- all about an account that is not a member, and how many people this member has
-- vouched FOR.
--
-- NO APOSTROPHES ANYWHERE IN THIS FILE, ON PURPOSE — the Supabase SQL editor
-- auto-pairs a typed apostrophe and silently doubles it. That rule is why the
-- vouchers are returned as two parallel arrays rather than one jsonb array of
-- objects: jsonb_build_object needs quoted keys, and quoting them inside a
-- dollar-quoted body is how this file would acquire its first apostrophe.

drop function if exists public.get_member_profile(uuid);

create or replace function public.get_member_profile(target uuid)
returns table (
  name          text,
  avatar_path   text,
  neighborhood  text,
  bio           text,
  linkedin_url  text,
  member_since  timestamptz,
  sponsor_names text[],
  sponsor_ids   uuid[]
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
         -- Paired by index with sponsor_ids below. Same total ORDER BY in both.
         coalesce(
           (select array_agg(sa.name order by s.is_primary desc, sa.name, sa.id)
              from public.sponsorships s
              join public.accounts sa on sa.id = s.sponsor_id
             where s.member_id = a.id
               and sa.name is not null),
           array[]::text[]
         ),
         -- Paired by index with sponsor_names above. Same total ORDER BY in both.
         coalesce(
           (select array_agg(sa.id order by s.is_primary desc, sa.name, sa.id)
              from public.sponsorships s
              join public.accounts sa on sa.id = s.sponsor_id
             where s.member_id = a.id
               and sa.name is not null),
           array[]::uuid[]
         )
    from public.accounts a
   where a.id = target
     -- Members only. An account that has not been approved has no public face.
     and a.is_member = true;
$$;

revoke all on function public.get_member_profile(uuid) from public, anon;
grant execute on function public.get_member_profile(uuid) to authenticated;

-- ORDER OF OPERATIONS IS SAFE IN BOTH DIRECTIONS. The page reads sponsor_ids
-- only when it is present: before this runs, the vouchers still render as the
-- plain text they are today, and each name becomes a link the moment it does.
-- Nothing has to be deployed in step with the SQL.
--
-- Verify (as a signed-in member, or in the editor with any member id):
--   select name, sponsor_names, sponsor_ids from public.get_member_profile(<a member uuid>);
--     -> one row; the two arrays are the SAME LENGTH and line up index for index
--   select * from public.get_member_profile(<a Tier 1 account uuid>);
--     -> zero rows
