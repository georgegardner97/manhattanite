// AppHeader — the Classifieds system's product header.
//
// Ported from AppHeader.dc.html in the Claude Design project: wordmark left,
// three pill-shaped nav links beside it, one filled action pill right, closed
// by a hairline. The active link is marked by a filled pill (fill-active +
// weight 500) rather than the live system's underline.
//
// The nav is the design's own — Browse, Saved, Profile. Saved and Search were
// both out of v1 in mvp-spec.md and were put to the founder on 2026-08-18 with
// the case for shipping them: Saved lives in the browser and touches no table,
// and Search is a narrowing of the same permission-checked read, so neither
// widens what anyone can see. Both were approved and the spec updated. Had they
// been cut, this nav would be two items and /saved and /search would not exist.
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
//   2. Profile and the action pill point at /profile and /listings/new, which
//      are still EDITORIAL screens until Slice 2 migrates them. Crossing design
//      systems mid-navigation is a real seam, and it is accepted here rather
//      than hidden: the alternative is a header whose primary action goes
//      nowhere. Slice 2 closes it by migrating the two destinations.

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";

export type ClNavKey = "browse" | "saved" | "profile" | "none";

const LINKS: { key: ClNavKey; label: string; href: string }[] = [
  { key: "browse", label: "Browse", href: "/listings" },
  { key: "saved", label: "Saved", href: "/saved" },
  // Profile means the account screen, which is how the design file itself
  // reads it: screen 10 ("Account settings") is drawn with active="profile".
  { key: "profile", label: "Profile", href: "/profile" },
];

export default function AppHeader({ active = "none" }: { active?: ClNavKey }) {
  return (
    <header
      className="border-b"
      style={{
        borderColor: "var(--cl-hairline)",
        background: "var(--cl-surface)",
      }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-[clamp(16px,2.4vw,28px)] py-3.5">
        <div className="flex items-center gap-[clamp(14px,2vw,28px)]">
          <Link href="/listings" style={{ color: "var(--cl-ink)" }}>
            <Wordmark className="text-[19px] leading-none" />
          </Link>

          {/* Below 600px the wordmark, three links and the action pill add up
              to ~460px of content in a 375px bar — the pill ends up outside
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

        <Link href="/listings/new" className="cl-pill cl-pill-sm">
          Post a listing
        </Link>
      </div>
    </header>
  );
}
