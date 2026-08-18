// Screen 11, third panel — the 404, in the Classifieds system.
//
// Reached whenever the detail page's query returns no row: a draft, an archived
// listing, a mistyped id. All three are the same thing to a reader, and the
// design's copy says so without guessing which one happened.
//
// Note this is a real not-found boundary, not a page that draws one. Next
// renders it for notFound() with a 404 status, so a crawler and a reader are
// told the same thing — which matters even on a noindex preview, because the
// alternative is a 200 that says "gone".

import Link from "next/link";
import AppHeader from "@/app/design/AppHeader";

export default function ClassifiedsListingNotFound() {
  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,56px)]">
        <div className="cl-panel mx-auto flex min-h-[280px] max-w-[420px] flex-col justify-center px-[clamp(22px,2.4vw,32px)] py-[clamp(22px,2.4vw,32px)] text-center">
          <div className="cl-display text-[44px] leading-none">404</div>
          <div className="mt-4 text-[18px]">This listing is gone</div>
          <p
            className="mx-auto mt-2.5 mb-5 max-w-[280px] text-[13.5px] leading-[1.55]"
            style={{ color: "var(--cl-muted)" }}
          >
            It was taken down, or the link is wrong.
          </p>
          <Link href="/design/browse" className="cl-ghost self-center">
            Back to browse
          </Link>
        </div>
      </main>
    </>
  );
}
