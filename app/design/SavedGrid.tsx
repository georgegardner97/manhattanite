"use client";

// Screen 06's grid — the saved listings, picked out of the gated read.
//
// WHY THE FILTERING HAPPENS HERE AND NOT ON THE SERVER: the saved set lives in
// localStorage (see saved-store.ts), which the server cannot read. So the page
// hands down every listing the viewer is already permitted to see and this
// component keeps the saved ones.
//
// That arrangement has a property worth stating, because the obvious
// alternative does not have it: the saved list can never show a listing the
// viewer would not otherwise be allowed to see. The ids in localStorage are
// untrusted — anyone can type ids into their own storage — and here they only
// ever select from a set the server already gated. An endpoint that took ids
// and returned listings would have to re-derive that gate, and would be a real
// hole if it ever got it wrong.
//
// The cost is that a saved listing which has since been archived, or which has
// fallen past the 50-row feed ceiling, quietly disappears from this screen. For
// a prototype of a control that is the right trade; a real saved list is a
// table with a foreign key, and it would resolve those cases properly.

import { useEffect, useState } from "react";
import Link from "next/link";
import ClListingCard, { type ClCard } from "@/app/design/ClListingCard";
import ClSkeletonGrid from "@/app/design/ClSkeletonGrid";
import { subscribeSaved } from "@/app/design/saved-store";

export default function SavedGrid({ cards }: { cards: ClCard[] }) {
  // `null` is "not read yet", which is a different state from "read, empty" —
  // and they need different pictures. Starting at null also keeps the first
  // client render identical to the server's, so there is no hydration mismatch.
  const [saved, setSaved] = useState<Set<string> | null>(null);

  useEffect(() => subscribeSaved(setSaved), []);

  if (saved === null) {
    return (
      <>
        <Count label="Only you can see this list" />
        <ClSkeletonGrid count={2} />
      </>
    );
  }

  const mine = cards.filter((c) => saved.has(c.id));

  if (mine.length === 0) {
    return (
      <>
        <Count label="Only you can see this list" />
        <div
          className="mt-[26px] rounded-[12px] border px-7 py-13 text-center"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          <div className="text-[17px]">Nothing saved yet</div>
          <p
            className="mx-auto mt-2.5 mb-5 max-w-[320px] text-[13.5px] leading-[1.55]"
            style={{ color: "var(--cl-muted)" }}
          >
            Saved listings are private to you.
          </p>
          <Link href="/design/browse" className="cl-pill">
            Browse listings
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Count
        label={`${mine.length} listing${mine.length === 1 ? "" : "s"} you're thinking about`}
      />
      <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(22px,2.4vw,34px)]">
        {mine.map((card) => (
          // The card brings its own overlay save pill, which on this screen is
          // the thing that removes it — so the design's separate "Remove" text
          // underneath would be a second control for one action. The pill's
          // "Saved" state is already the affordance, and tapping it empties the
          // card out of the grid.
          <ClListingCard key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}

function Count({ label }: { label: string }) {
  return (
    <div className="mt-2 text-[13px]" style={{ color: "var(--cl-muted)" }}>
      {label}
    </div>
  );
}
