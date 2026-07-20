// ArrowLink — the secondary action: "→ Label".
//
// Design foundation, Slice 1. Pairs with BoxButton: every screen gets at most
// one boxed primary action, and everything else that moves you forward is an
// ArrowLink. 14px Inter, park on the light surface, cream on the dark one,
// underline on hover only.
//
// The arrow is part of the component (not the caller's string) so the glyph and
// its spacing stay identical everywhere. `as="span"` renders the label without
// its own anchor — for use inside a card that is already one big link, where a
// nested <a> would be invalid HTML.
//
// `direction="back"` flips the glyph to ← and moves it to the LEFT of the label
// ("← Listings"). Same component because it's the same gesture — a direction,
// not a button — and back links were otherwise the one secondary action in the
// system still hand-rolled per page.

import Link from "next/link";
import type { ReactNode } from "react";

const BASE =
  "inline-block text-[14px] hover:underline underline-offset-4 transition-colors";

const SURFACE = {
  light: "text-park",
  dark: "text-cream",
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
  const classes = `${BASE} ${SURFACE[surface]} ${className}`;

  // The arrow and its trailing space. A non-breaking space keeps the glyph
  // welded to the first word if the label ever wraps.
  const label =
    direction === "back" ? (
      <>
        &#8592;&nbsp; {children}
      </>
    ) : (
      <>
        &#8594;&nbsp; {children}
      </>
    );

  if (as === "span" || !href) {
    // Inside a card-wide link: the whole card is the hit target, so this is
    // decoration. group-hover mirrors the underline when the card is hovered.
    return (
      <span className={`${classes} group-hover:underline`}>{label}</span>
    );
  }

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
