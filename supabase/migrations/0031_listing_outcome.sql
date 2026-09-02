-- 0031 — why a listing came down.
--
-- WHY (George, 2026-09-02): "it would be useful for when a listing is taken
-- down for there to be a choice — was this listing fulfilled? So that we have
-- data on what was working and what wasn't."
--
-- THIS IS THE ONLY NUMBER THAT SAYS WHETHER THE NETWORK WORKS. Members,
-- listings and visits are counts of activity; none of them distinguish a board
-- that produces transactions from a newsletter with photographs. "Did this find
-- its person, and did it find them here" is the question the business rests on,
-- and it is answerable at exactly one moment — the takedown. A listing archived
-- without being asked is a fact lost permanently: it cannot be reconstructed
-- from the row, from the contact log, or by asking the member six weeks later.
-- Shipped before the first invitations (wave one, 7-13 Sep) for that reason and
-- no other — every listing archived before this column exists is a blank that
-- stays blank.
--
-- FOUR VALUES, NOT A BOOLEAN, and the two extra ones are the point.
--   'found_here'      sold / let / arranged, through Manhattanite
--   'found_elsewhere' sorted, but not through Manhattanite
--   'withdrawn'       changed their mind, no longer available
--   'no_luck'         nobody suitable came
-- A fulfilled yes/no collapses the three ways of not succeeding into one and
-- destroys both of the facts worth having. 'no_luck' is the failure signal —
-- it is what says which categories the network cannot serve yet. And
-- 'found_elsewhere' is the honesty check on the headline number: a member who
-- sells the table to their sister has fulfilled the listing without the network
-- doing anything, and counting that as a match would flatter us into believing
-- something untrue. Anything reporting on this column must treat 'found_here'
-- and 'found_elsewhere' as different outcomes, never as "fulfilled".
--
-- NULL IS MEANINGFUL AND WILL STAY COMMON. It means no member answered, and it
-- covers three distinct populations that must not be read as missing data:
--   1. Every listing archived before this migration ran.
--   2. Every listing an ADMIN took down. /admin/listings goes through
--      admin_archive_listing with its own required moderation note; a founder
--      removing somebody's listing is a moderation event, not the member
--      reporting an outcome, so that path deliberately never writes here.
--   3. A 'pending' listing withdrawn before it was ever published — the UI does
--      not ask, because a listing nobody could see cannot have found anyone.
-- So the denominator for any rate is member-archived, previously-published
-- listings, NOT every archived row.
--
-- WRITE-ONCE IN PRACTICE, NOT ENFORCED. There is no unarchive flow (see the
-- header of lib/listings/archive.ts), so a listing reaches 'archived' once and
-- the value is set in the same statement. No trigger guards it: the admin edit
-- path (0028) can already touch any column, and locking this one would buy
-- nothing while making a correction impossible.

alter table public.listings
  add column if not exists outcome text
    check (outcome in ('found_here', 'found_elsewhere', 'withdrawn', 'no_luck'));

comment on column public.listings.outcome is
  $c$Why the member took this listing down: found_here (sold/let/arranged through Manhattanite), found_elsewhere (sorted, but not through us), withdrawn (changed their mind), no_luck (nobody suitable came). NULL means no member answered -- archived before 2026-09-02, archived by an admin, or withdrawn while still pending. Never read NULL as "unfulfilled", and never merge found_here with found_elsewhere.$c$;

-- Reporting reads "archived listings grouped by outcome" and nothing else.
-- Partial: the column is null on every live row and on the admin-archived and
-- pre-migration ones, and none of those belong in the answer.
create index if not exists listings_outcome_idx
  on public.listings (outcome)
  where outcome is not null;

-- NO RLS CHANGE, AND THAT IS DELIBERATE. outcome rides on the existing
-- listings_write_member_own_update policy (0014) — the same policy that lets an
-- owner flip status to 'archived' lets them write this in the same statement.
-- Adding a policy here would be adding a second gate to a door that is already
-- locked. Who can READ it is likewise unchanged: listings_read_own (0016) shows
-- an owner their own archived rows, and the founder sees everything through the
-- admin console. It is never exposed to another member or to a guest, because
-- no read path a guest or a non-owner can reach selects this column.
