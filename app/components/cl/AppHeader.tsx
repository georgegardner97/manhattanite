// AppHeader — the Classifieds system's product header.
//
// Ported from AppHeader.dc.html in the Claude Design project: wordmark left,
// pill-shaped nav links beside it, one filled action pill right, closed by a
// hairline. The active link is marked by a filled pill (fill-active +
// weight 500) rather than the live system's underline.
//
// THE NAV IS TWO ITEMS: Browse and Profile.
//
// The design's own nav was Browse · Saved · Profile, and it shipped that way.
// Saved left it on 2026-08-27 (George: "'Saved' should not be a main menu
// option — you should be able to see your saved posts but only in your
// profile"). Nothing else about Saved changed: the route is still there, the
// save pill is still on every card, and /profile now carries the row that
// reaches it. This only moves where the list is FOUND.
//
// Search never had a slot here and now never will — it lives ON Browse as of
// the same day, because /search was the same gated read with a term added. So
// the slot Saved vacated stays vacant rather than being refilled.
//
// TWO DEPARTURES FROM THE DESIGN FILE, both deliberate:
//
//   1. The wordmark keeps its period. AppHeader.dc.html sets the mark as
//      "Manhattanite" with no full stop, but the period is a LOCKED brand
//      decision (Concept D, 2026-07-21 — "the period is PART of the mark:
//      never dropped"), so this renders the shared Wordmark component rather
//      than re-cutting the mark to match a mockup that predates the decision.
//      That also means the mark stays Instrument Serif while the rest of the
//      system is set in Newsreader — the one place the two faces touch. That
//      was looked at on a real screen on 2026-08-18 and kept: re-cutting the
//      mark would reopen a locked decision and orphan the favicon and OG card,
//      which are already cut in Instrument Serif.
//
//   2. Profile and the action pill point at /profile and /listings/new. Slice 1
//      shipped this header with both destinations still on the EDITORIAL side —
//      a real seam, accepted rather than hidden, because the alternative was a
//      header whose primary action went nowhere. SLICE 2 CLOSED IT: both are
//      Classifieds screens now, as are /login, /signup, /apply, /listings/mine
//      and the edit and contact routes. Every destination this header offers
//      stays inside the system it is drawn in.
//
// THE ADMIN LINK IS A PROP, NOT A LOOKUP, AND THAT IS DELIBERATE. /admin was
// reachable from exactly one place — AccountMenu, inside SiteNav, mounted only
// in app/(ed)/layout.tsx. Once the migration merges, the only (ed) routes left
// ARE the admin pages, so the single link into the console would have rendered
// only on pages you cannot reach without already being there. This header is
// the replacement way in.
//
// It takes `admin` as a prop rather than reading the session itself because
// AppHeader is synchronous and eight routes that render it are prerendered
// static — /terms, /privacy, /thank-you, /reset-request, /reset-password,
// /profile/edit and the two /design pages. Making it async to fetch a role
// would flip all eight to server-rendered-on-demand, and make every visitor
// pay an auth round trip for a link one person sees. So the one screen that
// already reads the account row passes the flag, and /profile — a permanent
// item in this header's own nav — is the door. Slice 3b can widen it.

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";

export type ClNavKey = "browse" | "profile" | "none";

/**
 * WHICH CONTENT WIDTH THE BAR SHOULD MATCH.
 *
 * The header cannot pick one number, because the product has several: browse
 * is 1400, the landing and /listings/mine are 1240, most reading screens are
 * 1100, /members/[id] is 1000 and /profile is 900. The bar was hard-coded to
 * 1240, so on browse — the widest and most-used screen — it sat 80px inside
 * the grid on any window over 1400px, which is George's 2026-08-27 note that
 * "the post listing button seems like it's in a random place". It was: the
 * pill's right edge landed 80px short of the right-hand card column.
 *
 * So the page tells the bar what it is, the same way it already tells it which
 * nav item is active and whether to show Admin. "standard" is the old 1240 and
 * stays the default, so every screen except browse is untouched.
 *
 * FLAGGED, NOT FIXED (for George): four content widths is three too many, and
 * nobody chose four — they accumulated. Collapsing 1240/1400 into one and
 * 1000/1100 into another would leave the system two, but it moves every screen
 * and belongs in its own pass.
 */
export type ClHeaderWidth = "standard" | "wide";

const MAX_WIDTH: Record<ClHeaderWidth, string> = {
  // Written out in full, not composed — Tailwind scans source for whole class
  // names, and `max-w-[${n}px]` would compile to nothing.
  standard: "max-w-[1240px]",
  wide: "max-w-[1400px]",
};

const LINKS: { key: ClNavKey; label: string; href: string }[] = [
  { key: "browse", label: "Browse", href: "/listings" },
  // Profile means the account screen, which is how the design file itself
  // reads it: screen 10 ("Account settings") is drawn with active="profile".
  // It is also the way into Saved now, and the way into /admin.
  { key: "profile", label: "Profile", href: "/profile" },
];

export default function AppHeader({
  active = "none",
  /** Renders the quiet Admin link. Only ever true for role='admin'. */
  admin = false,
  /** The content width of the page below, so the bar lines up with it. */
  width = "standard",
}: {
  active?: ClNavKey;
  admin?: boolean;
  width?: ClHeaderWidth;
}) {
  return (
    <header
      className="border-b"
      style={{
        borderColor: "var(--cl-hairline)",
        background: "var(--cl-surface)",
      }}
    >
      <div
        className={`mx-auto flex ${MAX_WIDTH[width]} items-center justify-between gap-6 px-[clamp(16px,2.4vw,28px)] py-3.5`}
      >
        <div className="flex items-center gap-[clamp(14px,2vw,28px)]">
          <Link href="/listings" style={{ color: "var(--cl-ink)" }}>
            <Wordmark className="text-[19px] leading-none" />
          </Link>

          {/* Below 600px the wordmark, the nav links and the action pill add
              up to more content than a 375px bar holds — the pill ends up outside
              the gutter, hard against the screen edge. The design's own answer
              for a phone (screen 12) is a top bar carrying only the wordmark
              and one control, with navigation moved to a bottom tab bar. Both
              halves are built now: this nav hides, and MobileTabBar takes over
              from the layout. */}
          <nav className="flex items-center gap-0.5 text-[13px] max-[600px]:hidden">
            {LINKS.map((l) => {
              const on = l.key === active;
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  aria-current={on ? "page" : undefined}
                  className="rounded-full px-3 py-[7px]"
                  style={
                    on
                      ? {
                          color: "var(--cl-ink)",
                          fontWeight: 500,
                          background: "var(--cl-fill-active)",
                        }
                      : { color: "var(--cl-muted)" }
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-[clamp(10px,1.4vw,18px)]">
          {/* A tool, not a nav item: no pill, no active state, faint. It sits
              outside LINKS on purpose — those three are the product, this is
              the back office, and only one account ever sees it. */}
          {admin && (
            <Link
              href="/admin"
              className="text-[13px] max-[440px]:hidden"
              style={{ color: "var(--cl-faint)" }}
            >
              Admin
            </Link>
          )}

          <Link href="/listings/new" className="cl-pill cl-pill-sm">
            Post a listing
          </Link>
        </div>
      </div>
    </header>
  );
}
