// The root layout — the frame, and nothing else.
//
// It owns <html>, <body>, the document metadata, the viewport, and the global
// stylesheet. It deliberately owns NO fonts and NO navigation: since the
// route-group split those belong to the two system layouts beside it —
//
//   app/(cl)/layout.tsx   the Classifieds system (Newsreader + Instrument Sans)
//   app/(ed)/layout.tsx   the editorial system (Inter), SiteNav + NavGate
//
// Both are nested layouts under this one, not root layouts of their own. That
// matters: multiple ROOT layouts would force a full page reload on every
// crossing between the two systems (Next 16, route-groups.md, "Caveats"), and
// a visitor moving from the Classifieds browse to the editorial /profile would
// see the browser reload. One root, two nested layouts, client navigation
// intact.
//
// globals.css stays here and does not move: it carries Tailwind's base layer,
// which has to be global.

import type { Metadata, Viewport } from "next";
import "./globals.css";

// metadataBase lets Next resolve the file-convention OG image (app/
// opengraph-image.tsx) and any relative URL below to an absolute one, which is
// what social scrapers require. Same title/description as before, now also
// carried into the Open Graph + Twitter cards so a shared link shows the mark.
const TITLE = "Manhattanite — A better marketplace for Manhattan residents";
const DESCRIPTION =
  "A members-only marketplace for the people who define New York. Verified residents only. No spam, no strangers, no noise.";

// viewport-fit=cover lets the page run under the iPhone notch and home
// indicator instead of Safari letterboxing it with background-colored bars in
// landscape. The safe-area env() insets in globals.css (.mh-gutter) and the
// hero/footer padding only report non-zero values once this is set — the two
// halves of one fix. width + initialScale restate Next's defaults, which an
// explicit viewport export would otherwise drop.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://manhattanite.com"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Manhattanite",
    type: "website",
    // og:image is injected automatically from app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    // twitter:image is injected automatically from app/opengraph-image.tsx.
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
