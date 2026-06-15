-- Migration 0019: broaden the listings.type allowlist to add 'other' and 'service'.
--
-- 0003 declared the column as:
--   type text not null check (type in ('apartment', 'furniture'))
-- which Postgres named `listings_type_check`. This drops that CHECK and
-- recreates it with the two new categories, so members can post general
-- second-hand goods ('other') and services ('service') — moving toward the
-- GDC category breadth (real estate, home, services, jobs, …) rather than the
-- two-category MVP.
--
-- No data migration needed: every existing row is 'apartment' or 'furniture',
-- which remain valid. Additive and safe to run any time.
--
-- APPLY THIS TO PROD via the Supabase SQL editor before the frontend that
-- offers the new types is deployed (a row inserted as 'other'/'service' would
-- otherwise be rejected by the old constraint).

alter table public.listings drop constraint if exists listings_type_check;

alter table public.listings
  add constraint listings_type_check
  check (type in ('apartment', 'furniture', 'other', 'service'));

-- Verify:
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.listings'::regclass and conname = 'listings_type_check';
--   -- expect: CHECK (type = ANY (ARRAY['apartment','furniture','other','service']))
