// app/icon.tsx — the browser-tab favicon, generated at build time.
//
// The mark: a serif "M" (Instrument Serif roman, the wordmark's face), bone
// #F5F0E8 on a park #13241B tile with subtly rounded corners — followed by a
// period sitting on the M's BASELINE, like a normal period after the letter,
// just slightly larger than a natural one. Reads as "M." The M stays close to
// center, shifted just a few percent left to make room for the period.
//
// The dot is DRAWN (a border-radius circle), not the font's period glyph: it
// wants to be a deliberate round mark at a fixed size, and drawing it keeps it a
// clean circle at every size — including 16px, where a scaled-up serif period
// would read as noise.
//
// Three real renders via generateImageMetadata (64 / 32 / 16), not one
// downscaled; at 16px the dot is nudged toward 22% so it still reads as a
// circle on the pixel grid. Roman, not italic — an italic M smears at 16px.
// Replaces the scaffold's default favicon.ico (removed). Uses next/og's
// ImageResponse; satori has no system fonts, so the committed Instrument Serif
// TTF is read from assets/fonts.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function generateImageMetadata() {
  return [
    { id: "64", size: { width: 64, height: 64 }, contentType: "image/png" },
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "16", size: { width: 16, height: 16 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const key = await id;
  const size = key === "16" ? 16 : key === "64" ? 64 : 32;
  const isSmall = size <= 16;

  const instrumentSerif = await readFile(
    join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf"),
  );

  const mFont = size * 0.74;
  // Push the cap down a hair: flex centers the line box, which leaves the cap
  // sitting slightly high, so a small nudge lands the M's ink on true center.
  const mNudgeDown = size * 0.05;
  // Shift the M a few percent left to make room for the dot — still close to
  // center, nothing like the old pair-centered offset.
  const mShiftLeft = size * 0.04;
  // A normal-period-sized dot, ~9% of the tile (13% at 16px so it survives) —
  // slightly larger than a natural period. Sits to the right of the M, resting
  // on the M's baseline.
  const dot = size * (isSmall ? 0.13 : 0.09);
  const dotRight = size * 0.15;
  // Rest the dot on the M's baseline (its bottom ≈ the M's foot line).
  const dotBottom = size * 0.2;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
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
        <span
          style={{
            fontSize: mFont,
            transform: `translate(${-mShiftLeft}px, ${mNudgeDown}px)`,
          }}
        >
          M
        </span>
        <div
          style={{
            position: "absolute",
            right: dotRight,
            bottom: dotBottom,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            background: "#F5F0E8",
          }}
        />
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
