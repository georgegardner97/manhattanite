import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import SiteNav from "@/app/components/SiteNav";
import NavGate from "@/app/components/NavGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});
// metadataBase lets Next resolve the file-convention OG image (app/
// opengraph-image.tsx) and any relative URL below to an absolute one, which is
// what social scrapers require. Same title/description as before, now also
// carried into the Open Graph + Twitter cards so a shared link shows the mark.
const TITLE = "Manhattanite — A better marketplace for Manhattan residents";
const DESCRIPTION =
  "A members-only marketplace for the people who define New York. Verified residents only. No spam, no strangers, no noise.";

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
      <body className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
        {/* NavGate hides the nav on "/" (the landing brings its own) and must
            do it on the client — this layout does not re-render on navigation. */}
        <NavGate>
          <SiteNav />
        </NavGate>
        {children}
      </body>
    </html>
  );
}