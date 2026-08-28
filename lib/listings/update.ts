// Server action for editing a listing — Edit & Remove slice.
//
// Member-gated, owner-only write path. Mirrors create.ts: the edit route
// (app/listings/[id]/edit/page.tsx) redirects non-members and non-authors
// away before the form renders; this action re-checks session + membership +
// ownership and leans on the Slice 4 RLS update policy
// (listings_write_member_own_update: author_id = auth.uid() AND is_member())
// as the real, database-level gate. Both layers stay — the redirect is UX,
// RLS is the wall.
//
// The write set is ONLY: type, title, description, price_cents, details,
// images. Never status, never author_id, never the byline columns
// (author_name / sponsor_names) — the byline is populated by the BEFORE
// INSERT trigger (0006/0012) and propagated from accounts/sponsorships
// changes; an edit must not recompute it.
//
// RLS note: a non-owner's UPDATE doesn't error — the policy's USING clause
// simply filters the row out and the update matches 0 rows. So we check the
// returned row, not an error code.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseListingForm } from "@/lib/listings/form";

export type UpdateListingState = { error: string | null };

export async function updateListing(
  _prevState: UpdateListingState,
  formData: FormData
): Promise<UpdateListingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session — bounce to sign in. (The route guard handles this too; this
  // is the action-layer equivalent.)
  if (!user) {
    redirect("/login");
  }

  // Member check — non-members go to /profile, where the membership nudge
  // lives. RLS would block the write anyway; this keeps the failure clean.
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
    return { error: "Something went wrong saving your changes. Try again in a moment." };
  }

  // Ownership pre-check (defense in depth — the RLS update policy is the
  // real gate). listings_read_own (0016) returns the row whatever its status;
  // a wrong author means this listing isn't the editor's to touch. The status
  // rides along to pick the post-save destination below.
  const { data: existing } = await supabase
    .from("listings")
    .select("author_id, status")
    .eq("id", id)
    .maybeSingle<{ author_id: string; status: string }>();

  if (!existing || existing.author_id !== user.id) {
    return { error: "Only your own listings can be edited." };
  }

  // ---- Parse the form ----
  // Shared with the admin correction path (lib/listings/form.ts). `details` is
  // rebuilt WHOLESALE from what the form posts, so a field the parser forgets
  // is a field this save DELETES — which is exactly how furniture listings lost
  // their neighborhood. One parser, so there is one place to forget it.
  //
  // A member may only reference photos in their own Storage folder.
  const parsed = parseListingForm(formData, [`${user.id}/`]);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const { type, title, description, price_cents, details, images } = parsed.value;

  // ---- Update. RLS is the final gate. ----
  // The write set deliberately excludes status, author_id, and the byline
  // columns — the 0017 trigger sees an unchanged status and waves the content
  // edit through. The id + author_id filters scope the row; .select()
  // afterwards is safe because the owner can read their own rows at any
  // status (0016, listings_read_own).
  const { data: updated, error } = await supabase
    .from("listings")
    .update({
      type,
      title,
      description,
      price_cents,
      details,
      images,
    })
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    if (error) console.error("Failed to update listing:", error);
    return {
      error: "Something went wrong saving your changes. Try again in a moment.",
    };
  }

  revalidatePath("/listings");
  revalidatePath("/listings/mine");
  revalidatePath(`/listings/${id}`);
  revalidatePath("/admin/moderation");
  // The guest teaser is an unstable_cache entry, not a route render, so
  // revalidatePath does not reach it. A published listing that was edited is a
  // listing a logged-out visitor may be looking at right now.
  updateTag("listings");

  // Success: a live listing shows the edit on its own page; anything not
  // published has no public page, so My Listings is the confirmation.
  if (existing.status === "published") {
    redirect(`/listings/${id}`);
  }
  redirect("/listings/mine");
}
