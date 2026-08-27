// An archived listing on your own listings screen.
//
// THIS IS THE AUDIT FIX, CARRIED ACROSS DESIGN SYSTEMS. The July audit graded
// /listings/mine C+ for one specific reason: an archived test listing rendered
// at full card weight and out-shouted the live ones. The fix was structural
// rather than cosmetic — an archived listing stopped being the same OBJECT on
// the page as a live one. Active listings are cards; archived listings are
// compact rows under their own heading. Nothing about changing design system
// makes that less true, so the structure survives the port.
//
// WHY NOT ClListingRow. It is close, and it was the obvious thing to reuse, but
// it was built for search results and so leads with a thumbnail — and it links
// to /listings/[id] unconditionally. Both are wrong here. An archived listing
// wants no image at all (the photograph is the part that shouts) and it has no
// public page to link to: RLS reads published rows only, so the link would 404
// for its own author. Reusing the search row would have quietly reintroduced
// exactly the weight the audit told us to take out.
//
// So: status, title, price, date, and the moderator's note if there is one —
// for the record, which is the only reason an archived listing is still on the
// screen.

import { formatPrice } from "@/lib/listings/card";
import type { OwnRow } from "@/lib/cl/listings-read";
import { relativeDay } from "@/lib/cl/filters";

export default function ClArchivedRow({ row }: { row: OwnRow }) {
  return (
    <li
      className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 gap-y-1.5 border-t py-3.5 max-[720px]:grid-cols-[1fr_auto]"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      {/* No per-row status label. Every row under this heading is archived, and
          repeating the word on each one read as a stutter on the real screen.
          min-w-0 so a long title truncates rather than shoving the price out of
          the row. */}
      <span
        className="min-w-0 truncate text-[14px]"
        style={{ color: "var(--cl-muted)" }}
      >
        {row.title}
      </span>

      <span
        className="tabular-nums whitespace-nowrap text-[14px]"
        style={{ color: "var(--cl-muted)" }}
      >
        {formatPrice(row.price_cents, row.type)}
      </span>

      <span
        className="cl-kicker whitespace-nowrap max-[720px]:hidden"
        style={{ color: "var(--cl-faint)" }}
      >
        {relativeDay(row.created_at)}
      </span>

      {row.moderation_note && (
        <span
          className="col-span-3 max-w-[56ch] text-[12.5px] leading-[1.5] max-[720px]:col-span-2"
          style={{ color: "var(--cl-faint)" }}
        >
          From the review: {row.moderation_note}
        </span>
      )}
    </li>
  );
}
