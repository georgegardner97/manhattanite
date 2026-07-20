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
export const metadata: Metadata = {
  title: "Manhattanite — A better marketplace for Manhattan residents",
  description:
    "A members-only marketplace for the people who define New York. Verified residents only. No spam, no strangers, no noise.",
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