// Server action for resubmitting a returned listing — Listing Moderation slice.
//
// A listing an admin returned with feedback sits in status='draft', visible
// only to its owner on /listings/mine alongside the moderation note. Once the
// member has addressed the feedback (via the existing Edit flow), Resubmit
// moves it draft → pending and it rejoins the review queue.
//
// Member-gated, owner-only, same defense-in-depth as archive.ts: the action
// re-checks session + membership + ownership; the RLS update policy
// (listings_write_member_own_update) scopes the row, and the 0017 status-
// transition trigger is the real gate — draft → pending is one of the three
// member-legal moves (and anything → published is not).
//
// The moderation note deliberately survives the resubmit: the admin reviewing
// the resubmission sees what they asked for last time. approve_listing clears
// it when the listing finally goes live.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResubmitListingState = { error: string | null };

export async function resubmitListing(
  _prevState: ResubmitListingState,
  formData: FormData
): Promise<ResubmitListingState> {
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
    return { error: "Something went wrong resubmitting. Try again in a moment." };
  }

  // Ownership + state pre-check (defense in depth — RLS scopes the row and
  // the trigger owns the transition; this keeps the failure clean).
  const { data: existing } = await supabase
    .from("listings")
    .select("author_id, status")
    .eq("id", id)
    .maybeSingle<{ author_id: string; status: string }>();

  if (!existing || existing.author_id !== user.id) {
    return { error: "Only your own listings can be resubmitted." };
  }
  if (existing.status !== "draft") {
    return { error: "This listing isn't waiting on changes. Refresh the page." };
  }

  // status is the ONLY column written; the .eq('status','draft') filter makes
  // a double-submit a clean no-op instead of a trigger error.
  const { error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("Failed to resubmit listing:", error);
    return {
      error: "Something went wrong resubmitting. Try again in a moment.",
    };
  }

  revalidatePath("/listings/mine");
  revalidatePath("/admin/moderation");

  // No redirect: the row re-renders under its "In review" badge — that's the
  // confirmation.
  return { error: null };
}
