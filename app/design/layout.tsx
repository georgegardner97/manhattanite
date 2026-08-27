// /design — what is LEFT of the Classifieds preview.
//
// The preview did its job. On 2026-08-18 the screens it proved were promoted to
// the live site under the (cl) route group — landing, browse, listing detail,
// member profile, search, saved. This directory keeps only the screens Slices 2
// and 3 have not migrated yet:
//
//   kit       the component sheet (a reference surface, not a product screen)
//   post      → becomes /listings/new in Slice 2
//   settings  → becomes /profile in Slice 2
//   access    → splits into /login and /apply in Slice 3
//
// They still need somewhere to run, and they still need to be unmistakably NOT
// the live site — hence the strip and the noindex below, both of which the (cl)
// layout deliberately drops.
//
// The components and the stylesheet no longer live here: they are shared with
// the live system at app/components/cl/, lib/cl/ and app/styles/classifieds.css.
// That is the point — these previews now run on exactly the code that shipped,
// so they cannot drift into showing something the live site does not do.

import type { Metadata } from "next";
import "@/app/styles/classifieds.css";
import { newsreader, instrumentSans, instrumentSerif } from "@/app/fonts";
import MobileTabBar from "@/app/components/cl/MobileTabBar";

export const metadata: Metadata = {
  title: "Classifieds preview — Manhattanite",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `cl-preview` restores --cl-strip-h to the strip's real height. It is 0 by
    // default now, because the live hero fills a plain 100dvh with no strip
    // above it. Without this class the strip would overhang the viewport here.
    <div
      className={`${newsreader.variable} ${instrumentSans.variable} ${instrumentSerif.variable} cl-root cl-preview flex min-h-dvh flex-col`}
    >
      <PreviewStrip />
      <div className="flex-1">{children}</div>
      <MobileTabBar />
    </div>
  );
}

// A standing, unmissable label. These screens read as finished product — that
// is the point of the exercise — so on a live domain they need something that
// says otherwise on every one of them.
function PreviewStrip() {
  return (
    // .cl-strip fixes the height to --cl-strip-h rather than letting padding
    // decide it, because the landing hero subtracts that same variable.
    <div
      className="cl-strip px-[clamp(16px,2.4vw,28px)] text-center text-[11.5px]"
      style={{
        background: "var(--cl-ink)",
        color: "var(--cl-surface)",
        letterSpacing: "0.06em",
      }}
    >
      Design preview — screens not yet migrated to the live site
    </div>
  );
}
