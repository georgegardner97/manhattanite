// ClLandingCard — the listing card on Landing v3.
//
// Nearly ClListingCard, and deliberately not it. Three differences, all of them
// consequences of the card being on a PUBLIC page rather than inside the
// product:
//
//   1. No save pill. Saving is a member gesture and the store is per-browser;
//      offering it to a stranger who has never signed in is a control that
//      quietly does nothing they will ever see again.
//   2. Bigger media and bigger type — the design gives the landing card a
//      210–280px frame against browse's 170–210px, and a 17px title against
//      16px. Six cards on an otherwise empty page can afford the room.
//   3. It takes whatever meta the page hands it, and the landing hands it a
//      byline with no names in it. See the note in landing/page.tsx.
//
// It shares the ClCard type with the grid and the search row, so a listing
// cannot say one thing here and another inside.

import Link from "next/link";
import type { ClCard } from "@/app/components/cl/ClListingCard";

export default function ClLandingCard({ card }: { card: ClCard }) {
  return (
    <Link href={`/listings/${card.id}`} className="cl-cardlink block">
      <div className="cl-media" style={{ height: "clamp(210px, 22vw, 280px)" }}>
        {card.coverUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={card.coverUrl} alt="" />
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <span className="cl-kicker min-w-0 truncate">{card.place}</span>
        <span className="shrink-0 whitespace-nowrap text-[16px] tabular-nums">
          {card.price}
        </span>
      </div>

      <div className="cl-card-title mt-[7px] text-[17px] leading-[1.3] transition-colors">
        {card.title}
      </div>

      <div className="mt-2 text-[12.5px]" style={{ color: "var(--cl-muted)" }}>
        {/* THE EXAMPLE TAG IS KEPT HERE AND ONLY HERE. It was dropped from the
            card and the detail page on 2026-08-31 because only George can reach
            the site; this component renders on NOTHING today (landing v4 is the
            door — CLAUDE.md note 13) and is held unreferenced for that revert.
            If it ever renders again it is the most public page in the product,
            which is the one place mistaking seed content for a live deal costs
            the most — so the tag stays with the code it would come back with. */}
        {card.isExample && (
          <span className="cl-chip cl-chip-xs cl-tag-vouched mr-2">Example</span>
        )}
        {[card.meta, card.when].filter(Boolean).join(" · ")}
      </div>
    </Link>
  );
}
