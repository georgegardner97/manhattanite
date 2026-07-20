// ListingCard — the flagship object of the design system.
//
// Design foundation, Slice 1. One card, two surfaces: light on the product
// screens ("inside"), dark in the landing page's "On the network" band
// ("outside"). Structure comes from the v8 mockup and is identical on both:
//
//   kicker row   place · EXAMPLE tag  …  posted date   (11px caps, hairline under)
//   media        4:3, object-cover, 1.025 scale on hover over 1.2s
//   title row    Instrument Serif 26px  …  price right, tabular
//   description  one or two lines, muted
//   byline       "Listed by X · sponsored by Y", small caps
//   action       ArrowLink "→ View listing"
//
// The whole card is a single link, so the ArrowLink inside renders as a span
// (a nested <a> would be invalid) and picks up the hover underline via
// group-hover.
//
// The EXAMPLE tag is a hard requirement, not decoration: seed listings show
// what the network looks like, and nobody should mistake one for a live deal.
// It sits in the kicker row at full contrast — deliberately louder than the
// muted place and date around it.

import Link from "next/link";
import ArrowLink from "@/app/components/ArrowLink";

export type ListingCardSurface = "light" | "dark";

export type ListingCardData = {
  id: string;
  title: string;
  description: string | null;
  /** Neighborhood when the listing has one, otherwise the category label. */
  place: string;
  /** Formatted price, e.g. "$3,400/mo". */
  price: string;
  /** Formatted posted date, e.g. "July 14". */
  postedAt: string;
  /** Signed cover-image URL, or null when the listing has no images. */
  coverUrl: string | null;
  isExample: boolean;
  /** "Listed by X · sponsored by Y" — omitted where the surface doesn't show it. */
  byline?: string | null;
};

const SURFACE = {
  light: {
    kicker: "border-ink/16 text-slate",
    media: "bg-[#EAE4D8]",
    title: "text-ink",
    body: "text-slate",
    tag: "border-ink/40 text-ink",
    byline: "text-slate",
  },
  dark: {
    kicker: "border-bone/16 text-bone/60",
    media: "bg-bone/6",
    title: "text-bone",
    body: "text-bone/60",
    tag: "border-bone/50 text-bone",
    byline: "text-bone/50",
  },
} as const;

export default function ListingCard({
  listing,
  surface = "light",
  href,
}: {
  listing: ListingCardData;
  surface?: ListingCardSurface;
  /**
   * Where the card points. Defaults to the listing's public page. Pass `null`
   * to render it unlinked — /listings/mine shows pending and draft listings,
   * which have no public page (the RLS read is published-only), and a card
   * that navigates to a 404 is worse than one that doesn't navigate.
   */
  href?: string | null;
}) {
  const s = SURFACE[surface];
  const target = href === undefined ? `/listings/${listing.id}` : href;

  const body = (
    <>
      {/* Kicker — place and the EXAMPLE tag left, posted date right. */}
      <div
        className={`mh-label flex items-center justify-between gap-4 border-b pb-[10px] mb-[18px] ${s.kicker}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {listing.isExample && (
            <span
              className={`shrink-0 border px-[6px] py-[2px] text-[9px] leading-[1.4] tracking-[0.14em] ${s.tag}`}
            >
              Example
            </span>
          )}
          <span className="truncate">{listing.place}</span>
        </span>
        <span className="shrink-0">{listing.postedAt}</span>
      </div>

      <div className={`aspect-[4/3] overflow-hidden ${s.media}`}>
        {listing.coverUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.coverUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.025]"
          />
        )}
      </div>

      <h3
        className={`font-serif font-normal text-[26px] leading-[1.15] mt-5 flex items-baseline justify-between gap-5 ${s.title}`}
      >
        <span>{listing.title}</span>
        <span className="font-sans text-[15px] font-medium whitespace-nowrap tabular-nums">
          {listing.price}
        </span>
      </h3>

      {listing.description && (
        <p className={`mt-2 max-w-[44ch] mh-clamp-2 ${s.body}`}>
          {listing.description}
        </p>
      )}

      {listing.byline && (
        <p className={`mh-label mt-3.5 ${s.byline}`}>{listing.byline}</p>
      )}

      {/* The forward action only makes sense when the card goes somewhere. */}
      {target && (
        <div className="mt-3.5">
          <ArrowLink as="span" surface={surface}>
            View listing
          </ArrowLink>
        </div>
      )}
    </>
  );

  if (!target) {
    // `group` stays so the media's hover scale still reads as one object.
    return <div className="group block">{body}</div>;
  }

  return (
    <Link href={target} className="group block">
      {body}
    </Link>
  );
}
