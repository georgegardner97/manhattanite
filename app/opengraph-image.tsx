// app/opengraph-image.tsx: the card that renders when a manhattanite.com link
// is shared (iMessage, Slack, X, Facebook, LinkedIn). 1200×630, generated at
// build time by next/og.
//
// THE HANDWRITTEN MARK ON ITS OWN GROUND (George, 2026-09-16). Dark green
// #13241B is the mark's ground, and this card, the favicon tile and the apple
// touch icon are the only three places it is used; the site UI never paints
// it. The cream wordmark sits centered, drawn from the same paths as
// app/components/Wordmark.tsx so the two can never disagree, full stop
// included. Beneath it, one quiet line: "A private marketplace for New York."
// in Instrument Sans, small uppercase, wide tracking, cream at 60%. The wording
// is the landing page's line, word for word, and should move with it.
//
// Satori (next/og) cannot read woff2, so the one face it needs is the static
// Instrument Sans Regular TTF committed in assets/fonts. No serif is loaded:
// the mark is paths, not type.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LETTERS, PERIOD, VIEWBOX } from "@/app/components/Wordmark";

export const alt = "Manhattanite · A private marketplace for New York";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#FAF6F0";
// The viewBox is 660.9 by 98.6; the card sets the mark 720 wide.
const MARK_WIDTH = 720;
const MARK_HEIGHT = Math.round((MARK_WIDTH * 98.6) / 660.9);

export default async function OpengraphImage() {
  const sans = await readFile(
    join(process.cwd(), "assets/fonts/InstrumentSans-Regular.ttf"),
  );

  const stroke = {
    stroke: CREAM,
    strokeWidth: 1.2,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#13241B",
          fontFamily: "Instrument Sans",
        }}
      >
        <svg
          width={MARK_WIDTH}
          height={MARK_HEIGHT}
          viewBox={VIEWBOX}
          fill={CREAM}
        >
          <path d={LETTERS} {...stroke} />
          <path d={PERIOD} {...stroke} />
        </svg>
        <div
          style={{
            marginTop: 44,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(250, 246, 240, 0.6)",
          }}
        >
          A private marketplace for New York.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Sans", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
