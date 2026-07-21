// app/icon.tsx — the browser-tab favicon, generated at build time.
//
// The mark reduced to its smallest form: a roman serif "M." (Instrument Serif,
// the wordmark's face) — the period is kept at EVERY size, bone #F5F0E8 on a
// park #13241B tile with subtly rounded corners.
//
// Two real renders, not one downscaled: generateImageMetadata emits a 32px and a
// 16px variant so each is drawn at its own size. At 16px the period is enlarged
// (rendered as its own span at a larger font size) so the dot stays a legible
// point instead of thinning to nothing; at 32px it's the font's natural period.
//
// Optical centering: flex-centering the "M." bounding box leaves the heavy M
// reading a touch right-of-center with the dot floating into the margin, so the
// pair is nudged left by about the period's width to sit the M on the tile's
// true center. Roman throughout — an italic M smears at 16px, and the brief
// locks the favicon letter to roman.
//
// Replaces the scaffold's default favicon.ico (removed). Uses next/og's
// ImageResponse — a real font must be handed in, since satori has no system
// fonts; we read the committed Instrument Serif TTF from assets/fonts.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "16", size: { width: 16, height: 16 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const key = await id;
  const size = key === "16" ? 16 : 32;
  const isSmall = size <= 16;

  const instrumentSerif = await readFile(
    join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf"),
  );

  // Sized per-variant, not by one ratio: at 16px the whole "M." has to fit in
  // half the pixels, so the M shrinks to leave room for the period + the nudge
  // (otherwise the left serif clips off the tile).
  const mFont = isSmall ? 12.5 : 30;
  // At 16px the dot is enlarged so it stays a legible point; at 32px it's the
  // font's natural period.
  const dotFont = isSmall ? mFont * 1.4 : mFont;
  // Nudge the pair left by roughly the period's advance so the M lands on the
  // tile's optical center and the dot hangs into the margin.
  const nudge = isSmall ? 0.5 : 3;
  // Trim only the excess left sidebearing the enlarged 16px period carries — a
  // light pull, so the dot sits in a clean gap off the M's foot, not on its leg.
  const dotTuck = isSmall ? -mFont * 0.05 : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#13241B",
          borderRadius: size * 0.22,
          color: "#F5F0E8",
          fontFamily: "Instrument Serif",
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            transform: `translateX(-${nudge}px)`,
            // Serif caps sit slightly high on the box; a hair of bottom padding
            // centers the letter vertically in the tile.
            paddingBottom: size * 0.06,
          }}
        >
          <span style={{ fontSize: mFont }}>M</span>
          <span style={{ fontSize: dotFont, marginLeft: dotTuck }}>.</span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [
        {
          name: "Instrument Serif",
          data: instrumentSerif,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
