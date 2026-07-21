// app/opengraph-image.tsx — the card that renders when a manhattanite.com link
// is shared (iMessage, Slack, X, Facebook, LinkedIn). 1200×630, generated at
// build time by next/og.
//
// The composition is the wordmark on the park ground, exactly as the brand signs
// its name: bone "Manhattanite." (~120px, Instrument Serif, roman with italic
// "ite" and a roman period), and beneath it the tagline in letterspaced serif
// caps, bone at 65%. The whole card is one typeface. Two font cuts are handed to
// satori — Regular for "Manhattan", the period and the tagline, Italic for "ite"
// — read from the committed TTFs in assets/fonts.
//
// The period is the mark's, so it belongs here. The tagline below is running
// copy and stays plain — no period.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Manhattanite — New York's trusted private marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [serifRegular, serifItalic] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/InstrumentSerif-Italic.ttf")),
  ]);

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
          fontFamily: "Instrument Serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 120,
            lineHeight: 1,
            color: "#F5F0E8",
          }}
        >
          <span>Manhattan</span>
          <span style={{ fontStyle: "italic" }}>ite</span>
          <span>.</span>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 25,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(245, 240, 232, 0.65)",
          }}
        >
          New York&apos;s trusted private marketplace
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: serifRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Instrument Serif",
          data: serifItalic,
          style: "italic",
          weight: 400,
        },
      ],
    },
  );
}
