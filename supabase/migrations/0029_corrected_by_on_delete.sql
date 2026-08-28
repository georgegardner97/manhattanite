-- 0029 — corrected_by must not pin an admin account in place.
--
-- THE BUG, AND HOW IT SURFACED. 0028 added
--   corrected_by uuid references public.accounts(id)
-- with no ON DELETE action, which defaults to NO ACTION. So once an admin has
-- corrected a single listing, their accounts row can never be deleted: the
-- listing holds a reference to it. accounts cascades from auth.users, so the
-- auth delete fails too, with the unhelpful message "Database error deleting
-- user".
--
-- It surfaced within one run of npm run audit:rls. That harness creates a
-- synthetic admin, and the new 0028 cells have it correct a listing -- which is
-- the whole point of the cells. Cleanup then could not remove the synthetic
-- admin, and the audit died in its own teardown, leaving four synthetic users
-- and a synthetic listing behind in production. That is the worst shape of
-- failure for a trust check: it does not report a problem, it becomes one.
--
-- WHY SET NULL AND NOT CASCADE OR RESTRICT.
--   CASCADE would delete the LISTING when an admin account went away, which is
--     absurd -- the listing belongs to a member who has nothing to do with it.
--   RESTRICT is the behaviour we already have, only louder.
--   SET NULL keeps corrected_at, so the record that a correction HAPPENED
--     survives; only the pointer to who made it is lost. That is the right
--     trade, because the member-facing copy names nobody anyway: it reads
--     "Corrected by Manhattanite", never a person. The audit trail that matters
--     to a member is that their listing was touched, and that is preserved.
--
-- Applied by hand in the SQL editor. Dollar-quoted where a body is needed and
-- free of apostrophes in prose, because the editor auto-pairs a typed
-- apostrophe and silently doubles it.

alter table public.listings
  drop constraint if exists listings_corrected_by_fkey;

alter table public.listings
  add constraint listings_corrected_by_fkey
  foreign key (corrected_by)
  references public.accounts(id)
  on delete set null;

comment on column public.listings.corrected_by is
  'Admin who last corrected this listing, or null if that account has since been deleted. Shown to the owner only as "Corrected by Manhattanite" -- the person is never named to the member, which is why losing this pointer is acceptable and blocking the delete was not.';

-- ---------------------------------------------------------------------------
-- Verify with:
--
--    -- (a) the constraint now sets null on delete (confdeltype = n):
--    select conname, confdeltype from pg_constraint
--     where conrelid = 'public.listings'::regclass
--       and conname = 'listings_corrected_by_fkey';
--      -- expect: 1 row, confdeltype = n   (a = no action, n = set null)
--
--    -- npm run audit:rls proves it end to end: the run creates a synthetic
--    -- admin, has it correct a listing, and then DELETES that admin in
--    -- teardown. Before this migration that teardown failed outright.
-- ---------------------------------------------------------------------------
