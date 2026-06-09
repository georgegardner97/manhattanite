-- Migration 0010: anon teaser read on listings
-- Navigation slice — the data-layer expression of the D1 decision (2026-06-09).
--
-- D1: the trust gate sits at the ACTION layer (post / contact / sponsor), not
-- the VIEWING layer. Viewing is a funnel, not the moat. So logged-out (anon)
-- visitors are allowed to READ published listings — the app caps them to a
-- teaser (the 6 most recent) IN THE QUERY, deliberately, not in this policy.
-- A hard, un-bypassable cap would need a SECURITY DEFINER function; that's
-- out of scope for MVP and noted as a follow-up if ever wanted.
--
-- The existing policy (0003) `listings_read_published_for_accounts` keeps
-- gating signed-in reads with `status = 'published' and auth.uid() is not null`.
-- That clause returns zero rows for anon (auth.uid() is null), which is why a
-- dedicated anon policy is needed. RLS policies are OR-ed, so this only ADDS
-- anon read of published rows; nothing about the authenticated path changes,
-- and the write policies (the real wall) are untouched.

create policy listings_read_published_for_anon
  on public.listings
  for select
  to anon
  using (status = 'published');

-- Verify with:
--   select polname, polcmd, polroles::regrole[] , pg_get_expr(polqual, polrelid)
--   from pg_policy where polrelid = 'public.listings'::regclass;
--   -- expect the new SELECT policy scoped to {anon}, alongside the existing 4.
