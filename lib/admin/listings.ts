// Admin write paths for any listing — Slice 3b.
//
// THE HOLE THIS CLOSES. Until now an admin had no handle on a listing once it
// went live. The three 0017 verbs (approve / return / reject) act on the review
// QUEUE, and the queue is status='pending' only; RLS on listings is owner-only
// for writes. So a phone number in public, or a phrase that trips fair housing,
// needed a hand-written SQL statement to remove.
//
// THE POLICY IS THE WALL, THE FUNCTION IS THE DOOR. Neither of these actions
// writes to `listings` directly — they call the two SECURITY DEFINER functions
// added in 0028, which carry the admin guard in the database. The owner-only
// RLS policy is untouched, so admin write access exists at exactly two named
// entry points and nowhere else. requireAdmin() here is the polite layer; the
// function checks again, and audit:rls attacks both.
//
// SCOPE OF AN ADMIN EDIT IS CORRECTION, NOT REWRITING (George, 28 Aug):
// spelling, a factual error, a cover photo that should not be the cover. Never
// a rewrite of what a member said under their own name. Two things enforce the
// spirit rather than the letter:
//   - the write set is identical to the member edit path, so an admin cannot
//     reach a field a member could not have set themselves;
//   - every correction stamps corrected_by / corrected_at, and the owner sees
//     "Corrected by Manhattanite" on their own listing. No email per typo — the
//     point is that a change is visible, not that somebody gets pinged.
//
// A CORRECTION MUST NOT RE-PEND THE LISTING. admin_update_listing never writes
// `status`, so a live listing stays live. (Worth knowing: no edit path in this
// product re-pends anything today — updateListing does not write status either,
// and the 0017 trigger treats an unchanged status as a content edit. The edit
// screen's copy claims otherwise; see the note in COMPANY/memory.md.)

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { parseListingForm } from "@/lib/listings/form";

export type AdminListingState = { error: string | null };

/** Postgres errors, in the language of the person reading the screen. */
function readableError(message: string): string {
  if (message.includes("not authorized")) {
    return "Your account isn't authorized to do that.";
  }
  if (message.includes("already archived")) {
    return "That listing is already down.";
  }
  if (message.includes("not found")) {
    return "That listing no longer exists.";
  }
  if (message.includes("a reason is required")) {
    return "Give the reason — it stays on the record with the listing.";
  }
  return "Something went wrong. Try again in a moment.";
}

function refresh(id: string) {
  revalidatePath("/admin/listings");
  revalidatePath("/admin/moderation");
  revalidatePath("/listings");
  revalidatePath("/listings/mine");
  revalidatePath(`/listings/${id}`);
}

/**
 * Correct any listing, whatever its status and whoever wrote it.
 *
 * The photo prefixes are the subtle part. Existing photos live in the OWNER's
 * Storage folder; anything the admin adds lands in the ADMIN's, because
 * ClImageUpload writes to the signed-in user's folder and the Storage policy
 * only lets them write there. Both are allowed. Passing just the editor's
 * folder — the member rule — would reject every photo the member had already
 * uploaded and fail the save with a message about Storage.
 */
export async function adminUpdateListing(
  _prevState: AdminListingState,
  formData: FormData
): Promise<AdminListingState> {
  const { supabase, user } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Something went wrong saving. Try again in a moment." };
  }

  // Admin read-all (0015) returns the row at any status.
  const { data: existing } = await supabase
    .from("listings")
    .select("author_id")
    .eq("id", id)
    .maybeSingle<{ author_id: string }>();

  if (!existing) {
    return { error: "That listing no longer exists." };
  }

  const parsed = parseListingForm(formData, [
    `${existing.author_id}/`,
    `${user.id}/`,
  ]);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const { type, title, description, price_cents, details, images } = parsed.value;

  const { error } = await supabase.rpc("admin_update_listing", {
    p_listing_id: id,
    p_type: type,
    p_title: title,
    p_description: description,
    p_price_cents: price_cents,
    p_details: details,
    p_images: images,
  });

  if (error) {
    console.error("admin_update_listing failed:", error);
    return { error: readableError(error.message) };
  }

  refresh(id);
  return { error: null };
}

/**
 * Take any listing down, whatever its status. Soft delete — the row and its
 * moderation history stay, and nothing in this product hard-deletes a listing.
 *
 * Distinct from rejectListing (0017), which is the QUEUE verb: that one accepts
 * pending and published only and emails the member "About your listing". This
 * is the DIRECTORY verb — it answers "this is live and it has to come down
 * now". The note is required either way, because a take-down with no recorded
 * reason is what turns a trust layer into an opinion.
 */
export async function adminArchiveListing(
  _prevState: AdminListingState,
  formData: FormData
): Promise<AdminListingState> {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!id) {
    return { error: "Something went wrong. Try again in a moment." };
  }
  // Checked here and again in the function, because the reason is the record.
  if (!note) {
    return { error: "Give the reason — it stays on the record with the listing." };
  }

  const { error } = await supabase.rpc("admin_archive_listing", {
    p_listing_id: id,
    p_note: note,
  });

  if (error) {
    console.error("admin_archive_listing failed:", error);
    return { error: readableError(error.message) };
  }

  refresh(id);
  return { error: null };
}
