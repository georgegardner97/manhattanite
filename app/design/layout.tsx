// /design — the Classifieds preview area.
//
// A proving ground, not a shipped surface. Screens 01 (Components) and 02
// (Browse) from the Claude Design project are built here against the REAL
// listings table so the new visual system can be judged on real data, real
// photographs and real bylines before anything commits to it. Nothing outside
// this directory changes behavior, and deleting `app/design/` plus the two
// lines in NavGate reverts the whole slice.
//
// Three things this layout owns:
//
//   1. THE FONTS. The design proposes Newsreader + Instrument Sans against the
//      live system's Instrument Serif + Inter. They are loaded here, not in the
//      root layout, so the live pages never download or apply them — the two
//      systems stay genuinely separate rather than sharing a body class.
//
//   2. THE SCOPE. `.cl-root` is where every token in classifieds.css resolves.
//      One wrapper, one scope; no token leaks into the editorial system.
//
//   3. NOINDEX. This is unfinished design work on a live domain. It must not be
//      crawled, and it must not turn up in a search for the brand.

import type { Metadata } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
import "./classifieds.css";
import MobileTabBar from "@/app/design/MobileTabBar";

// Both faces are variable fonts, so no `weight` is declared — next/font ships
// the full axis and the CSS picks weights off it. Newsreader carries an italic
// axis too, which the wordmark needs.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Classifieds preview — Manhattanite",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Flex column with the content growing: it puts the tab bar at the bottom
    // of the viewport on a short page, and lets it stick there on a long one.
    <div
      className={`${newsreader.variable} ${instrumentSans.variable} cl-root flex min-h-dvh flex-col`}
    >
      <PreviewStrip />
      <div className="flex-1">{children}</div>
      {/* Screen 12. Hidden above 600px, which is where AppHeader's own nav
          takes over — the two are one arrangement, not two. */}
      <MobileTabBar />
    </div>
  );
}

// A standing, unmissable label. These screens read as finished product — that
// is the point of the exercise — so on a live domain they need something that
// says otherwise on every one of them.
function PreviewStrip() {
  return (
    // .cl-strip fixes the height to --cl-strip-h rather than letting padding
    // decide it, because the landing hero subtracts that same variable to fill
    // exactly one screen. Padding here would silently detune the hero.
    <div
      className="cl-strip px-[clamp(16px,2.4vw,28px)] text-center text-[11.5px]"
      style={{
        background: "var(--cl-ink)",
        color: "var(--cl-surface)",
        letterSpacing: "0.06em",
      }}
    >
      Design preview — the Classifieds system, not the live site
    </div>
  );
}
