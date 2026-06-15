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
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateListingState = { error: string | null };

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGES = 6;

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

  // ---- Pluck + validate shared fields (mirrors create.ts) ----
  const type = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!["apartment", "furniture", "other", "service"].includes(type)) {
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
          : type === "service"
            ? "Add a rate or price, in dollars."
            : "Add an asking price, in dollars.",
    };
  }
  const price_cents = Math.round(priceDollars * 100);

  // ---- Build the type-specific details (JSONB) ----
  // Replaces the stored details wholesale, from the submitted type's fields —
  // so switching apartment ↔ furniture leaves no stale keys behind.
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
  } else if (type === "furniture") {
    const condition = String(formData.get("condition") ?? "").trim();
    const dimensions = String(formData.get("dimensions") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();

    if (condition) details.condition = condition;
    if (dimensions) details.dimensions = dimensions;
    if (brand) details.brand = brand;
  } else if (type === "other") {
    const condition = String(formData.get("condition") ?? "").trim();
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();

    if (condition) details.condition = condition;
    if (neighborhood) details.neighborhood = neighborhood;
  } else {
    // service — area served (reuses the neighborhood field)
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();
    if (neighborhood) details.neighborhood = neighborhood;
  }

  // ---- Images ----
  // Same contract as create.ts: ImageUpload sends the full, current set of
  // paths (kept existing ones + new uploads) as a JSON array. Every path must
  // sit in the editor's own folder. Removed images stay in Storage as orphans
  // — same known v1 tradeoff as abandoned uploads.
  const imagePaths: string[] = [];
  const imagesRaw = String(formData.get("images") ?? "[]");
  try {
    const parsed: unknown = JSON.parse(imagesRaw);
    if (!Array.isArray(parsed)) {
      return { error: "Photos didn't upload cleanly. Try again." };
    }
    if (parsed.length > MAX_IMAGES) {
      return { error: `Up to ${MAX_IMAGES} photos, please.` };
    }
    const prefix = `${user.id}/`;
    for (const item of parsed) {
      if (typeof item !== "string" || !item.startsWith(prefix)) {
        return { error: "Photos didn't upload cleanly. Try again." };
      }
      imagePaths.push(item);
    }
  } catch {
    return { error: "Photos didn't upload cleanly. Try again." };
  }
  const images = imagePaths.map((path) => ({ path }));

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

  // Success: a live listing shows the edit on its own page; anything not
  // published has no public page, so My Listings is the confirmation.
  if (existing.status === "published") {
    redirect(`/listings/${id}`);
  }
  redirect("/listings/mine");
}
