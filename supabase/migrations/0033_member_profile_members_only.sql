-- 0033 — a member profile is readable by members only.
--
-- PROPOSED — NOT YET APPLIED. George runs this in the Supabase SQL editor.
-- Whether it has been applied is a fact about the database, not about this
-- file: check with the first query in the Verify block at the foot.
--
-- WHY (George, 2026-09-15): "Nothing should be visible or accessible until
-- they are approved."
--
-- WHAT WAS FOUND. Probed on production the same day with a real signed-in
-- account that is NOT a member. get_member_profile(target) returned a member
-- in full: name, neighborhood, bio, LinkedIn, member since, and who vouched
-- for them. The function checks that the TARGET is a member (0026/0030) but
-- never checks the CALLER, and execute is granted to every authenticated
-- account. The app now sends a non-member to /apply before any page can call
-- it, but that is the interface; this is the database answering the same
-- question directly to anyone holding an unapproved session.
--
-- WHY THIS ONE AND NOT THE LISTINGS POLICY. A signed-in non-member can also
-- read every published listing, bylines included, through
-- listings_read_published_for_accounts (0003). Closing that here would change
-- nothing: listings_read_published_for_anon (0010) returns the same rows, with
-- the same names, to someone who is not signed in at all, so an unapproved
-- account could simply sign out and read them. That policy is the guest
-- teaser, which is its own open decision. The member profile is different:
-- anon has no execute on this function, so a non-member session was the only
-- way in, and this closes it completely.
--
-- WHAT THIS CHANGES — ONE CONDITION. The final WHERE gains
-- "and public.is_member()", the SECURITY DEFINER helper from 0003 that reads
-- the caller from auth.uid(). Everything else is the 0030 body restated,
-- because CREATE OR REPLACE replaces a function whole. A member calling it
-- sees exactly what they saw before. The founder is a member, so the admin
-- console is unaffected.
--
-- Written dollar-quoted and apostrophe-free: the SQL editor auto-pairs a typed
-- apostrophe and silently doubles it.

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
     and a.is_member = true
     -- 0033: and only a member may ask. Nothing is visible until approved.
     and public.is_member();
$$;

revoke all on function public.get_member_profile(uuid) from public, anon;
grant execute on function public.get_member_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Verify with:
-- ---------------------------------------------------------------------------
--
-- 1. Is it applied? Expect caller_checked = true.
--
--   select pg_get_functiondef($f$public.get_member_profile$f$::regproc)
--     like $l$%and public.is_member()%$l$ as caller_checked;
--
-- 2. A member still sees a member. Replace MEMBER_ID with a member account id
--    and TARGET_ID with another member. Expect one row.
--
--   begin;
--   set local role authenticated;
--   select set_config($k$request.jwt.claims$k$,
--     json_build_object($k$sub$k$, $v$MEMBER_ID$v$, $k$role$k$, $k$authenticated$k$)::text, true);
--   select name from public.get_member_profile($t$TARGET_ID$t$::uuid);
--   rollback;
--
-- 3. The point of the migration: an approved-nothing account sees nobody.
--    Replace NONMEMBER_ID with an account whose is_member is false and
--    TARGET_ID with a member. Expect zero rows.
--
--   begin;
--   set local role authenticated;
--   select set_config($k$request.jwt.claims$k$,
--     json_build_object($k$sub$k$, $v$NONMEMBER_ID$v$, $k$role$k$, $k$authenticated$k$)::text, true);
--   select name from public.get_member_profile($t$TARGET_ID$t$::uuid);
--   rollback;
