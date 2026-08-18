// AppHeader — the Classifieds system's product header.
//
// Ported from AppHeader.dc.html in the Claude Design project: wordmark left,
// three pill-shaped nav links beside it, one filled action pill right, closed
// by a hairline. The active link is marked by a filled pill (fill-active +
// weight 500) rather than the live system's underline.
//
// The nav is now the design's own — Browse, Saved, Profile. The first slice
// substituted "Components" for Saved because Saved was screen 06 and hadn't
// been built; screen 06 exists now, so the substitution is retired and the kit
// is reached from the /design contents page instead.
//
// TWO DEPARTURES FROM THE DESIGN FILE, both deliberate:
//
//   1. The wordmark keeps its period. AppHeader.dc.html sets the mark as
//      "Manhattanite" with no full stop, but the period is a LOCKED brand
//      decision (Concept D, 2026-07-21 — "the period is PART of the mark:
//      never dropped"), so this renders the shared Wordmark component rather
//      than re-cutting the mark to match a mockup that predates the decision.
//      That also means the mark stays Instrument Serif here while the rest of
//      this preview shows the design's proposed Newsreader — the one place the
//      two systems touch. Worth a look on screen.
//
//   2. Profile points at the LIVE /profile, not a Classifieds one. Screen 08
//      is a public member profile — someone else's name, their listing count,
//      who vouched for them — and publishing that is a data-exposure decision
//      with an RLS policy behind it, not a design port. It is out of this
//      slice (see the note on app/design/page.tsx), so the link goes where a
//      profile actually exists today and visibly leaves this design system.

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";

export type ClNavKey = "browse" | "saved" | "profile" | "none";

const LINKS: { key: ClNavKey; label: string; href: string }[] = [
  { key: "browse", label: "Browse", href: "/design/browse" },
  { key: "saved", label: "Saved", href: "/design/saved" },
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
          <Link href="/design/browse" style={{ color: "var(--cl-ink)" }}>
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
