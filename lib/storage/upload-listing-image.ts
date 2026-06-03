// Client-side helper: upload one image file to the listing-images bucket.
// Called from app/components/ImageUpload.tsx during the post-a-listing flow.
//
// The path convention `{user_id}/{random}.{ext}` is load-bearing: the
// storage RLS policy (migration 0005) checks that the first folder segment
// matches auth.uid(), so a user can only upload into their own folder. The
// random uuid avoids collisions between two uploads of the same filename.
//
// MIME type + size validation happens here (UX-fast feedback) AND is enforced
// by the bucket-level `allowed_mime_types` + `file_size_limit` in 0005 —
// belt and braces. The DB is the source of truth.

"use client";

import { createClient } from "@/lib/supabase/client";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGES_PER_LISTING = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export async function uploadListingImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { ok: false, error: "Photos must be JPG, PNG, or WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Photos must be 5 MB or smaller." };
  }

  const ext = EXTENSION_BY_TYPE[file.type];
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload failed:", error);
    return {
      ok: false,
      error: "Photo upload failed. Try again in a moment.",
    };
  }

  return { ok: true, path };
}
