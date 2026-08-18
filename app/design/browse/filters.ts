// Browse filter state — parsing, counting and link building for screen 02.
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
   * The typed search term (screen 04). Browse never sets it, but it lives in
   * the same shape so one parser and one link builder serve both screens — and
   * so a term survives when someone narrows a search by category.
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

export const BROWSE_PATH = "/design/browse";
export const SEARCH_PATH = "/design/search";

/**
 * The href for the current filter state with one facet changed. Every other
 * facet is carried through — clicking a neighborhood must not silently drop
 * the category you already picked, and narrowing a search must not throw away
 * the words you typed.
 *
 * `base` is which screen the link lands on: the rail and sort on Browse keep
 * you on Browse, the chips on Search keep you on Search. Passing a facet as
 * null in the patch is how a chip's "×" removes it.
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
  if (next.hood) params.set("hood", next.hood);
  if (next.min !== null) params.set("min", String(next.min));
  if (next.max !== null) params.set("max", String(next.max));
  if (next.sort !== "newest") params.set("sort", next.sort);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function isFiltered(q: ClQuery): boolean {
  return (
    q.type !== null ||
    q.hood !== null ||
    q.min !== null ||
    q.max !== null ||
    q.text !== null
  );
}

/**
 * Does this listing answer the typed term?
 *
 * Every word must appear somewhere in the title, the description or the place —
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
  const inHood = q.hood ? ` · ${q.hood}` : "";
  return `${count} ${noun}${inCategory}${inHood}`;
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
