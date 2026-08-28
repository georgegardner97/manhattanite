// FilterRail — the left column of screen 02.
//
// TWO GROUPS NOW: Category, and Neighborhood when it applies. Every control is
// a link, so the rail works with JavaScript off and every filtered view has its
// own URL.
//
// WHAT WAS HERE AND IS NOT (George, 2026-08-28), because a rail that loses two
// of its four elements looks like something broke:
//
//   THE PER-CATEGORY COUNTS. Every category carried a live number. Two of them
//   were permanently 0 — nothing has ever been listed under Services or
//   Everything else — so the rail opened by telling you how empty the network
//   is. The result line above the grid still counts the current view, which is
//   the question worth answering.
//
//   THE PRICE BOXES. Min/max and "Apply price" are gone, one day after the
//   price SORT went, and for the same reason: price is not the axis this
//   network is organized on. Full reasoning in the header of filters.ts, which
//   is also where the superseded 27 Aug argument for keeping them is recorded.
//
// Neither removal touches what a listing SHOWS. Prices are still on every card.
//
// MOBILE IS AN ADDITION, NOT A PORT. The design file specifies one layout: a
// 220px rail beside the grid. Stacked on a phone that rail is ~400px of
// chrome before the first listing, which is the exact problem the live browse
// page already solved once (mobile pass, 2026-07-21 — the vertical rail falls
// back to a horizontal row). The same answer is taken here: below 860px the
// categories become a horizontally scrolling chip row, and neighborhood folds
// into a disclosure that starts closed. Desktop is the design.

import Link from "next/link";
import {
  CATEGORIES,
  buildHref,
  hoodApplies,
  type ClQuery,
} from "@/lib/cl/filters";

export type RailProps = {
  q: ClQuery;
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
      </aside>

      {/* ---------- Mobile: chips + a disclosure ---------- */}
      <div className="hidden min-w-0 max-[860px]:block">
        <div className="mh-no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          {CATEGORIES.map((c) => {
            const on = c.value === props.q.type;
            return (
              <Link
                key={c.label}
                href={buildHref(props.q, { type: c.value })}
                aria-current={on ? "page" : undefined}
                className={`cl-chip shrink-0${on ? " cl-chip-on" : ""}`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        {/* THE DISCLOSURE IS RENDERED ONLY WHEN IT HAS SOMETHING IN IT. It used
            to hold neighborhood and price, so it always had at least the price
            boxes and could be rendered unconditionally. With price gone its
            only content is neighborhood, which appears for apartments alone —
            rendering it regardless would put a "Neighborhood ▾" toggle on every
            other category that opens onto nothing. */}
        {showHoods && (
          <details className="mt-3.5">
            {/* A <summary> with its marker removed reads as static text, so the
                caret is restored explicitly and rotates on open — otherwise the
                only filter a phone has is invisible. */}
            <summary
              className="cl-summary flex cursor-pointer list-none items-center gap-1.5 text-[13px]"
              style={{ color: "var(--cl-muted)" }}
            >
              Neighborhood
              <span className="cl-caret" aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className="mt-3.5">
              <Group label="Neighborhood">
                <HoodRows {...props} />
              </Group>
            </div>
          </details>
        )}
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

function CategoryRows(props: RailProps) {
  return (
    <>
      {CATEGORIES.map((c) => {
        const on = c.value === props.q.type;
        return (
          <Link
            key={c.label}
            href={buildHref(props.q, { type: c.value })}
            aria-current={on ? "page" : undefined}
            className={`cl-rail-row${on ? " cl-rail-row-on" : ""}`}
          >
            <span className="min-w-0 truncate">{c.label}</span>
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
