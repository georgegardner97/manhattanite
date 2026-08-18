// Screen 02 — Browse, in the Classifieds system.
//
// The live /listings page rendered in the design imported from the Claude
// Design project: filter rail left, result count and sort across the top, a
// responsive card grid under it. Real rows, real photographs, real bylines —
// the point of the slice is to judge the system on the network as it actually
// is, not on twelve invented listings.
//
// THE DATA RULES ARE THE LIVE ONES, UNCHANGED, and they no longer live here:
// the gated read, the teaser cap and the row → card mapping moved to
// listings-read.ts when Search and Saved arrived and needed exactly the same
// three things. This page is now a presentation of that read and nothing more.

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
import { placeOf } from "@/lib/listings/card";
import {
  SORTS,
  buildHref,
  isFiltered,
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
  const hoods = neighborhoodsIn(all);

  const matched = all.filter((row) => {
    if (q.type && row.type !== q.type) return false;
    if (q.hood && placeOf(row) !== q.hood) return false;
    // The boxes are in dollars; the column is in cents.
    if (q.min !== null && row.price_cents < q.min * 100) return false;
    if (q.max !== null && row.price_cents > q.max * 100) return false;
    return true;
  });

  // The query already returned newest-first, so "newest" is the identity and
  // only "price" does work. Sorting a copy leaves `all` — which the counts
  // still read — untouched.
  const visible =
    q.sort === "price"
      ? [...matched].sort((a, b) => a.price_cents - b.price_cents)
      : matched;

  const cards = await toClCards(visible);

  return (
    <>
      <AppHeader active="browse" />

      <main className="mx-auto grid w-full max-w-[1400px] grid-cols-[220px_1fr] items-start gap-[clamp(24px,3vw,44px)] px-[clamp(16px,2.4vw,28px)] pt-[22px] pb-[clamp(32px,4vw,56px)] max-[860px]:grid-cols-1 max-[860px]:gap-5">
        <FilterRail q={q} counts={counts} total={all.length} hoods={hoods} />

        {/* min-w-0: a grid track defaults to min-width:auto, so the nowrap
            prices and the mobile chip row would otherwise refuse to shrink and
            push the page wider than the viewport. */}
        <div className="min-w-0">
          <div
            className="flex flex-wrap items-baseline justify-between gap-5 border-b pb-4 text-[13px]"
            style={{
              borderColor: "var(--cl-hairline)",
              color: "var(--cl-muted)",
            }}
          >
            <div>{resultLabel(q, cards.length)}</div>

            {/* Sort. The design's third option, "Closest", is not here — see
                the note in filters.ts. */}
            <div className="flex gap-4">
              {SORTS.map((s) => {
                const on = s.value === q.sort;
                return (
                  <Link
                    key={s.value}
                    href={buildHref(q, { sort: s.value })}
                    aria-current={on ? "page" : undefined}
                    style={{ color: on ? "var(--cl-ink)" : "inherit" }}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
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

          {isGuest && cards.length > 0 && <TeaserWall />}
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
        {filtered ? "Nothing matches" : "No listings yet"}
      </div>
      <p
        className="mx-auto mt-2.5 mb-5 max-w-[340px] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        {filtered
          ? "No listings match these filters. Try widening them."
          : "The network is small on purpose. If you know someone with the perfect apartment or piece, bring them in."}
      </p>
      {filtered && (
        <Link href="/listings" className="cl-ghost">
          Clear filters
        </Link>
      )}
    </div>
  );
}

// Guests see the create-account prompt where the rest of the network would be.
// Same wall as /listings, restated in this system's furniture.
function TeaserWall() {
  return (
    <div
      className="mt-[clamp(32px,4vw,48px)] border-t pt-8"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <p className="max-w-[30ch] text-[19px] leading-[1.3]">
        This is a glimpse. Create an account to see every listing in the
        network.
      </p>
      <div className="mt-5">
        <Link href="/signup" className="cl-pill">
          Create an account
        </Link>
      </div>
    </div>
  );
}
