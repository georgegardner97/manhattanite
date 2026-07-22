// ArrowLink — the secondary action, an underlined text link.
//
// Design foundation, Slice 1; restyled 2026-07-22. Pairs with BoxButton: every
// screen gets at most one boxed primary action, and everything else that moves
// you forward is one of these. 14px Inter, park on the light surface, cream on
// the dark one, with a persistent hairline underline — visible at rest so the
// link reads as tappable on phones (where there is no hover), strengthening to
// full color on hover.
//
// (The component keeps its historical name. Forward links no longer carry the
// "→" glyph — the underline is the affordance now. Back links keep "←": there
// the arrow means direction, not decoration.)
//
// `as="span"` renders the label without its own anchor — for use inside a card
// that is already one big link, where a nested <a> would be invalid HTML.
//
// `direction="back"` puts a ← to the LEFT of the label ("← Listings"). Same
// component because it's the same gesture, and back links were otherwise the
// one secondary action in the system still hand-rolled per page.

import Link from "next/link";
import type { ReactNode } from "react";

const BASE =
  "mh-tap inline-block text-[14px] underline underline-offset-4 decoration-1 transition-colors";

// The underline sits at reduced strength at rest and comes up to the full text
// color on hover — the same gesture the old hover-only underline made, played
// in reverse. `group` mirrors it when the wrapping card is hovered (span mode).
const SURFACE = {
  light: {
    text: "text-park decoration-park/45",
    hover: "hover:decoration-park",
    group: "group-hover:decoration-park",
  },
  dark: {
    text: "text-cream decoration-cream/50",
    hover: "hover:decoration-cream",
    group: "group-hover:decoration-cream",
  },
} as const;

export default function ArrowLink({
  children,
  href,
  surface = "light",
  as = "link",
  direction = "forward",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  surface?: keyof typeof SURFACE;
  as?: "link" | "span";
  direction?: "forward" | "back";
  className?: string;
}) {
  const s = SURFACE[surface];

  // Back links keep the glyph; a non-breaking space welds it to the first word
  // if the label ever wraps. Forward links are the bare label.
  const label =
    direction === "back" ? (
      <>
        &#8592;&nbsp; {children}
      </>
    ) : (
      children
    );

  if (as === "span" || !href) {
    // Inside a card-wide link: the whole card is the hit target, so this is
    // decoration. group-hover strengthens the underline with the card.
    return (
      <span className={`${BASE} ${s.text} ${s.group} ${className}`}>
        {label}
      </span>
    );
  }

  const classes = `${BASE} ${s.text} ${s.hover} ${className}`;

  return href.startsWith("/") ? (
    <Link href={href} className={classes}>
      {label}
    </Link>
  ) : (
    <a href={href} className={classes}>
      {label}
    </a>
  );
}
