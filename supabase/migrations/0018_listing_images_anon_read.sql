-- Migration 0018: anon read of listing images (the teaser shows them to guests)
--
-- APPLIED TO PROD by Cowork via the SQL editor on 2026-06-12.
--
-- The gap: migration 0010 opened anon (logged-out) read of PUBLISHED listing ROWS
-- so guests get the teaser browse + the landing "On the network" glimpse. But the
-- listing-images storage bucket's read policy (0005, listing_images_authenticated_read)
-- is authenticated-only. So a guest sees listing text with NO photos — which defeats
-- the whole point of the seeded images, and is exactly what a person you demo the
-- site to would see.
--
-- The fix: an anon SELECT policy on the listing-images bucket, parallel to the
-- existing authenticated one. Consistent with the privacy posture — the bucket
-- stays private, paths are random UUIDs, and reads still go through short-lived
-- signed URLs (nothing becomes crawlable or publicly enumerable). It simply lets a
-- logged-out visitor's anon client mint a signed URL for an image it's already
-- allowed to see the listing for.
--
-- (A stricter version would scope anon read to only published listings' images, but
-- a storage policy can't cheaply join object path → listing status; the random-path
-- + signed-URL model makes the simple bucket-scoped policy an acceptable match for
-- the already-public teaser.)

create policy listing_images_anon_read
  on storage.objects
  for select
  to anon
  using (bucket_id = 'listing-images');

-- Verify:
--   select polname, polcmd::text,
--          coalesce((select rolname from pg_roles where oid = any(polroles)),'?') as role
--   from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace
--   where n.nspname='storage' and c.relname='objects' and p.polname like 'listing_images%';
--   -- expect listing_images_anon_read (r, anon) alongside the authenticated/upload/delete ones.
-- Then reload manhattanite.com/listings logged-OUT — covers should render.
