// app/icon.tsx — the browser-tab favicon, generated at build time.
//
// The mark reduced to a single letter: a roman serif "M" (Instrument Serif, the
// wordmark's face), bone #F5F0E8 on a park #13241B tile with subtly rounded
// corners. No period at this size — the dot muddies below ~20px. Rendered at
// 32×32 (the standard favicon size); browsers downscale to 16px for the tab.
//
// Roman, not italic: at 16px the italic M's angled strokes smear, and George's
// brief locks the favicon letter to roman. The wordmark's italic lives in "ite",
// which never appears here.
//
// Replaces the scaffold's default favicon.ico (removed). Uses next/og's
// ImageResponse — a real font must be handed in, since satori has no system
// fonts; we read the committed Instrument Serif TTF from assets/fonts.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const instrumentSerif = await readFile(
    join(process.cwd(), "assets/fonts/InstrumentSerif-Regular.ttf"),
  );

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
          borderRadius: 7,
          // Optical nudge: the serif M sits slightly high on its baseline, so a
          // hair of bottom padding centers the letter in the tile.
          paddingBottom: 2,
          color: "#F5F0E8",
          fontFamily: "Instrument Serif",
          fontSize: 30,
          lineHeight: 1,
        }}
      >
        M
      </div>
    ),
    {
      ...size,
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
