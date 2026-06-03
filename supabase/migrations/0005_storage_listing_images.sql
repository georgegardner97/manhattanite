-- Migration 0005: storage bucket + RLS for listing images
-- Phase 3 Slice 6 — image upload
--
-- Plain English, what it does:
--   1. Creates a PRIVATE Storage bucket called `listing-images`. Private
--      because the listings themselves are gated to signed-in users (the
--      Tier 0 → Tier 1 read wall); a public bucket would let anyone with a
--      direct image URL bypass that wall for the image bytes. With a private
--      bucket, the app serves images via short-lived signed URLs generated
--      server-side using the viewer's session — the read gate is real on
--      pixels the same way it's real on rows.
--   2. Sets a 5 MB per-file limit and restricts to common photo MIME types
--      at the bucket level. Client-side validation is the first line; this
--      is the database-side backstop.
--   3. Adds RLS policies on storage.objects scoped to this bucket:
--        - INSERT: only a Tier 2 member can upload, and only into a folder
--          whose first segment is their own auth.uid(). Path convention is
--          `{user_id}/{random_id}.{ext}` — see lib/storage/upload-listing-image.ts.
--        - SELECT: any signed-in user can read (mirrors the listings read
--          policy in 0003).
--        - DELETE: only the uploader can delete their own files. Update is
--          intentionally not policied — re-uploading is the path for now.
--   4. The member check goes through public.is_member() — same SECURITY
--      DEFINER helper used in 0003.

-- ---------------------------------------------------------------------------
-- 1. Bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,                       -- private
  5242880,                     -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. RLS policies on storage.objects (already RLS-enabled by Supabase)
-- ---------------------------------------------------------------------------

-- INSERT: only members, only into their own user folder.
-- storage.foldername(name) splits the path into an array of folder segments;
-- [1] is the first segment (Postgres arrays are 1-indexed). The app uploads
-- to `{auth.uid()}/{random}.{ext}`, so [1] equals the user's id.
create policy listing_images_member_upload
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_member()
  );

-- SELECT: any signed-in user. Anonymous visitors get nothing.
-- This mirrors the listings read policy: browsing requires an account.
create policy listing_images_authenticated_read
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'listing-images'
  );

-- DELETE: only the uploader, on their own files. Useful for "remove this
-- photo" flows later; not wired in the Slice 6 UI but the policy is here
-- so the moment we add a delete button, it's already safe.
create policy listing_images_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- 3. Verify with:
--    select id, public, file_size_limit, allowed_mime_types
--      from storage.buckets where id = 'listing-images';
--    select polname, polcmd from pg_policy
--      where polrelid = 'storage.objects'::regclass
--      and polname like 'listing_images_%';
--    -- expect: bucket row + 3 policies (insert/select/delete)
-- ---------------------------------------------------------------------------
