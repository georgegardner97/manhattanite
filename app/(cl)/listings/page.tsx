// Screen 02 — Browse, in the Classifieds system.
//
// The live /listings page rendered in the design imported from the Claude
// Design project: filter rail left, result count across the top, a responsive
// card grid under it. Real rows, real photographs, real bylines —
// the point of the slice is to judge the system on the network as it actually
// is, not on twelve invented listings.
//
// THE DATA RULES ARE THE LIVE ONES, UNCHANGED, and they no longer live here:
// the gated read, the teaser cap and the row → card mapping moved to
// listings-read.ts when Search and Saved arrived and needed exactly the same
// three things. This page is now a presentation of that read and nothing more.
//
// SEARCH IS ON THIS SCREEN (2026-08-27). /search was a separate route that
// nothing in the product linked to — the only way in was to type the URL — and
// it was the same read as this page with a text term added. It retired into
// this screen rather than being given a nav slot: the box and the chip row sit
// above the result count, ?q= joins the other facets in the URL, and /search
// now redirects here carrying its query string. The grid stayed a grid; the
// design's search ROWS did not come across, because this is Browse.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";
import ClListingCard from "@/app/components/cl/ClListingCard";
import FilterRail from "@/app/components/cl/FilterRail";
import {
  countByType,
  neighborhoodsIn,
  readPermittedListings,
  toClCards,
} from "@/lib/cl/listings-read";
import { neighborhoodOf } from "@/lib/listings/card";
import {
  BROWSE_PATH,
  activeChips,
  buildHref,
  hoodApplies,
  isFiltered,
  matchesText,
  parseQuery,
  resultLabel,
} from "@/lib/cl/filters";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parseQuery(await searchParams); // Next 16: searchParams is async.

  const gated = await readPermittedListings();
  const { rows: all, isGuest } = gated;

  const counts = countByType(gated);
  // Apartment rows only. The neighborhood filter applies to apartments (see
  // hoodApplies), so a list built from every row would offer a neighborhood
  // that only a sofa is in — a filter that returns nothing once it is applied.
  const hoods = neighborhoodsIn(all.filter((row) => row.type === "apartment"));

  const matched = all.filter((row) => {
    // The haystack reads neighborhoodOf, NOT placeOf: placeOf is the card's
    // display string and now leads non-apartments with their category, so
    // searching it would stop finding a Tribeca coffee table by "tribeca".
    if (
      !matchesText([row.title, row.description, neighborhoodOf(row)], q.text)
    )
      return false;
    if (q.type && row.type !== q.type) return false;
    if (q.hood && hoodApplies(q) && neighborhoodOf(row) !== q.hood) return false;
    // The boxes are in dollars; the column is in cents. A listing with NO
    // price cannot satisfy a bound, so a price filter excludes it rather than
    // treating a missing number as zero.
    if (q.min !== null && (row.price_cents === null || row.price_cents < q.min * 100))
      return false;
    if (q.max !== null && (row.price_cents === null || row.price_cents > q.max * 100))
      return false;
    return true;
  });

  // Newest-first, always: the query already returned the rows that way and
  // there is no control to reorder them. See the Sort note in filters.ts.
  const cards = await toClCards(matched, gated);
  const chips = activeChips(q);

  return (
    <>
      {/* The widest screen in the product, so the bar is told to match it —
          otherwise the header sits 80px inside the grid on any screen over
          1400px and "Post a listing" floats short of the right-hand column. */}
      <AppHeader active="browse" width="wide" />

      <main className="mx-auto grid w-full max-w-[1400px] grid-cols-[220px_1fr] items-start gap-[clamp(24px,3vw,44px)] px-[clamp(16px,2.4vw,28px)] pt-[22px] pb-[clamp(32px,4vw,56px)] max-[860px]:grid-cols-1 max-[860px]:gap-5">
        <FilterRail q={q} counts={counts} total={all.length} hoods={hoods} />

        {/* min-w-0: a grid track defaults to min-width:auto, so the nowrap
            prices and the mobile chip row would otherwise refuse to shrink and
            push the page wider than the viewport. */}
        <div className="min-w-0">
          {/* A plain GET form, so a search has its own URL, works with the
              back button, and needs no JavaScript. The hidden fields carry the
              facets the visitor did not touch — searching must not silently
              clear the category, neighborhood or price they already picked.
              `hood` only rides along while it applies, for the same reason
              buildHref refuses to write it. */}
          <form
            action={BROWSE_PATH}
            method="get"
            className="mb-[18px] flex flex-wrap items-center gap-2.5"
          >
            {q.type && <input type="hidden" name="type" value={q.type} />}
            {q.hood && hoodApplies(q) && (
              <input type="hidden" name="hood" value={q.hood} />
            )}
            {q.min !== null && <input type="hidden" name="min" value={q.min} />}
            {q.max !== null && <input type="hidden" name="max" value={q.max} />}

            <label htmlFor="cl-search" className="sr-only">
              Search listings
            </label>
            <input
              id="cl-search"
              className="cl-input min-w-[200px] flex-1 text-[14.5px]"
              style={{ padding: "11px 14px" }}
              type="search"
              name="q"
              defaultValue={q.text ?? ""}
              maxLength={80}
              placeholder="Search the network"
            />
            <button
              type="submit"
              className="cl-pill"
              style={{ padding: "11px 20px" }}
            >
              Search
            </button>
          </form>

          {chips.length > 0 && (
            <div className="mb-[18px] flex flex-wrap items-center gap-2 text-[13px]">
              {chips.map((chip) => (
                // The chip IS the remove control — the whole thing is the link
                // that drops the facet, so the "×" is decoration on a target
                // the size of the label rather than a 10px hit area beside it.
                <Link
                  key={chip.key}
                  href={buildHref(q, chip.clear)}
                  className="cl-chip"
                  style={{ color: "var(--cl-muted)" }}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  {chip.label} <span aria-hidden="true">&times;</span>
                </Link>
              ))}
              <Link
                href={BROWSE_PATH}
                className="cl-quiet px-1.5 py-[7px] text-[13px]"
                style={{ color: "var(--cl-faint)" }}
              >
                Clear all
              </Link>
            </div>
          )}

          {/* The result count, alone. There was a Newest · Price control on the
              right of this line until 2026-08-27; sorting by price ranks the
              network cheapest-first, which is the frame this product exists to
              get away from, and with price gone "Newest" was a control with one
              option. The count stays because it answers a real question. */}
          <div
            className="border-b pb-4 text-[13px]"
            style={{
              borderColor: "var(--cl-hairline)",
              color: "var(--cl-muted)",
            }}
          >
            {resultLabel(q, cards.length)}
          </div>

          {cards.length === 0 ? (
            <EmptyState q={q} />
          ) : (
            <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(22px,2.4vw,34px)]">
              {cards.map((card) => (
                <ClListingCard key={card.id} card={card} />
              ))}
            </div>
          )}

          {/* Also shown when a guest's SEARCH came back empty — otherwise
              "nothing for that" reads as a fact about the network when it is
              only a fact about six rows. That caveat came across from /search
              along with the box. */}
          {isGuest && (cards.length > 0 || q.text !== null) && (
            <TeaserWall searched={q.text !== null} />
          )}
        </div>
      </main>
    </>
  );
}

// The design's empty state, with its call to action made real: "Notify me"
// has nothing behind it, and clearing the filters is the thing a person on
// this screen actually wants. The unfiltered case says something different,
// because an empty network is not a failed search.
function EmptyState({ q }: { q: ReturnType<typeof parseQuery> }) {
  const filtered = isFiltered(q);

  return (
    <div
      className="mt-[26px] rounded-[12px] border px-7 py-11 text-center"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <div className="text-[17px]">
        {q.text ? "Nothing for that" : filtered ? "Nothing matches" : "No listings yet"}
      </div>
      <p
        className="mx-auto mt-2.5 mb-5 max-w-[340px] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        {q.text
          ? `No listing mentions ${q.text}. Try fewer words, or drop a filter.`
          : filtered
            ? "No listings match these filters. Try widening them."
            : "The network is small on purpose. If you know someone with the perfect apartment or piece, bring them in."}
      </p>
      {filtered && (
        <Link href={BROWSE_PATH} className="cl-ghost">
          Clear filters
        </Link>
      )}
    </div>
  );
}

// Guests see the create-account prompt where the rest of the network would be.
// Same wall as /listings, restated in this system's furniture.
function TeaserWall({ searched }: { searched: boolean }) {
  return (
    <div
      className="mt-[clamp(32px,4vw,48px)] border-t pt-8"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <p className="max-w-[34ch] text-[19px] leading-[1.3]">
        {searched
          ? "You’re searching a handful of recent listings. Create an account to search the whole network."
          : "This is a glimpse. Create an account to see every listing in the network."}
      </p>
      <div className="mt-5">
        <Link href="/signup" className="cl-pill">
          Create an account
        </Link>
      </div>
    </div>
  );
}
