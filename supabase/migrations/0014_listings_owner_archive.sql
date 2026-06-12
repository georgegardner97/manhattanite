-- Migration 0014: let owners archive their own listings (PROPOSED — NOT YET APPLIED)
-- Edit & Remove slice — unblocks the soft-delete ("Remove") flow.
--
-- STATUS: DRAFT. Do not treat as applied until George runs it in the SQL
-- editor and the edit-archive harness goes green.
--
-- Why this exists — prod has drifted from the repo:
--   Migration 0003 in this repo defines listings_write_member_own_update with
--     with check (author_id = auth.uid() and public.is_member())
--   but the policy LIVE IN PROD also pins the row's status: a member's update
--   succeeds only while status stays 'published'. Verified empirically on
--   2026-06-11 (scripts/probe-listing-policies.ts, synthetic member):
--     - update of title/price/details/images → OK
--     - update status -> 'archived'          → blocked (WITH CHECK violation)
--     - update status -> 'draft'             → blocked (WITH CHECK violation)
--     - update keeping status = 'published'  → OK
--     - DELETE of own row                    → OK (hard delete!)
--   Nothing in the migrations or the decision logs records that status pin, so
--   it's drift from a hand-applied SQL-editor run, not a documented decision.
--
-- What this migration does:
--   1. Recreates the UPDATE policy with a status allowlist: a member may keep
--      their own listing 'published' or move it to 'archived' (the soft
--      delete). 'draft' stays blocked — drafts aren't a product state yet, and
--      an invisible-but-editable row would be a moderation blind spot.
--   2. Drops the member DELETE policy. "Soft-delete only" is the locked
--      product decision (preserves listing_contacts moderation history), but
--      the live DELETE policy lets any member hard-delete their rows straight
--      through the API, bypassing the product entirely. Closing it makes the
--      database enforce the decision. (Admin/service-role deletes still work —
--      service role bypasses RLS.)
--
-- Plain English: after this runs, a member can edit their own listings and
-- take them off the network (archive), but nobody below admin can make a
-- listing vanish from the database.

-- ---------------------------------------------------------------------------
-- 1. UPDATE policy: own rows, member only, status limited to publish/archive
-- ---------------------------------------------------------------------------
drop policy if exists listings_write_member_own_update on public.listings;

create policy listings_write_member_own_update
  on public.listings
  for update
  using (author_id = auth.uid() and public.is_member())
  with check (
    author_id = auth.uid()
    and public.is_member()
    and status in ('published', 'archived')
  );

-- ---------------------------------------------------------------------------
-- 2. No member hard-deletes — archive is the only member-facing removal
-- ---------------------------------------------------------------------------
drop policy if exists listings_write_member_own_delete on public.listings;

-- ---------------------------------------------------------------------------
-- 3. Verify with:
--    select polname, polcmd,
--           pg_get_expr(polqual, polrelid)      as using_clause,
--           pg_get_expr(polwithcheck, polrelid) as with_check_clause
--    from pg_policy where polrelid = 'public.listings'::regclass;
--    -- expect: SELECT x2 (accounts + anon teaser), INSERT, UPDATE (with the
--    -- status allowlist), and NO delete policy.
--    Then: npm run test:edit-archive  →  all green.
-- ---------------------------------------------------------------------------
