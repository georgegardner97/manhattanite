// The one face the site sets, in one place.
//
// ONE FONT (George, 2026-09-16). Instrument Sans sets everything. The wordmark
// used to be the reason a second and third face were loaded (Instrument Serif
// for the mark, Newsreader for display), and the retired editorial system
// loaded Inter. The mark is now a handwritten drawing rendered as inline SVG
// (app/components/Wordmark.tsx), so it needs no font, and with it gone there is
// nothing left for a serif to do. The handwriting is the only expressive
// element; the type around it stays quiet.
//
// Nothing here is applied to <body>. app/(cl)/layout.tsx puts the `.variable`
// class name on its own wrapper element, which is where the var() reference in
// classifieds.css (.cl-root) resolves.

import { Instrument_Sans } from "next/font/google";

// A variable font, so no `weight` is declared: next/font ships the full axis
// and the CSS picks weights off it.
export const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});
