// PageShell — the light "inside" page frame. (Design foundation, Slice 3.)
//
// Slices 1 and 2 established the same three parts on every product screen:
// the editorial grid, a small-caps label in the 220px column (plus the way
// back), and a serif statement title closed by a hairline. Browse, listing
// detail and contact each built that by hand. Slice 3 adds five more screens
// to the set, so it becomes a component — otherwise the label column's exact
// spacing drifts page by page, which is precisely the inconsistency the
// audit called out.
//
// Compose as:
//
//   <PageShell label="Post a listing" title="What have you got?"
//              backHref="/listings" backLabel="Listings">
//     …the content column…
//   </PageShell>
//
// The children ARE the content column — they sit under the title, inside the
// same grid track, so a form or a list lines up with the statement above it
// without the caller knowing the grid exists.
//
// `aside` is for the rare page that needs something extra in the label column
// (a status line, a count). Everything else about the frame is fixed on
// purpose.

import type { ReactNode } from "react";
import ArrowLink from "@/app/components/ArrowLink";
import SiteFooter from "@/app/components/SiteFooter";

export default function PageShell({
  label,
  title,
  backHref,
  backLabel,
  aside,
  children,
}: {
  /** Small-caps label in the left column, e.g. "POST A LISTING". */
  label: string;
  /** The serif statement line. */
  title: ReactNode;
  /** Optional back link, rendered under the label as "← {backLabel}". */
  backHref?: string;
  backLabel?: string;
  /** Optional extra content under the back link, in the label column. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <main className="mh-gutter pt-14 max-[860px]:pt-9">
        <div className="mh-section-grid">
          <aside>
            <p className="mh-label text-ink">{label}</p>
            {backHref && (
              <ArrowLink
                href={backHref}
                direction="back"
                className="mt-3.5 max-[860px]:mt-2"
              >
                {backLabel ?? "Back"}
              </ArrowLink>
            )}
            {aside}
          </aside>

          {/* min-w-0: a grid track defaults to min-width:auto, so any wide
              child (an image row, a nowrap price) would otherwise refuse to
              shrink and push the whole page wider than the viewport. */}
          <div className="min-w-0">
            <h1 className="font-serif font-normal text-[46px] max-[860px]:text-[32px] leading-[1.08] text-ink border-b border-ink/16 pb-7">
              {title}
            </h1>
            {children}
          </div>
        </div>
      </main>

      <SiteFooter surface="light" />
    </>
  );
}
