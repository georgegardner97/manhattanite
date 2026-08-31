// ClListingCard — the Classifieds listing card.
//
// Screen 02's grid cell, and the object the whole system is really about. Its
// order is deliberate and differs from the live editorial card: photograph
// first, then a kicker row that pairs neighborhood with price, then the title,
// then the byline. The editorial card leads with a hairline kicker and holds
// the price up beside a serif title; this one lets the image do the work and
// keeps the type quiet underneath.
//
// THE EXAMPLE TAG IS GONE FROM THE CARD (George, 2026-08-31). It had been kept
// as a trust requirement — nobody should mistake a seed listing for a live deal
// — and that reasoning has not changed; what changed is who is looking. Nobody
// but George can reach the site yet, he knows which listings are his own seed
// content, and the chip was costing the byline a second line on every card.
//
// THE TAG COMES BACK OR THE LISTINGS GO, BEFORE THE FIRST INVITATION. George's
// plan is the latter: remove the seed listings entirely once the site is
// circulated (wave one is 7-13 Sep in timeline v3). Whichever way it goes, a
// stranger must never meet an unlabelled example. `is_example` is still read,
// still on the row and still in ClCard — only the chip stopped rendering — so
// this is one JSX block to restore, and the seed rows stay findable by the flag
// when it is time to delete them.

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
  /**
   * The byline alone — "Listed by Claire · vouched for by Dan". Empty string on
   * a member's own profile, where every card has the same author and naming him
   * once per card is noise.
   */
  meta: string;
  /** Relative date — "4 days ago". Kept apart from `meta` so it cannot be the
   *  half that gets truncated; see the meta row below. */
  when: string;
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

        {/* ONE LINE, ALWAYS, AND THE DATE IS NEVER THE HALF THAT GOES.
            Measured: a card is ~300px wide on a 1280px screen, a guest's
            "Vouched for by a member" costs ~230px and fits, but a member's
            "Listed by Lila · vouched for by George Gardner" costs ~345px and
            does not. As one string it wrapped and stranded "ago" on its own
            line, and where it broke depended on how long the lister's name was,
            so no two cards in a row agreed.

            So the byline truncates (min-w-0 is what lets it) and the date is
            shrink-0 beside it: every card gets exactly one line, and what is
            lost when a name is long is the tail of the name — never "4 days
            ago", which is the part that says whether a listing is stale. The
            separator is rendered here rather than baked into either string, so
            the profile page's date-only card does not start with a stray "·".*/}
        <div
          className="mt-[7px] flex items-baseline gap-x-1.5 text-[12.5px]"
          style={{ color: "var(--cl-muted)" }}
        >
          {card.meta && (
            <>
              <span className="min-w-0 truncate">{card.meta}</span>
              <span className="shrink-0">·</span>
            </>
          )}
          <span className="shrink-0 whitespace-nowrap">{card.when}</span>
        </div>
      </Media>
    </div>
  );
}
