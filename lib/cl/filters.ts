// Browse filter state — parsing, counting, chips and link building for screen 02.
//
// SEARCH LIVES HERE TOO. /search was a separate screen until 2026-08-27, when
// it retired into Browse: it was the same read (same parseQuery, same
// buildHref, same gated rows, same filters) differing only in presentation,
// and nothing in the product ever linked to it. One screen, one URL shape —
// ?q=&type=&hood=&min=&max=&sort=.
//
// The filters are URL-driven (?type=&hood=&min=&max=&sort=), the same way the
// live /listings page drives its category filter. The design's canvas prototype
// held this in client state because a canvas has nowhere else to put it; a real
// browse screen wants shareable, back-button-able URLs, and the rail then works
// with JavaScript off.
//
// WHERE THIS DEPARTS FROM THE DESIGN, and why:
//
//   Categories. The design's rail lists nine (Apartments, Sublets, Rooms,
//   Furniture, Bikes, Art, Services, Tickets, Jobs). The listings type enum has
//   four (apartment, furniture, service, other) and this slice makes no schema
//   changes, so the rail renders the four that exist with true counts. Nine
//   categories with seven permanent zeroes would misrepresent the network — and
//   advertising a narrow launch is exactly the thing the founder ruled out on
//   2026-07-17 ("no category tiles anywhere for now, just listings").
//
//   Neighborhoods. Not a column — they live in the `details` JSON, written by
//   the post form. The rail derives the list from the listings actually on
//   screen, so it can never offer a filter that returns nothing.
//
//   Sort. The design offers Newest · Price · Closest. "Closest" needs a viewer
//   location and listing coordinates; neither exists. Two sorts ship, and the
//   third is left out rather than faked with a dead control.

import type { ListingType } from "@/lib/listings/card";

export type ClSort = "newest" | "price";

export type ClQuery = {
  type: ListingType | null;
  hood: string | null;
  /** Dollars, not cents — this is what a person types into the box. */
  min: number | null;
  max: number | null;
  sort: ClSort;
  /**
   * The typed search term. It lives in the same shape as every other facet
   * because search IS browse with a term added (2026-08-27) — same parse, same
   * link builder, same gated read — so a term survives when someone then
   * narrows by category, and a category survives when they then type.
   */
  text: string | null;
};

export const CATEGORIES: { label: string; value: ListingType | null }[] = [
  { label: "All", value: null },
  { label: "Apartments", value: "apartment" },
  { label: "Furniture", value: "furniture" },
  { label: "Services", value: "service" },
  // Reads as a catch-all rather than a category, and keeps the enum value.
  { label: "Everything else", value: "other" },
];

export const SORTS: { label: string; value: ClSort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price", value: "price" },
];

const VALID_TYPES = new Set<string>([
  "apartment",
  "furniture",
  "service",
  "other",
]);

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// A price box accepts what people actually type — "6,800", "$6800", " 6800 ".
// Anything that isn't a non-negative finite number becomes null, i.e. no bound,
// so a typo widens the results rather than emptying them.
function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseQuery(
  sp: Record<string, string | string[] | undefined>
): ClQuery {
  const rawType = firstValue(sp.type);
  const rawHood = firstValue(sp.hood)?.trim();
  // Capped before it is ever used: an unbounded term goes into the result
  // label and the chip row, and a 20KB query string should not become a 20KB
  // heading. 80 characters is longer than any real search on this network.
  const rawText = firstValue(sp.q)?.trim().slice(0, 80);
  const min = parseMoney(firstValue(sp.min));
  const max = parseMoney(firstValue(sp.max));

  return {
    type: rawType && VALID_TYPES.has(rawType) ? (rawType as ListingType) : null,
    hood: rawHood ? rawHood : null,
    // An inverted range is a slip, not an intent. Swapping beats returning
    // nothing and leaving the visitor to work out which box was wrong.
    min: min !== null && max !== null ? Math.min(min, max) : min,
    max: min !== null && max !== null ? Math.max(min, max) : max,
    sort: firstValue(sp.sort) === "price" ? "price" : "newest",
    text: rawText ? rawText : null,
  };
}

export const BROWSE_PATH = "/listings";

/**
 * DOES THE NEIGHBORHOOD FILTER APPLY AT ALL?
 *
 * Only to apartments (George, 2026-08-27). The rail used to offer Neighborhood
 * for every category, so a coffee table could be filtered by Tribeca — a
 * control that reads as useful and is not. A neighborhood is the defining fact
 * about an apartment and an incidental one about a chair.
 *
 * ONE PREDICATE, READ BY EVERYTHING: buildHref, resultLabel, isFiltered, the
 * browse page's row filter and FilterRail. Scattering `type === "apartment"`
 * across five files is how they drift apart.
 *
 * buildHref reading it is what makes a stale `?hood=` LEAVE the URL when you
 * switch category, rather than sitting there filtering invisibly. That is the
 * reason the predicate lives here and not in the rail.
 */
export function hoodApplies(q: Pick<ClQuery, "type">): boolean {
  return q.type === "apartment";
}

/**
 * The href for the current filter state with one facet changed. Every other
 * facet is carried through — clicking a neighborhood must not silently drop
 * the category you already picked, and narrowing a search must not throw away
 * the words you typed.
 *
 * `base` is which screen the link lands on. Everything lands on Browse now
 * that /search has retired into it, so it is left as a defaulted parameter
 * rather than removed. Passing a facet as null in the patch is how a chip's
 * "×" removes it.
 */
export function buildHref(
  q: ClQuery,
  patch: Partial<ClQuery>,
  base: string = BROWSE_PATH
): string {
  const next = { ...q, ...patch };
  const params = new URLSearchParams();
  if (next.text) params.set("q", next.text);
  if (next.type) params.set("type", next.type);
  // Not written when the resulting category cannot be filtered by
  // neighborhood — see hoodApplies. This is the drop, not FilterRail's.
  if (next.hood && hoodApplies(next)) params.set("hood", next.hood);
  if (next.min !== null) params.set("min", String(next.min));
  if (next.max !== null) params.set("max", String(next.max));
  if (next.sort !== "newest") params.set("sort", next.sort);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * The "Price" sort's comparator, and the one place that decides where an
 * unpriced listing sits.
 *
 * A listing with no price is not free and is not expensive — it is unordered,
 * so it goes to the END of the list rather than to the top, which is where
 * treating null as 0 would have put it. Cheapest-first still means cheapest
 * first; the things without a number follow behind.
 */
export function byPrice(
  a: { price_cents: number | null },
  b: { price_cents: number | null }
): number {
  if (a.price_cents === null) return b.price_cents === null ? 0 : 1;
  if (b.price_cents === null) return -1;
  return a.price_cents - b.price_cents;
}

export function isFiltered(q: ClQuery): boolean {
  return (
    q.type !== null ||
    (q.hood !== null && hoodApplies(q)) ||
    q.min !== null ||
    q.max !== null ||
    q.text !== null
  );
}

/**
 * Does this listing answer the typed term?
 *
 * Every word must appear somewhere in the title, the description or the
 * neighborhood —
 * so "two bedroom west village" narrows as you add words, which is what a
 * person typing that sentence expects. Substring, not word-boundary: "bed"
 * should find "bedroom", because the alternative on a network this size is a
 * search that mostly returns nothing.
 *
 * This is deliberately in-memory over the already-gated read rather than a
 * Postgres text search. At a 50-row ceiling full-text indexing would buy
 * nothing, and a query that reaches back to the database is a query that could
 * return rows the viewer's gate already excluded.
 */
export function matchesText(
  haystacks: (string | null | undefined)[],
  text: string | null
): boolean {
  if (!text) return true;
  const hay = haystacks.filter(Boolean).join(" ").toLowerCase();
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

/**
 * The result count line: "6 listings in apartments · West Village".
 * Mirrors the design's `resultLabel`, which names only the facets in play.
 */
export function resultLabel(q: ClQuery, count: number): string {
  const noun = count === 1 ? "listing" : "listings";
  const category = CATEGORIES.find((c) => c.value === q.type);
  const inCategory =
    q.type && category ? ` in ${category.label.toLowerCase()}` : "";
  const inHood = q.hood && hoodApplies(q) ? ` · ${q.hood}` : "";
  return `${count} ${noun}${inCategory}${inHood}`;
}

export type ClChip = { key: string; label: string; clear: Partial<ClQuery> };

function money(dollars: number): string {
  return `$${dollars.toLocaleString("en-US")}`;
}

/**
 * One chip per facet in play, each carrying the patch that removes it.
 *
 * Lives here rather than on the page because it is query logic, not markup —
 * it returns labels and patches, and the page decides what a chip looks like.
 * It came across from /search when search moved onto Browse.
 */
export function activeChips(q: ClQuery): ClChip[] {
  const chips: ClChip[] = [];

  if (q.text) {
    chips.push({ key: "text", label: `“${q.text}”`, clear: { text: null } });
  }

  if (q.type) {
    const category = CATEGORIES.find((c) => c.value === q.type);
    chips.push({
      key: "type",
      label: category?.label ?? q.type,
      clear: { type: null },
    });
  }

  // Same predicate as everything else: with a non-apartment category selected
  // the neighborhood is not filtering anything, so offering a chip to remove
  // it would name a filter that is not running.
  if (q.hood && hoodApplies(q)) {
    chips.push({ key: "hood", label: q.hood, clear: { hood: null } });
  }

  // One chip for the range, not two — "From $2,000" and "Under $7,000" side by
  // side reads as two filters when it is one, and removing half of a range
  // someone set on purpose is rarely what they meant.
  if (q.min !== null || q.max !== null) {
    const label =
      q.min !== null && q.max !== null
        ? `${money(q.min)}–${money(q.max)}`
        : q.max !== null
          ? `Under ${money(q.max)}`
          : `From ${money(q.min as number)}`;
    chips.push({ key: "price", label, clear: { min: null, max: null } });
  }

  return chips;
}

// "today" / "yesterday" / "4 days ago" / "a week ago" / "2 weeks ago".
//
// The Classifieds cards date listings relatively, where the live editorial card
// uses an absolute "July 14". On a browse grid the relative form is the more
// useful of the two — freshness is the thing you are scanning for — so it is
// reproduced here rather than normalized away.
//
// Anchored to New York days, not to elapsed hours: something posted at 11pm
// should read "yesterday" the next morning, not "9 hours ago".
export function relativeDay(iso: string, now: Date = new Date()): string {
  const dayIndex = (d: Date) =>
    Math.floor(
      Date.parse(
        d.toLocaleDateString("en-CA", { timeZone: "America/New_York" })
      ) / 86_400_000
    );

  const days = dayIndex(now) - dayIndex(new Date(iso));

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "a week ago";
  if (days < 61) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
