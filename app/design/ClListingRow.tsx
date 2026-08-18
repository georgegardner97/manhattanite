// ClListingRow — screen 04's result row.
//
// The same listing as ClListingCard, laid out for scanning against a query
// instead of browsing: a small thumbnail, the listing in the middle, the price
// hard right. The card leads with the photograph because browsing is looking;
// a row leads with the words because searching is reading.
//
// It takes the same ClCard the grid takes, so a listing cannot say one thing on
// Browse and another on Search.

import Link from "next/link";
import type { ClCard } from "@/app/design/ClListingCard";

export default function ClListingRow({ card }: { card: ClCard }) {
  return (
    <Link href={`/design/listings/${card.id}`} className="cl-row cl-cardlink">
      <div className="cl-media h-[100px] w-full max-[600px]:h-[68px]">
        {card.coverUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={card.coverUrl} alt="" />
        )}
      </div>

      {/* min-w-0 so a long title truncates its own lines rather than widening
          the middle track and squeezing the price out of the row. */}
      <div className="min-w-0">
        <div className="cl-kicker mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {card.isExample && (
            <span className="cl-chip cl-chip-xs cl-tag-vouched">Example</span>
          )}
          <span className="truncate">{card.place}</span>
        </div>

        <div className="cl-card-title text-[17.5px] leading-[1.3] transition-colors max-[600px]:text-[15.5px]">
          {card.title}
        </div>

        <div
          className="mt-[7px] text-[12.5px]"
          style={{ color: "var(--cl-muted)" }}
        >
          {card.meta}
        </div>
      </div>

      <div className="cl-row-price text-[17.5px] tabular-nums whitespace-nowrap">
        {card.price}
      </div>
    </Link>
  );
}
