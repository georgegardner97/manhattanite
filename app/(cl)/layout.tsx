// The Classifieds system — the public face of the site.
//
// Built at /design over 17-18 Aug against the real listings table, and promoted
// here on 2026-08-18. The route group changes the layout tree without changing
// a single URL: the landing is "/", browse is "/listings", a listing is
// "/listings/[id]" — exactly the addresses they had under the editorial system.
//
// Three things this layout owns:
//
//   1. THE FONTS. Newsreader for display, Instrument Sans for everything else.
//      Plus Instrument Serif, which is here for one reason only: the WORDMARK
//      is set in it and the wordmark appears in this system too. That is the
//      locked brand decision (Concept D, 2026-07-21) reaffirmed 2026-08-18
//      after seeing the two serifs together on a real screen — the mark stays
//      Instrument Serif, the body type is Newsreader. It is the one place the
//      two systems touch, and it is deliberate.
//
//   2. THE SCOPE. `.cl-root` is where every token in classifieds.css resolves.
//      One wrapper, one scope; no token leaks into the editorial system, and
//      an editorial page never mounts this class.
//
//   3. THE MOBILE NAV. MobileTabBar, which takes over below 600px where
//      AppHeader's own nav hides. The two are one arrangement, not two.
//
// WHAT IS DELIBERATELY NOT HERE:
//
//   - The preview strip. These screens are the live site now.
//   - `robots: { index: false }`. This group contains "/" — the page Google
//     indexes. Root metadata (title, description, OG, Twitter, metadataBase)
//     still applies from app/layout.tsx.
//   - AppHeader. It cannot live in the layout: the landing does not have one,
//     and every other screen passes its own `active` prop to mark the current
//     nav item. Each page renders it.

import "@/app/styles/classifieds.css";
import { newsreader, instrumentSans, instrumentSerif } from "@/app/fonts";
import MobileTabBar from "@/app/components/cl/MobileTabBar";

export default function ClassifiedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Flex column with the content growing: it puts the tab bar at the bottom
    // of the viewport on a short page, and lets it stick there on a long one.
    <div
      className={`${newsreader.variable} ${instrumentSans.variable} ${instrumentSerif.variable} cl-root flex min-h-dvh flex-col`}
    >
      <div className="flex-1">{children}</div>
      <MobileTabBar />
    </div>
  );
}
