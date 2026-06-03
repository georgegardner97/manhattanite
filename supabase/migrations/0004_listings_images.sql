-- Migration 0004: add images column to listings
-- Phase 3 Slice 6 — image upload
--
-- Plain English, what it does:
--   1. Adds an `images` JSONB column to public.listings, defaulting to an
--      empty array. Each item is a small object: { "path": "..." } where
--      `path` is the Storage path (relative to the listing-images bucket).
--      JSON over text[] so we have room to grow (alt text, dimensions, sort
--      order) without another schema change.
--   2. Adds a CHECK constraint: must be a JSON array, and ≤ 6 items. The
--      app-side limit is also 6; this is the database backstop.
--   3. Existing rows (the two founder test listings) get the default value
--      automatically — text-only listings continue to render fine.
--
-- Note: storage bucket + RLS for the actual image files lives in 0005.

-- ---------------------------------------------------------------------------
-- 1. Add the column
-- ---------------------------------------------------------------------------
alter table public.listings
  add column images jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. Shape + size CHECK
-- ---------------------------------------------------------------------------
-- jsonb_typeof = 'array' rejects objects and scalars.
-- jsonb_array_length ≤ 6 caps the count.
-- Both clauses are nullable-safe because the column is NOT NULL with a default.
alter table public.listings
  add constraint listings_images_is_capped_array
  check (
    jsonb_typeof(images) = 'array'
    and jsonb_array_length(images) <= 6
  );

-- ---------------------------------------------------------------------------
-- 3. Verify with:
--    select id, jsonb_array_length(images) as n from public.listings;
--    -- expect: every existing row → 0
-- ---------------------------------------------------------------------------
