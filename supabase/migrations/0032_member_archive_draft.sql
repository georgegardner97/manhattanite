-- 0032 — a member may take down a listing a moderator returned.
--
-- PROPOSED — NOT YET APPLIED. George runs this in the Supabase SQL editor.
-- Whether it has been applied is a fact about the database, not about this
-- file: check with the first query in the Verify block at the foot.
--
-- WHY (George, 2026-09-15): "They should have the option to take it down but
-- it should not be front and centre."
--
-- WHAT WAS WRONG. When a moderator returns a listing with feedback
-- (return_listing, 0017) it goes to status draft. The edit screen has always
-- offered that member a take-down control, and it has never worked: the 0017
-- trigger lets a member move pending to archived and published to archived,
-- but not draft to archived, so the member picked a reason and got the
-- generic error. Nobody noticed because the only drafts that exist are the
-- ones a moderator creates, and until wave one there was nobody to return
-- anything to.
--
-- WHAT THIS CHANGES — ONE LINE. The member take-down branch in
-- enforce_listing_status_transition() now includes draft. Nothing else moves:
--   - anything to published is still refused (42501), for every member;
--   - the INSERT branch is untouched, so nothing is born outside review;
--   - draft to pending (resubmit after feedback) is untouched;
--   - no RLS policy changes. listings_write_member_own_update still limits the
--     write to your own row; the trigger still owns which status moves are legal.
--
-- The whole function is restated below because CREATE OR REPLACE replaces a
-- function whole. It is byte-for-byte the 0017 body apart from the one
-- marked line, and the trigger itself does not need recreating.
--
-- THE OUTCOME COLUMN (0031) STAYS NULL FOR A DRAFT. A returned draft was never
-- published, so it cannot have found anyone, and the interface does not ask.
-- That matches how a pending take-down is already recorded.
--
-- Written dollar-quoted and apostrophe-free: the SQL editor auto-pairs a typed
-- apostrophe and silently doubles it.

create or replace function public.enforce_listing_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role / SQL-editor path (no JWT) or a signed-in admin: any change.
  if auth.uid() is null or exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    return new;
  end if;

  -- Member INSERT: new listings start in review. Nothing is born published.
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      return new;
    end if;
    raise exception 'not allowed: new listings start in review'
      using errcode = '42501';
  end if;

  -- Member UPDATE: the three legal moves.
  if new.status = old.status then
    return new;                                      -- content edit
  end if;
  if old.status in ('draft', 'pending', 'published') and new.status = 'archived' then
    return new;                                      -- take down own listing (0032: + draft)
  end if;
  if old.status = 'draft' and new.status = 'pending' then
    return new;                                      -- resubmit after feedback
  end if;

  -- Everything else — above all, anything to published.
  raise exception 'not allowed: members cannot make that status change'
    using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------
-- Verify with:
-- ---------------------------------------------------------------------------
--
-- 1. Is it applied? Expect widened = true.
--
--   select pg_get_functiondef($f$public.enforce_listing_status_transition$f$::regproc)
--     ~ $r$old\.status in \(.draft., .pending., .published.\) and new\.status = .archived.$r$
--     as widened;
--
-- 2. The positive: a member can archive their own draft. Replace MEMBER_ID
--    with a member account id and DRAFT_ID with a draft listing that member
--    owns. Expect "UPDATE 1". Rolled back, so nothing is changed.
--
--   begin;
--   set local role authenticated;
--   select set_config($k$request.jwt.claims$k$,
--     json_build_object($k$sub$k$, $v$MEMBER_ID$v$, $k$role$k$, $k$authenticated$k$)::text, true);
--   update public.listings set status = $s$archived$s$ where id = $i$DRAFT_ID$i$::uuid;
--   rollback;
--
-- 3. The negative that must still hold: the same member cannot publish that
--    draft. Expect ERROR 42501 "not allowed: members cannot make that status
--    change". Rolled back.
--
--   begin;
--   set local role authenticated;
--   select set_config($k$request.jwt.claims$k$,
--     json_build_object($k$sub$k$, $v$MEMBER_ID$v$, $k$role$k$, $k$authenticated$k$)::text, true);
--   update public.listings set status = $s$published$s$ where id = $i$DRAFT_ID$i$::uuid;
--   rollback;
