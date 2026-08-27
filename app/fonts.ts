// The four faces the site sets, in one place.
//
// WHY THIS FILE EXISTS. Until the route-group split (Slice 1 of the Classifieds
// migration) the root layout put Inter + Instrument Serif on <body>, and every
// subtree inherited them from there. The two design systems now load their own
// faces in their own layouts — app/(ed)/layout.tsx and app/(cl)/layout.tsx — so
// an editorial page never downloads Newsreader and a Classifieds page never
// downloads Inter.
//
// Instrument Serif is the exception: it is imported by BOTH layouts, because
// the WORDMARK is set in it and the wordmark appears in both systems. That is
// the locked brand decision (Concept D, 2026-07-21) reaffirmed on 2026-08-18 —
// the mark stays Instrument Serif while the Classifieds body type is
// Newsreader. Declaring it once here and importing it twice gives both subtrees
// the same font instance and the same CSS variable; calling Instrument_Serif()
// separately in each layout would emit the face twice.
//
// Nothing here is applied to <body> any more. Each layout puts the `.variable`
// class names on its own wrapper element, which is where the var() references
// in globals.css (.ed-root) and classifieds.css (.cl-root) resolve.

import { Inter, Instrument_Serif, Newsreader, Instrument_Sans } from "next/font/google";

// ---- Editorial system (app/(ed)) ----

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// ---- Shared: the wordmark, in both systems ----

export const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  // The italic axis is not decoration — the mark's "ite" is always italic.
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// ---- Classifieds system (app/(cl)) ----

// Both Classifieds faces are variable fonts, so no `weight` is declared:
// next/font ships the full axis and the CSS picks weights off it. Newsreader
// carries an italic axis too, which the Classifieds display type uses.
export const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});
