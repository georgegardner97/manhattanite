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
// the client form). Listing Moderation slice: new listings insert as
// status='pending' (pre-moderation — nothing reaches the network without an
// admin yes; the 0017 trigger enforces this at the database). A pending
// listing isn't readable on the public detail page, so success redirects to
// /listings/mine?submitted=1, where the review-aware confirmation and the
// "In review" badge live. If RLS rejects the insert (a non-member somehow
// reached here), we send them to /profile, where the membership nudge lives.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateListingState = { error: string | null };

// Postgres raises 42501 ("insufficient_privilege") when a row violates an RLS
// policy — that's the member gate firing for a non-member.
const RLS_VIOLATION = "42501";

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGES = 6;

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

  // A BLANK PRICE IS LEGITIMATE (George, 2026-08-27). Not everything on a
  // classifieds board has a number: a members' rate, a service quoted on
  // request, a perk extended through a member. Requiring one made those
  // unpostable honestly, so blank is now allowed and stores NULL.
  //
  // NULL, not 0 — free is a real asking price and has to stay sayable. A price
  // that is PRESENT but nonsense is still rejected; only absence is permitted.
  let price_cents: number | null = null;
  if (priceRaw) {
    const priceDollars = Number(priceRaw);
    if (Number.isNaN(priceDollars) || priceDollars < 0) {
      return {
        error:
          "That price doesn't look right — give a number in dollars, or leave it blank.",
      };
    }
    price_cents = Math.round(priceDollars * 100);
  }

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
  // ImageUpload already uploaded the files to Storage and is sending us the
  // paths as a JSON-encoded array of strings in the `images` field. Each
  // path must start with `{user.id}/` so a member can't be tricked into
  // attaching someone else's uploads to their own listing. (The storage RLS
  // policy in 0005 enforces this on upload too — this is the second line.)
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

  // ---- Insert. RLS is the final gate; the 0017 trigger pins the status. ----
  // No .select() — a pending row IS owner-readable (listings_read_own), but
  // the bare insert is the minimal write and the /mine redirect confirms.
  const { error } = await supabase.from("listings").insert({
    author_id: user.id,
    type,
    title,
    description,
    price_cents,
    details,
    images,
    status: "pending",
  });

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

  // Success: My Listings shows the new listing under its "In review" badge,
  // with the review-aware confirmation up top (?submitted=1).
  redirect("/listings/mine?submitted=1");
}
