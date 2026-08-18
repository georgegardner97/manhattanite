-- Migration 0026: get_member_profile() — the public slice of a member's row.
--
-- ⚠️  WRITTEN, NOT APPLIED, AND NOTHING CALLS IT YET.
--
-- This is the concrete form of a decision, not a change to make casually:
-- WHAT DOES KNOWING A MEMBER'S NAME BUY YOU? Today, nothing — `accounts` is
-- read-own (0001), so /design/members/[id] is built entirely from the
-- denormalized byline on `listings` (author_name, sponsor_names), which every
-- visitor can already read on every card. That page shows no fact that wasn't
-- already public.
--
-- Applying this widens that. It exposes, for MEMBERS ONLY, a fixed set of
-- fields to any signed-in viewer:
--
--   name, avatar_path, neighborhood, bio, linkedin_url, member_since
--
-- Deliberately NOT exposed: email (contact goes through the logged, forwarded
-- form — publishing addresses would undo migration 0011's whole point), role,
-- is_member for non-members, sponsor_id, and anything about accounts that are
-- not members. A Tier 1 account has no public profile at all.
--
-- SECURITY DEFINER with a narrow return type, rather than a SELECT policy on
-- accounts: a policy would open whole rows and every future column added to
-- that table would be public by default. This function exposes a list someone
-- had to type out, which is the property worth having.
--
-- Requires `authenticated`, not `anon`: a member's face and neighborhood should
-- not be available to a logged-out crawler. This is also why the landing
-- (public) names nobody while browse (any visitor) names everyone — a tension
-- flagged in app/design/landing/page.tsx and still open.
--
-- AFTER APPLYING, the follow-up is to have app/design/members/[id]/page.tsx
-- call this and render the avatar, "member since" and bio. Until that wiring
-- lands, applying this is inert.

create or replace function public.get_member_profile(target uuid)
returns table (
  name         text,
  avatar_path  text,
  neighborhood text,
  bio          text,
  linkedin_url text,
  member_since timestamptz
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
         a.created_at
    from public.accounts a
   where a.id = target
     -- Members only. An account that has not been approved has no public face.
     and a.is_member = true;
$$;

revoke all on function public.get_member_profile(uuid) from public, anon;
grant execute on function public.get_member_profile(uuid) to authenticated;
