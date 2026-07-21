// app/icon.tsx — the browser-tab favicon, generated at build time.
//
// The mark is the serif "M" (Instrument Serif roman, the wordmark's face), bone
// #F5F0E8 on a park #13241B tile with subtly rounded corners. The M sits DEAD
// CENTER of the tile — it is the mark. The period is kept but demoted to a small
// satellite in the lower-right corner (roughly the M's baseline, inset ~10% from
// the right edge), so the letter reads centered and the dot is a signature, not
// part of the centering.
//
// Three real renders via generateImageMetadata (64 / 32 / 16), not one
// downscaled: at 16px the satellite period is drawn a touch larger so it
// survives the pixel grid instead of vanishing.
//
// Roman, not italic — an italic M smears at 16px, and the brief locks the
// favicon letter to roman. Replaces the scaffold's default favicon.ico (removed).
// Uses next/og's ImageResponse; satori has no system fonts, so the committed
// Instrument Serif TTF is read from assets/fonts.

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
  // Satellite period — natural-ish at 32/64, enlarged at 16 to survive.
  const dotFont = size * (isSmall ? 0.5 : 0.3);
  const rightInset = size * 0.1;
  const bottomInset = size * (isSmall ? 0.06 : 0.1);

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
            transform: `translateY(${mNudgeDown}px)`,
          }}
        >
          M
        </span>
        <span
          style={{
            position: "absolute",
            right: rightInset,
            bottom: bottomInset,
            fontSize: dotFont,
            lineHeight: 1,
          }}
        >
          .
        </span>
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
