// Server action for removing a listing — Edit & Remove slice.
//
// "Remove" is a soft delete: status flips to 'archived'. The row (and its
// listing_contacts moderation history) stays in the database; it just drops
// out of every published-only read. No hard deletes — reversible by us, and
// the moderation trail survives.
//
// Member-gated, owner-only, same defense-in-depth as update.ts: the action
// re-checks session + membership + ownership, and the RLS update policy
// (listings_write_member_own_update) is the real, database-level gate.
//
// Two RLS facts shape this file:
//   1. No .select() after the update — we don't need the row back; the
//      revalidate + re-render is the confirmation. (Migration 0016 added
//      listings_read_own, so the owner CAN now read their own archived row;
//      the bare update is simply the minimal write.)
//   2. There is deliberately no unarchive action yet. The owner can now read
//      their own archived rows (0016), so a future slice could add an
//      unarchive/republish flow + surface archived listings on /listings/mine
//      — but the trust-safe republish UX is out of scope for this slice.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ArchiveListingState = { error: string | null };

export async function archiveListing(
  _prevState: ArchiveListingState,
  formData: FormData
): Promise<ArchiveListingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .single<{ is_member: boolean }>();

  if (!account?.is_member) {
    redirect("/profile");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Something went wrong removing your listing. Try again in a moment." };
  }

  // Ownership pre-check on the still-published row (defense in depth — RLS
  // is the wall; a non-owner's update would silently match 0 rows anyway).
  const { data: existing } = await supabase
    .from("listings")
    .select("author_id")
    .eq("id", id)
    .maybeSingle<{ author_id: string }>();

  if (!existing || existing.author_id !== user.id) {
    return { error: "Only your own listings can be removed." };
  }

  // Soft delete. status is the ONLY column written. No .select() — see the
  // header note on RETURNING vs the published-only read policy.
  const { error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    console.error("Failed to archive listing:", error);
    return {
      error: "Something went wrong removing your listing. Try again in a moment.",
    };
  }

  revalidatePath("/listings");
  revalidatePath("/listings/mine");
  revalidatePath(`/listings/${id}`);

  // No redirect: the caller (the My Listings row) re-renders and the listing
  // is simply gone — that's the confirmation.
  return { error: null };
}
