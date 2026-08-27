// FilterRail — the left column of screen 02.
//
// Three groups, in the design's order: Category (with counts), Neighborhood,
// Price. Every control is a link or a GET form, so the rail works with
// JavaScript off and every filtered view has its own URL.
//
// MOBILE IS AN ADDITION, NOT A PORT. The design file specifies one layout: a
// 220px rail beside the grid. Stacked on a phone that rail is ~400px of
// chrome before the first listing, which is the exact problem the live browse
// page already solved once (mobile pass, 2026-07-21 — the vertical rail falls
// back to a horizontal row). The same answer is taken here: below 860px the
// categories become a horizontally scrolling chip row, and neighborhood and
// price fold into a disclosure that starts closed. Desktop is the design.

import Link from "next/link";
import {
  CATEGORIES,
  buildHref,
  hoodApplies,
  type ClQuery,
} from "@/lib/cl/filters";
import type { ListingType } from "@/lib/listings/card";

export type RailProps = {
  q: ClQuery;
  /** Live counts per type, keyed by enum value; `null` means don't show any. */
  counts: Record<ListingType, number> | null;
  total: number;
  /** Neighborhoods present in the current result set, already sorted. */
  hoods: string[];
};

export default function FilterRail(props: RailProps) {
  // NEIGHBORHOOD IS AN APARTMENTS CONTROL (George, 2026-08-27). The rail used
  // to offer it for every category, so a coffee table could be filtered by
  // Tribeca. The predicate is shared with buildHref, which is what makes a
  // stale ?hood= leave the URL when you switch category rather than sitting
  // there filtering invisibly — hiding the group alone would not do that.
  const showHoods = hoodApplies(props.q) && props.hoods.length > 0;

  return (
    <>
      {/* ---------- Desktop: the design's rail ---------- */}
      <aside className="flex flex-col gap-[26px] text-[13.5px] max-[860px]:hidden">
        <Group label="Category">
          <CategoryRows {...props} />
        </Group>

        {showHoods && (
          <Group label="Neighborhood">
            <HoodRows {...props} />
          </Group>
        )}

        <Group label="Price">
          <PriceForm q={props.q} />
        </Group>
      </aside>

      {/* ---------- Mobile: chips + a disclosure ---------- */}
      <div className="hidden min-w-0 max-[860px]:block">
        <div className="mh-no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          {CATEGORIES.map((c) => {
            const on = c.value === props.q.type;
            const count = countFor(props, c.value);
            return (
              <Link
                key={c.label}
                href={buildHref(props.q, { type: c.value })}
                aria-current={on ? "page" : undefined}
                className={`cl-chip shrink-0${on ? " cl-chip-on" : ""}`}
              >
                {c.label}
                {count !== null && (
                  <span
                    className="ml-1.5 tabular-nums"
                    style={{ opacity: 0.6 }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <details className="mt-3.5">
          {/* A <summary> with its marker removed reads as static text, so the
              caret is restored explicitly and rotates on open — otherwise the
              only two filters a phone has are invisible. */}
          <summary
            className="cl-summary flex cursor-pointer list-none items-center gap-1.5 text-[13px]"
            style={{ color: "var(--cl-muted)" }}
          >
            {showHoods ? "Neighborhood and price" : "Price"}
            <span className="cl-caret" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="mt-3.5 flex flex-col gap-[22px]">
            {showHoods && (
              <Group label="Neighborhood">
                <HoodRows {...props} />
              </Group>
            )}
            <Group label="Price">
              <PriceForm q={props.q} />
            </Group>
          </div>
        </details>
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="cl-grouplabel mb-3">{label}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function countFor(
  { counts, total }: Pick<RailProps, "counts" | "total">,
  value: ListingType | null
): number | null {
  if (!counts) return null;
  return value === null ? total : counts[value];
}

function CategoryRows(props: RailProps) {
  return (
    <>
      {CATEGORIES.map((c) => {
        const on = c.value === props.q.type;
        const count = countFor(props, c.value);
        return (
          <Link
            key={c.label}
            href={buildHref(props.q, { type: c.value })}
            aria-current={on ? "page" : undefined}
            className={`cl-rail-row${on ? " cl-rail-row-on" : ""}`}
          >
            <span className="min-w-0 truncate">{c.label}</span>
            {count !== null && <span className="cl-rail-count">{count}</span>}
          </Link>
        );
      })}
    </>
  );
}

function HoodRows({ q, hoods }: RailProps) {
  // "All" first, then the neighborhoods actually represented in the results —
  // see the note in filters.ts on why this list is derived, not fixed.
  const rows: { label: string; value: string | null }[] = [
    { label: "All", value: null },
    ...hoods.map((h) => ({ label: h, value: h })),
  ];

  return (
    <>
      {rows.map((h) => {
        const on = h.value === q.hood;
        return (
          <Link
            key={h.label}
            href={buildHref(q, { hood: h.value })}
            aria-current={on ? "page" : undefined}
            className={`cl-rail-row${on ? " cl-rail-row-on" : ""}`}
          >
            <span className="min-w-0 truncate">{h.label}</span>
          </Link>
        );
      })}
    </>
  );
}

// A plain GET form. The hidden fields carry the facets the visitor did NOT
// touch — without them, submitting a price would silently clear the category,
// neighborhood and (since search moved onto Browse) the term they typed.
function PriceForm({ q }: { q: ClQuery }) {
  return (
    <form action="/listings" method="get">
      {q.text && <input type="hidden" name="q" value={q.text} />}
      {q.type && <input type="hidden" name="type" value={q.type} />}
      {/* Only while it applies, for the same reason buildHref refuses to
          write it — otherwise applying a price would resurrect a dead ?hood=. */}
      {q.hood && hoodApplies(q) && (
        <input type="hidden" name="hood" value={q.hood} />
      )}
      {q.sort !== "newest" && (
        <input type="hidden" name="sort" value={q.sort} />
      )}

      <div className="flex gap-2">
        {/* inputMode=numeric brings up the number pad without rejecting the
            "$6,800" a person may paste in — parseMoney strips the formatting. */}
        <input
          className="cl-input w-1/2 text-[13px]"
          style={{ padding: "9px 10px" }}
          type="text"
          inputMode="numeric"
          name="min"
          defaultValue={q.min ?? ""}
          placeholder="Min"
          aria-label="Minimum price"
        />
        <input
          className="cl-input w-1/2 text-[13px]"
          style={{ padding: "9px 10px" }}
          type="text"
          inputMode="numeric"
          name="max"
          defaultValue={q.max ?? ""}
          placeholder="Max"
          aria-label="Maximum price"
        />
      </div>

      {/* Submit is needed for keyboard and no-JS use; it stays quiet because
          the rail's other controls apply on click. */}
      <button type="submit" className="cl-quiet mt-2.5 text-[12.5px]">
        Apply price
      </button>
    </form>
  );
}
