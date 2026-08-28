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
  /** The kicker: an apartment's neighborhood, or the category. See placeOf. */
  place: string;
  /** Preformatted, e.g. "$6,800/mo" — null when the listing has no price. */
  price: string | null;
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
/**
 * How many cards to load eagerly at the top of a grid.
 *
 * Every card grid in the product is `repeat(auto-fit, minmax(230px, 1fr))`, so
 * a row holds four or five on a wide screen and one or two on a phone. Four is
 * the number that covers the common desktop first row without guessing at the
 * viewport, which a server render cannot know. Erring high costs a couple of
 * extra requests; erring low costs the largest contentful paint, which is the
 * thing this pass exists to protect.
 */
export const EAGER_CARDS = 4;

export default function ClListingCard({
  card,
  href = `/listings/${card.id}`,
  showSave = true,
  eager = false,
}: {
  card: ClCard;
  href?: string | null;
  /** Off on /listings/mine — saving your own listing is a control that does
   *  nothing for you, and Saved is a shortlist of other people's things. */
  showSave?: boolean;
  /**
   * ABOVE THE FOLD. The first row of a grid loads eagerly; everything below it
   * is lazy. Passed by the page, because only the page knows how many cards a
   * row holds — see the note on the <img> below.
   */
  eager?: boolean;
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
            {/* LAZY BELOW THE FOLD — the measured pass the old note asked for
                (2026-08-28). Browse was shipping up to 50 eager covers, and a
                full page load on /listings took 4.3s against 0.9s to
                DOM-ready: nearly all of the gap was images still arriving.

                The first row stays EAGER so the largest contentful paint does
                not regress — lazy-loading the hero image is the classic way to
                make a page score worse while "optimising" it. `eager` is a prop
                rather than an index check inside the card, because how many
                cards make a row is a fact about the grid, not about a card.

                `decoding="async"` on every cover: even an eager image should
                not block the parser while it decodes. */}
            {card.coverUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={card.coverUrl}
                alt=""
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager ? "high" : "auto"}
              />
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
