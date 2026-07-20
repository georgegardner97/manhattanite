// BoxButton — the primary action, and the ONLY boxed element in the system.
//
// Design foundation, Slice 1. The whole visual language is hairlines and type;
// nothing else on the site gets a border-plus-padding treatment. That scarcity
// is what makes this read as "the action" without needing a fill color, a
// shadow, or a radius. Spec (v8 mockup): 1px border, 13px/26px padding, 11px
// caps Inter 500 at +0.14em, transparent background, fills on hover.
//
//   light surface → ink border + ink text, hover fills ink with bone text
//   dark surface  → bone border + bone text, hover fills bone with park text
//
// Renders as a next/link when given an internal `href`, a plain <a> for hash
// and mailto targets, and a <button> otherwise (form submits).

import Link from "next/link";
import type { ReactNode } from "react";

const BASE =
  "inline-block border px-[26px] py-[13px] text-[11px] leading-[1.4] tracking-[0.14em] uppercase font-medium bg-transparent cursor-pointer transition-colors duration-[250ms]";

const SURFACE = {
  light: "border-ink text-ink hover:bg-ink hover:text-bone",
  dark: "border-bone/80 text-bone hover:bg-bone hover:text-park",
} as const;

export type Surface = keyof typeof SURFACE;

// The class string on its own, for the two places that need the BoxButton LOOK
// on an element this component can't render: ContactModal's trigger (a client
// onClick, which a Server Component must not be handed) and any future
// third-party control. Prefer the component; reach for this only when the
// element itself has to live in the caller.
export function boxButtonClass(surface: Surface = "light"): string {
  return `${BASE} ${SURFACE[surface]}`;
}

// Disabled styling is shared by every form submit in the system: fade it, and
// stop the hover fill from firing on a button that won't do anything.
const DISABLED =
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const DISABLED_TEXT = {
  light: "disabled:hover:text-ink",
  dark: "disabled:hover:text-bone",
} as const;

export default function BoxButton({
  children,
  href,
  surface = "light",
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  surface?: Surface;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const classes = `${BASE} ${SURFACE[surface]} ${className}`;

  if (href) {
    // Hash anchors and mailto/tel are not routes — next/link would try to
    // prefetch them. Plain <a> handles both correctly.
    const isRoute = href.startsWith("/");
    return isRoute ? (
      <Link href={href} className={classes}>
        {children}
      </Link>
    ) : (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${classes} ${DISABLED} ${DISABLED_TEXT[surface]}`}
    >
      {children}
    </button>
  );
}
