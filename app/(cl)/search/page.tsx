// Screen 04 — Search and filters, in the Classifieds system.
//
// A typed query over the same gated read Browse uses, answered in rows rather
// than cards, with the facets in play shown as removable chips above the
// results.
//
// SEARCH DOES NOT EXIST IN THE LIVE PRODUCT. mvp-spec.md puts search filters
// out of v1, and nothing here changes that — this is a design screen being
// judged, and judging it needs the real network behind it. What makes that
// honest rather than a mockup is that the search is a pure narrowing of the
// gated read (see matchesText in filters.ts): it cannot surface a row that
// Browse would not already show the same viewer. A search box wired to its own
// query would be the version worth worrying about.
//
// TWO DEPARTURES FROM THE DESIGN:
//
//   "Save this search" is not here. It needs a saved_searches table, an RLS
//   policy making one person's searches private to them, and a screen to read
//   them back — none of which exist, and none of which a design preview should
//   invent. The sort control takes that corner instead, which is both real and
//   the thing you actually reach for after a search returns too much.
//
//   The design's chips read "Under $7,000". The price filter here is a range
//   with two independent bounds, so the chip states whichever bounds are set —
//   "Under $7,000", "From $2,000", or "$2,000–$7,000" — rather than flattening
//   a range someone set on purpose.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";
import ClListingRow from "@/app/components/cl/ClListingRow";
import { readPermittedListings, toClCards } from "@/lib/cl/listings-read";
import { placeOf } from "@/lib/listings/card";
import {
  CATEGORIES,
  SEARCH_PATH,
  SORTS,
  buildHref,
  isFiltered,
  matchesText,
  parseQuery,
  resultLabel,
  type ClQuery,
} from "@/lib/cl/filters";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parseQuery(await searchParams); // Next 16: searchParams is async.

  const gated = await readPermittedListings();
  const { rows: all, isGuest } = gated;

  const matched = all.filter((row) => {
    if (!matchesText([row.title, row.description, placeOf(row)], q.text))
      return false;
    if (q.type && row.type !== q.type) return false;
    if (q.hood && placeOf(row) !== q.hood) return false;
    if (q.min !== null && row.price_cents < q.min * 100) return false;
    if (q.max !== null && row.price_cents > q.max * 100) return false;
    return true;
  });

  const visible =
    q.sort === "price"
      ? [...matched].sort((a, b) => a.price_cents - b.price_cents)
      : matched;

  const cards = await toClCards(visible, gated);
  const chips = activeChips(q);

  return (
    <>
      <AppHeader active="browse" />

      <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[26px] pb-[clamp(32px,4vw,56px)]">
        {/* A plain GET form, so a search has its own URL, works with the back
            button, and needs no JavaScript. The hidden fields carry the facets
            the visitor did not touch — re-searching must not silently clear
            the category and neighborhood they already picked. */}
        <form
          action={SEARCH_PATH}
          method="get"
          className="flex flex-wrap items-center gap-2.5"
        >
          {q.type && <input type="hidden" name="type" value={q.type} />}
          {q.hood && <input type="hidden" name="hood" value={q.hood} />}
          {q.min !== null && (
            <input type="hidden" name="min" value={q.min} />
          )}
          {q.max !== null && (
            <input type="hidden" name="max" value={q.max} />
          )}
          {q.sort !== "newest" && (
            <input type="hidden" name="sort" value={q.sort} />
          )}

          <label htmlFor="cl-search" className="sr-only">
            Search listings
          </label>
          <input
            id="cl-search"
            className="cl-input min-w-[240px] flex-1 text-[14.5px]"
            style={{ padding: "13px 16px" }}
            type="search"
            name="q"
            defaultValue={q.text ?? ""}
            maxLength={80}
            placeholder="Search the network"
          />
          <button type="submit" className="cl-pill" style={{ padding: "13px 22px" }}>
            Search
          </button>
        </form>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
            {chips.map((chip) => (
              // The chip IS the remove control — the whole thing is the link
              // that drops the facet, so the "×" is decoration on a target the
              // size of the label rather than a 10px hit area beside it.
              <Link
                key={chip.key}
                href={buildHref(q, chip.clear, SEARCH_PATH)}
                className="cl-chip"
                style={{ color: "var(--cl-muted)" }}
                aria-label={`Remove filter: ${chip.label}`}
              >
                {chip.label} <span aria-hidden="true">&times;</span>
              </Link>
            ))}
            <Link
              href={SEARCH_PATH}
              className="cl-quiet px-1.5 py-[7px] text-[13px]"
              style={{ color: "var(--cl-faint)" }}
            >
              Clear all
            </Link>
          </div>
        )}

        <div
          className="flex flex-wrap items-baseline justify-between gap-5 border-b pt-[22px] pb-3.5 text-[13px]"
          style={{
            borderColor: "var(--cl-hairline)",
            color: "var(--cl-muted)",
          }}
        >
          <div>{resultLabel(q, cards.length)}</div>
          <div className="flex gap-4">
            {SORTS.map((s) => {
              const on = s.value === q.sort;
              return (
                <Link
                  key={s.value}
                  href={buildHref(q, { sort: s.value }, SEARCH_PATH)}
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
          <Empty q={q} />
        ) : (
          <div className="flex flex-col">
            {cards.map((card) => (
              <ClListingRow key={card.id} card={card} />
            ))}
          </div>
        )}

        {/* A guest searching the six-listing teaser is searching a sample, and
            a "no results" from a sample is not a fact about the network. */}
        {isGuest && (
          <div
            className="mt-[clamp(28px,3vw,40px)] border-t pt-7"
            style={{ borderColor: "var(--cl-hairline)" }}
          >
            <p className="max-w-[34ch] text-[17px] leading-[1.35]">
              You&rsquo;re searching a handful of recent listings. Create an
              account to search the whole network.
            </p>
            <div className="mt-4">
              <Link href="/signup" className="cl-pill">
                Create an account
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

type Chip = { key: string; label: string; clear: Partial<ClQuery> };

function money(dollars: number): string {
  return `$${dollars.toLocaleString("en-US")}`;
}

// One chip per facet in play, each carrying the patch that removes it.
function activeChips(q: ClQuery): Chip[] {
  const chips: Chip[] = [];

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

  if (q.hood) {
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

function Empty({ q }: { q: ClQuery }) {
  return (
    <div
      className="mt-[26px] rounded-[12px] border px-7 py-11 text-center"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <div className="text-[17px]">
        {q.text ? "Nothing for that" : "Nothing matches"}
      </div>
      <p
        className="mx-auto mt-2.5 mb-5 max-w-[340px] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        {q.text
          ? `No listing mentions ${q.text}. Try fewer words, or drop a filter.`
          : "No listings match these filters. Try widening them."}
      </p>
      {isFiltered(q) && (
        <Link href={SEARCH_PATH} className="cl-ghost">
          Clear all
        </Link>
      )}
    </div>
  );
}
