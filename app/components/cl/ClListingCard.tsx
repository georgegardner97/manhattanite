// ClListingCard — the Classifieds listing card.
//
// Screen 02's grid cell, and the object the whole system is really about. Its
// order is deliberate and differs from the live editorial card: photograph
// first, then a kicker row that pairs neighborhood with price, then the title,
// then the byline. The editorial card leads with a hairline kicker and holds
// the price up beside a serif title; this one lets the image do the work and
// keeps the type quiet underneath.
//
// ONE THING CARRIED OVER FROM THE LIVE SYSTEM, NOT IN THE DESIGN: the EXAMPLE
// tag. Seed listings exist to show what the network looks like, and nobody
// should be able to mistake one for a live deal — that is a trust requirement,
// not a style choice, so it survives the change of design system. It is set
// here in the "vouched" tag colors, which is the warmest chip the palette has
// and the closest thing it offers to "read this before you read the price".

// Both links point INSIDE the preview (/listings/[id], screen 03). The
// first slice sent them to the live /listings/[id] because screen 03 did not
// exist yet, which meant every click out of the grid left the design system
// mid-journey — the one path a visual review most needs to be able to walk.

import Link from "next/link";
import SaveButton from "@/app/components/cl/SaveButton";

export type ClCard = {
  id: string;
  title: string;
  /** Neighborhood if the listing has one, otherwise the category. */
  place: string;
  /** Preformatted, e.g. "$6,800/mo". */
  price: string;
  /** Byline plus relative date — "Listed by Claire · sponsored by Dan · 4 days ago". */
  meta: string;
  coverUrl: string | null;
  isExample: boolean;
};

/**
 * `href` defaults to the listing's public page. It is nullable for ONE caller:
 * /listings/mine, where a pending or draft listing of your own has no public
 * page at all — RLS reads published rows only, so the link would 404 for its
 * own author. A card with no destination renders as a card and not a link,
 * rather than as a link that lies.
 */
export default function ClListingCard({
  card,
  href = `/listings/${card.id}`,
  showSave = true,
}: {
  card: ClCard;
  href?: string | null;
  /** Off on /listings/mine — saving your own listing is a control that does
   *  nothing for you, and Saved is a shortlist of other people's things. */
  showSave?: boolean;
}) {
  // Static markup when there is nowhere to go, so the whole card stops being
  // interactive — not an <a> with its href quietly removed.
  const Media = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href} className="cl-cardlink block">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return (
    <div>
      {/* The save pill is a SIBLING of the link, not a child: a <button> inside
          an <a> is invalid, and nesting it would make every save click a
          navigation the moment the handler failed. */}
      <div className="relative">
        <Media>
          <div
            className="cl-media"
            style={{ height: "clamp(170px, 15vw, 210px)" }}
          >
            {/* No `loading` attribute, matching the live ListingCard. Browse
                already ships up to 50 eager covers today, and switching this
                grid to lazy would be a performance change smuggled in with a
                design port — it belongs in its own pass, measured, across both
                card components at once. */}
            {card.coverUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={card.coverUrl} alt="" />
            )}
          </div>
        </Media>
        {showSave && href && <SaveButton id={card.id} title={card.title} />}
      </div>

      <Media>
        <div className="mt-3.5 flex items-baseline justify-between gap-3.5">
          {/* min-w-0 + truncate: a long neighborhood must shrink rather than
              shove the price off the card's right edge. */}
          <span className="cl-kicker min-w-0 truncate">{card.place}</span>
          <span className="shrink-0 whitespace-nowrap text-[15.5px] tabular-nums">
            {card.price}
          </span>
        </div>

        <div className="cl-card-title mt-[7px] text-[16px] leading-[1.3] transition-colors">
          {card.title}
        </div>

        <div
          className="mt-[7px] text-[12.5px]"
          style={{ color: "var(--cl-muted)" }}
        >
          {card.isExample && (
            <span className="cl-chip cl-chip-xs cl-tag-vouched mr-2">
              Example
            </span>
          )}
          {card.meta}
        </div>
      </Media>
    </div>
  );
}
