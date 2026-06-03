// Server-side helper: turn storage paths into short-lived signed URLs.
//
// The listing-images bucket is private (see migration 0005), so a logged-in
// user's browser needs a signed URL to fetch an image. We mint these on the
// server using the viewer's Supabase session — so the read gate is real on
// pixels the same way it's real on rows.
//
// 1 hour expiry is long enough for a typical browse session, short enough
// that a leaked URL is not a durable bypass. Server Components are dynamic
// already (force-dynamic on the listings pages) so the signature regenerates
// on each request.

import { createClient } from "@/lib/supabase/server";

const BUCKET = "listing-images";
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour

/**
 * Sign a batch of image paths in one round-trip.
 * Returns a Map keyed by path — missing/failed paths are simply absent from
 * the map, so callers can default to "no image" cleanly.
 */
export async function signImagePaths(
  paths: string[],
  expiresIn: number = DEFAULT_EXPIRES_IN_SECONDS
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresIn);

  if (error || !data) {
    console.error("Failed to sign image URLs:", error);
    return result;
  }

  for (const item of data) {
    if (item.signedUrl && item.path) {
      result.set(item.path, item.signedUrl);
    }
  }
  return result;
}
