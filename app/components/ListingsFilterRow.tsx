"use client";

// The mobile category filter row for /listings — the horizontal small-caps
// strip that takes over below 860px, where the vertical rail would push the
// listings off the first screen. (Extracted from app/listings/page.tsx in the
// mobile pass, 2026-07-21.)
//
// Why a Client Component: the row is wider than a phone (five categories at
// ~485px against a 346px column) and scrolls horizontally, so for ?type=other
// the ACTIVE chip — "Everything else", last in the row — loaded offscreen with
// no hint it was selected. The one effect below scrolls the active chip into
// view once, on mount. Rendering and the ?type= link behavior are exactly what
// the server component produced before; the filter definitions still live in
// the page, which passes them down as plain props.

import Link from "next/link";
import { useEffect, useRef } from "react";

export type FilterRowItem = {
  label: string;
  href: string;
  active: boolean;
};

export default function ListingsFilterRow({
  items,
}: {
  items: FilterRowItem[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Center the active chip on load. Direct scrollLeft, not scrollIntoView —
  // the latter would also scroll the PAGE to the row, and smooth-scrolling a
  // row the visitor hasn't touched yet reads as the page moving on its own.
  useEffect(() => {
    const row = rowRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !active) return;
    row.scrollLeft = Math.max(
      0,
      active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2
    );
  }, []);

  return (
    <div
      ref={rowRef}
      className="hidden max-[860px]:flex min-w-0 gap-x-[26px] mt-[26px] overflow-x-auto whitespace-nowrap mh-no-scrollbar"
    >
      {items.map((f) => (
        <Link
          key={f.label}
          href={f.href}
          aria-current={f.active ? "page" : undefined}
          className={`mh-label mh-tap shrink-0 pb-[5px] border-b transition-colors ${
            f.active
              ? "text-ink border-park"
              : "text-slate border-transparent hover:text-ink"
          }`}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
