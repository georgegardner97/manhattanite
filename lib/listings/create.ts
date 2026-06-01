// Server action for posting a listing — Phase 3 Slice 5.
//
// Member-gated write path. The route (app/listings/new/page.tsx) already
// redirects non-members away before the form renders; this action re-checks
// auth and leans on the Slice 4 RLS write policy
// (listings_write_member_own_insert: author_id = auth.uid() AND is_member())
// as the real, database-level gate. Both layers stay — the redirect is UX,
// RLS is the wall.
//
// Returns a { error } state for inline display (used with useActionState in
// the client form). On a clean insert it redirect()s to the new listing's
// detail page — the listing appearing IS the success state, no celebration
// copy. If RLS rejects the insert (a non-member somehow reached here), we
// send them to /profile, where the membership nudge lives.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateListingState = { error: string | null };

// Postgres raises 42501 ("insufficient_privilege") when a row violates an RLS
// policy — that's the member gate firing for a non-member.
const RLS_VIOLATION = "42501";

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 2000;

export async function createListing(
  _prevState: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session — bounce to sign in. (The route guard handles this too; this
  // is the action-layer equivalent.)
  if (!user) {
    redirect("/login");
  }

  // ---- Pluck + validate shared fields ----
  const type = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (type !== "apartment" && type !== "furniture") {
    return { error: "Pick a listing type to get started." };
  }
  if (!title) {
    return { error: "Give your listing a title." };
  }
  if (title.length > MAX_TITLE) {
    return { error: `Keep the title to ${MAX_TITLE} characters or fewer.` };
  }
  if (!description) {
    return { error: "Add a few lines describing what you're listing." };
  }
  if (description.length > MAX_DESCRIPTION) {
    return {
      error: `That description is a little long — keep it under ${MAX_DESCRIPTION} characters.`,
    };
  }

  const priceDollars = Number(priceRaw);
  if (!priceRaw || Number.isNaN(priceDollars) || priceDollars < 0) {
    return {
      error:
        type === "apartment"
          ? "Add a monthly rent, in dollars."
          : "Add an asking price, in dollars.",
    };
  }
  const price_cents = Math.round(priceDollars * 100);

  // ---- Build the type-specific details (JSONB) ----
  // Only non-empty values go in, so the detail page doesn't render blank rows.
  const details: Record<string, unknown> = {};

  if (type === "apartment") {
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();
    const bedrooms = String(formData.get("bedrooms") ?? "").trim();
    const bathrooms = String(formData.get("bathrooms") ?? "").trim();
    const availableFrom = String(formData.get("available_from") ?? "").trim();

    if (neighborhood) details.neighborhood = neighborhood;
    if (bedrooms && !Number.isNaN(Number(bedrooms))) {
      details.bedrooms = Number(bedrooms);
    }
    if (bathrooms && !Number.isNaN(Number(bathrooms))) {
      details.bathrooms = Number(bathrooms);
    }
    if (availableFrom) details.available_from = availableFrom;
  } else {
    const condition = String(formData.get("condition") ?? "").trim();
    const dimensions = String(formData.get("dimensions") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();

    if (condition) details.condition = condition;
    if (dimensions) details.dimensions = dimensions;
    if (brand) details.brand = brand;
  }

  // ---- Insert. RLS is the final gate. ----
  const { data: inserted, error } = await supabase
    .from("listings")
    .insert({
      author_id: user.id,
      type,
      title,
      description,
      price_cents,
      details,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    // The member gate fired (or any other RLS rejection): send them to the
    // place that explains membership, rather than a dead-end error.
    if (error.code === RLS_VIOLATION) {
      redirect("/profile");
    }
    console.error("Failed to insert listing:", error);
    return {
      error: "Something went wrong posting your listing. Try again in a moment.",
    };
  }

  // Success: the listing appearing on its own page is the confirmation.
  redirect(`/listings/${inserted.id}`);
}
