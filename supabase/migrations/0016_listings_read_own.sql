-- Migration 0016: members can read their OWN listings (any status)
-- Edit & Remove slice — the real fix that unblocks archive.
--
-- APPLIED TO PROD by Cowork via the SQL editor on 2026-06-11 (same as 0012–0015).
--
-- Supersedes the parked 0016_listings_drop_restrictive_status_pin.sql, which was
-- based on a wrong hypothesis. A live pg_policy read of prod (2026-06-11) proved:
--   - restrictive policy count on public.listings = 0  → there is NO hidden
--     RESTRICTIVE policy. Dropping "restrictive policies" would be a no-op.
--   - the UPDATE policy's WITH CHECK already allows 'archived' (0014 worked):
--       ((author_id = auth.uid()) AND is_member() AND status = ANY (ARRAY['published','archived']))
--   - there was NO SELECT policy letting a member read their own non-published
--     rows. The only SELECT policies were published-for-accounts, published-for-anon,
--     and admin-read-all.
--
-- That last gap is the real blocker. Archiving sets status = 'archived'; the
-- archive action reads the row back (PostgREST RETURNING / supabase-js .select()),
-- but no policy let the owning member SELECT their own archived row — so the
-- read-back returned nothing and the archive appeared to fail. It also meant a
-- member's archived (or future draft) listings would vanish from /listings/mine
-- entirely. The earlier "WITH CHECK violation on archived" finding was from the
-- pre-0014 probe; post-0014 the block moved to this SELECT gap.
--
-- The fix is additive and minimal: a permissive SELECT policy scoped to own rows.
-- It only ADDS read access to a user's own listings (any status); it exposes
-- nothing of anyone else's. OR-ed with the existing SELECT policies.

drop policy if exists listings_read_own on public.listings;

create policy listings_read_own
  on public.listings
  for select
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Verify with:
--   select polname, case when polpermissive then 'PERMISSIVE' else 'RESTRICTIVE' end as kind,
--          polcmd::text as cmd, pg_get_expr(polqual, polrelid) as using_clause
--   from pg_policy where polrelid = 'public.listings'::regclass order by polname;
--   -- expect listings_read_own (PERMISSIVE, r, using (author_id = auth.uid()))
--   -- alongside the existing SELECT/INSERT/UPDATE policies, and still NO delete policy.
--   Then: npm run test:edit-archive  →  all green.
-- ---------------------------------------------------------------------------
