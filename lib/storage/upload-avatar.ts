// Client-side helper: upload one profile photo to the public 'avatars' bucket.
// Mirrors upload-listing-image, but a single file and a different bucket.
//
// Path convention `{user_id}/{random}.{ext}` is load-bearing: the storage RLS
// upload policy (migration 0023) checks the first folder segment == auth.uid(),
// so a member can only write into their own folder. MIME + size are validated
// here for fast feedback and re-enforced by the bucket limits server-side.

"use client";

import { createClient } from "@/lib/supabase/client";

export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AvatarUploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<AvatarUploadResult> {
  if (
    !AVATAR_ALLOWED_TYPES.includes(
      file.type as (typeof AVATAR_ALLOWED_TYPES)[number]
    )
  ) {
    return { ok: false, error: "Photo must be JPG, PNG, or WebP." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Photo must be 5 MB or smaller." };
  }

  const ext = EXTENSION_BY_TYPE[file.type];
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Avatar upload failed:", error);
    return { ok: false, error: "Photo upload failed. Try again in a moment." };
  }

  return { ok: true, path };
}
