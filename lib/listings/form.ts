// The listing form, parsed — ONE reader for every write path.
//
// WHY THIS IS SHARED AND NOT COPIED. `details` is rebuilt WHOLESALE from the
// submitted fields on every save, which is deliberate (switching apartment ↔
// furniture must leave no stale keys) and unforgiving: any field the parser
// does not read is DELETED from the listing. That is not theory — on 27 Aug a
// missing `neighborhood` read in the furniture branch silently wiped the
// neighborhood off every furniture listing that was edited, including edits
// that never touched the field.
//
// Slice 3b added a second write path (an admin correcting somebody else's
// listing). A second copy of this logic would be a second chance to forget a
// field, and the failure is invisible: the save succeeds, the data is gone.
// So both paths read the form through here, and adding a field to the form
// means adding it in exactly one place.
//
// WHAT THIS DOES NOT DECIDE: who may write, which row, or what happens to
// `status`. Those belong to the caller — this only turns FormData into the
// six columns the form can express, or into the first error worth showing.

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGES = 6;

const TYPES = ["apartment", "furniture", "other", "service"];

export type ParsedListing = {
  type: string;
  title: string;
  description: string;
  /** NULL is "no price" and 0 is free — see 0027. Never conflate them. */
  price_cents: number | null;
  details: Record<string, unknown>;
  /** The stored shape: an array of `{ path }`, not an array of strings. */
  images: { path: string }[];
};

export type ParseResult =
  | { ok: true; value: ParsedListing }
  | { ok: false; error: string };

/**
 * @param allowedPrefixes Storage folders a photo path may sit in. A member
 *   passes their own id; an admin correcting somebody else's listing passes
 *   BOTH the owner's folder (where the existing photos live) and their own
 *   (where anything they add lands). Passing only the editor's folder is how
 *   an admin save would reject every photo the member had already uploaded.
 */
export function parseListingForm(
  formData: FormData,
  allowedPrefixes: string[]
): ParseResult {
  const type = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!TYPES.includes(type)) {
    return { ok: false, error: "Pick a listing type to get started." };
  }
  if (!title) {
    return { ok: false, error: "Give your listing a title." };
  }
  if (title.length > MAX_TITLE) {
    return { ok: false, error: `Keep the title to ${MAX_TITLE} characters or fewer.` };
  }
  if (!description) {
    return { ok: false, error: "Add a few lines describing what you're listing." };
  }
  if (description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `That description is a little long — keep it under ${MAX_DESCRIPTION} characters.`,
    };
  }

  // Blank clears the price to NULL. Clearing has to work, or a price typed
  // once could never be taken back off a listing. NULL is not 0.
  let price_cents: number | null = null;
  if (priceRaw) {
    const priceDollars = Number(priceRaw);
    if (Number.isNaN(priceDollars) || priceDollars < 0) {
      return {
        ok: false,
        error:
          "That price doesn't look right — give a number in dollars, or leave it blank.",
      };
    }
    price_cents = Math.round(priceDollars * 100);
  }

  // ---- Type-specific details ----
  // Every branch that shows a Neighborhood input must read it back. The form
  // renders that field for all four types, so all four read it.
  const details: Record<string, unknown> = {};
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();

  if (type === "apartment") {
    const bedrooms = String(formData.get("bedrooms") ?? "").trim();
    const bathrooms = String(formData.get("bathrooms") ?? "").trim();
    const availableFrom = String(formData.get("available_from") ?? "").trim();

    if (neighborhood) details.neighborhood = neighborhood;
    if (bedrooms && !Number.isNaN(Number(bedrooms))) details.bedrooms = Number(bedrooms);
    if (bathrooms && !Number.isNaN(Number(bathrooms))) details.bathrooms = Number(bathrooms);
    if (availableFrom) details.available_from = availableFrom;
  } else if (type === "furniture") {
    const condition = String(formData.get("condition") ?? "").trim();
    const dimensions = String(formData.get("dimensions") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();

    if (condition) details.condition = condition;
    if (dimensions) details.dimensions = dimensions;
    if (brand) details.brand = brand;
    if (neighborhood) details.neighborhood = neighborhood;
  } else if (type === "other") {
    const condition = String(formData.get("condition") ?? "").trim();

    if (condition) details.condition = condition;
    if (neighborhood) details.neighborhood = neighborhood;
  } else {
    // service — area served, which reuses the neighborhood field.
    if (neighborhood) details.neighborhood = neighborhood;
  }

  // ---- Images ----
  // ClImageUpload sends the full, current set of paths as a JSON array of
  // STRINGS. It sent objects for a fortnight and every save carrying a photo
  // failed on this check with a message about Storage, so the shape is worth
  // being exact about: strings in, `{ path }` out.
  const imagePaths: string[] = [];
  const imagesRaw = String(formData.get("images") ?? "[]");
  try {
    const parsed: unknown = JSON.parse(imagesRaw);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "Photos didn't upload cleanly. Try again." };
    }
    if (parsed.length > MAX_IMAGES) {
      return { ok: false, error: `Up to ${MAX_IMAGES} photos, please.` };
    }
    for (const item of parsed) {
      if (
        typeof item !== "string" ||
        !allowedPrefixes.some((prefix) => item.startsWith(prefix))
      ) {
        return { ok: false, error: "Photos didn't upload cleanly. Try again." };
      }
      imagePaths.push(item);
    }
  } catch {
    return { ok: false, error: "Photos didn't upload cleanly. Try again." };
  }

  return {
    ok: true,
    value: {
      type,
      title,
      description,
      price_cents,
      details,
      images: imagePaths.map((path) => ({ path })),
    },
  };
}
