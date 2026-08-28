// Shared presentation helpers for the listing card, and the card's data shape.
//
// Design foundation, Slice 1. The landing band ("outside", dark) and the browse
// feed ("inside", light) render the same card from the same database row, so
// the row → card mapping lives here rather than being written twice.
//
// This module is display logic only. It reads columns the pages already have
// permission to select; it does not touch the data layer.

/**
 * One listing, as a card renders it.
 *
 * THIS TYPE MOVED HERE IN SLICE 3B, and the move is the point. It used to be
 * exported by app/components/ListingCard.tsx, so this module — which the whole
 * Classifieds system depends on — imported a type from a component in the
 * RETIRING editorial system. Deleting that component would have broken browse,
 * the listing page, member profiles, the filter rail and the archived row.
 *
 * A data shape belongs with the data. A component may render it; it does not
 * get to own it.
 */
export type ListingCardData = {
  id: string;
  title: string;
  description: string | null;
  /** The kicker: an apartment's neighborhood, or the category. See placeOf. */
  place: string;
  /** Formatted price, e.g. "$3,400/mo" — null when the listing has no price. */
  price: string | null;
  /** Formatted posted date, e.g. "July 14". */
  postedAt: string;
  /** Signed cover-image URL, or null when the listing has no images. */
  coverUrl: string | null;
  isExample: boolean;
  /** "Listed by X · sponsored by Y" — omitted where the surface doesn't show it. */
  byline?: string | null;
};

export type ListingType = "apartment" | "furniture" | "other" | "service";

export type ListingRow = {
  id: string;
  type: ListingType;
  title: string;
  description?: string | null;
  price_cents: number | null;
  created_at: string;
  images: { path: string }[] | null;
  details: Record<string, unknown> | null;
  is_example: boolean;
};

// Apartments are monthly; everything else is a one-off price.
//
// A LISTING MAY CARRY NO PRICE AT ALL (George, 2026-08-27). A members' rate, a
// service quoted on request, a perk extended through a member — for these a
// number would be a lie, and the form now accepts a blank price. NULL is "no
// price"; 0 is NOT, because free is a real asking price and has to stay sayable.
//
// Returning null rather than a dash is deliberate: every caller renders the
// result directly, and React renders null as nothing, so a listing with no price
// shows no price rather than an em-dash that reads like missing data.
export function formatPrice(
  cents: number | null,
  type: ListingType
): string | null {
  if (cents === null) return null;
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

// "July 14" — no year. Pinned to New York time so a listing posted late in the
// evening doesn't render as the next day on a UTC server.
export function formatPostedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

const TYPE_LABEL: Record<ListingType, string> = {
  apartment: "Apartment",
  furniture: "Furniture",
  other: "Other",
  service: "Service",
};

// THE NEIGHBORHOOD AS DATA. Filtering and search matching read this; nothing
// renders it directly.
//
// It is split from placeOf() below on purpose, and the split is load-bearing.
// placeOf() used to be both things at once — the string on the card AND the
// value the browse filter and the search haystack compared against — so
// changing what the card SAYS would silently change what search FINDS. With
// the two separated, a display decision cannot break retrieval.
export function neighborhoodOf(row: ListingRow): string | null {
  const neighborhood = row.details?.neighborhood;
  return typeof neighborhood === "string" && neighborhood.trim()
    ? neighborhood.trim()
    : null;
}

// THE KICKER'S LEFT SLOT — DISPLAY ONLY. Never compare against this.
//
// An apartment leads with where it is; everything else leads with what it is
// (George, 2026-08-27). Leading every card with a neighborhood in caps is the
// visual grammar of a rental portal, and headlining a $220 coffee table
// "LOWER EAST SIDE" was a large part of why browse read as a rental site
// rather than a classifieds board. A neighborhood is the defining fact about
// an apartment and an incidental one about a chair.
//
// Non-apartments therefore never show a neighborhood here. They are still
// FOUND by one — search matches on neighborhoodOf() above, so a Tribeca coffee
// table still answers "tribeca".
export function placeOf(row: ListingRow): string {
  return row.type === "apartment"
    ? (neighborhoodOf(row) ?? TYPE_LABEL.apartment)
    : TYPE_LABEL[row.type];
}

export function toCardData(
  row: ListingRow,
  coverUrl: string | null,
  byline?: string | null
): ListingCardData {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    place: placeOf(row),
    price: formatPrice(row.price_cents, row.type),
    postedAt: formatPostedDate(row.created_at),
    coverUrl,
    isExample: row.is_example,
    byline: byline ?? null,
  };
}
