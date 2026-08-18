// The one gated listings read the Classifieds preview screens share.
//
// Browse (02), Search (04) and Saved (06) all want "the listings this viewer is
// allowed to see". Written three times that is three chances to get the teaser
// cap wrong, and the cap IS the trust gate — a guest may see the six most
// recent published listings and nothing else. So it is written once, here, and
// the screens differ only in how they present what comes back.
//
// The rules are the live /listings rules, unchanged:
//
//   - Published rows only.
//   - Guests get the 6-row teaser. Anonymous read of published rows is
//     permitted at the data layer (migration 0010); the cap is enforced in the
//     query, exactly as it is on /listings, because viewing is the funnel and
//     the action layer is the gate.
//   - Signed-in accounts and members get the full feed, capped at 50.
//
// Every screen then filters, sorts and counts IN MEMORY over this one result
// set. At a 50-row ceiling that is one round-trip instead of several, and it
// makes it impossible for a filter, a search term or a saved id to widen what
// the viewer is allowed to see: there is only ever the one gated read.

import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import {
  formatPrice,
  placeOf,
  type ListingRow,
  type ListingType,
} from "@/lib/listings/card";
import { relativeDay } from "@/app/design/browse/filters";
import type { ClCard } from "@/app/design/ClListingCard";

export type BrowseRow = ListingRow & {
  author_name: string | null;
  sponsor_names: string[];
};

export const TEASER_LIMIT = 6;
export const FEED_LIMIT = 50;

export type GatedListings = {
  rows: BrowseRow[];
  isGuest: boolean;
};

export async function readPermittedListings(): Promise<GatedListings> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = !user;

  const { data } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_name, sponsor_names"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(isGuest ? TEASER_LIMIT : FEED_LIMIT)
    .returns<BrowseRow[]>();

  return { rows: data ?? [], isGuest };
}

/**
 * Per-type counts across every row the viewer may see, so the rail's numbers
 * stay put as the neighborhood and price filters move.
 *
 * Guests get `null` rather than numbers: with only the six teaser rows in hand,
 * "Apartments 2" would be a number about the teaser presented as a number about
 * the network.
 */
export function countByType(
  { rows, isGuest }: GatedListings
): Record<ListingType, number> | null {
  if (isGuest) return null;
  return rows.reduce(
    (acc, row) => {
      acc[row.type] = (acc[row.type] ?? 0) + 1;
      return acc;
    },
    { apartment: 0, furniture: 0, service: 0, other: 0 } as Record<
      ListingType,
      number
    >
  );
}

/** The neighborhoods actually present, so a rail can never offer a dead filter. */
export function neighborhoodsIn(rows: BrowseRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => row.details?.neighborhood)
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
        .map((v) => v.trim())
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * The default meta line under a card: the shared byline plus the relative date
 * this design system's cards carry.
 */
export function defaultMeta(row: BrowseRow): string {
  // renderByline stays the single source of truth for how sponsors are named
  // (the hybrid-at-2 rule); this system only adds the date.
  return `${renderByline(row.author_name, row.sponsor_names)} · ${relativeDay(
    row.created_at
  )}`;
}

/**
 * Rows → cards, signing every cover in one round-trip.
 *
 * Sign LAST, over the rows that survived filtering, rather than over everything
 * read: a signed URL is a grant, and there is no reason to mint fifty of them
 * to render six cards.
 *
 * `renderMeta` overrides the byline. The landing page passes its own, because
 * it names nobody — see the note there.
 */
export async function toClCards(
  rows: BrowseRow[],
  renderMeta: (row: BrowseRow) => string = defaultMeta
): Promise<ClCard[]> {
  const coverUrlByPath = await signImagePaths(
    rows
      .map((row) => row.images?.[0]?.path)
      .filter((p): p is string => Boolean(p))
  );

  return rows.map((row) => {
    const coverPath = row.images?.[0]?.path;
    return {
      id: row.id,
      title: row.title,
      place: placeOf(row),
      price: formatPrice(row.price_cents, row.type),
      meta: renderMeta(row),
      coverUrl: coverPath ? coverUrlByPath.get(coverPath) ?? null : null,
      isExample: row.is_example,
    };
  });
}
