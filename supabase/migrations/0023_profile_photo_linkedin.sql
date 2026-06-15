-- Migration 0023: optional profile photo + LinkedIn — member profile fields.
--
-- Members can add a profile photo and a LinkedIn link (both optional — a nudge,
-- not a wall; the trust comes from sponsorship + real names, not the photo).
--
--   accounts.avatar_path  — storage path in the new public 'avatars' bucket.
--   accounts.linkedin_url — the member's LinkedIn (or other) profile link.
--
-- Neither is a protected column (0001's protect_account_columns guards only
-- role/is_member/sponsor_id/email), so a member updates them through the
-- existing "accounts: update own row" RLS, same path as name/neighborhood/bio.
--
-- The avatars bucket is PUBLIC (unlike private listing-images): a profile photo
-- is low-sensitivity, the path is a random UUID, and a public bucket means the
-- profile page renders it with a plain URL — no signed-URL round trip. Writes
-- are still owner-only via RLS; only reads are public.

alter table public.accounts add column avatar_path text;
alter table public.accounts add column linkedin_url text;

-- ---------------------------------------------------------------------------
-- avatars bucket (public read, owner-only writes)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Owner-only upload/update/delete, scoped to the user's own folder (the first
-- path segment must equal their uid) — same convention as listing-images (0005).
create policy avatars_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No SELECT policy needed: the bucket is public, so reads go through the public
-- URL and bypass RLS. (Writes above are the only gated operations.)

-- Verify:
--   select id, public from storage.buckets where id = 'avatars';  -- public = t
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='accounts'
--      and column_name in ('avatar_path','linkedin_url');          -- 2 rows
