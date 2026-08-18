// /design — the contents page for the Classifieds preview, after the migration.
//
// It was the honest record of the port: which of the twelve screens in
// "Manhattanite Classifieds.dc.html" were built against real data, which were
// not, and why not. It stays that, and gains a second job — saying which ones
// have SHIPPED, and where they went.
//
// A preview that keeps linking to itself after its screens have gone live is a
// second, stale copy of the product. So the migrated rows link at the LIVE
// routes and are labelled as live; only the rows still awaiting Slices 2 and 3
// point back inside /design.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";

type Screen = {
  n: string;
  label: string;
  href: string;
  note: string;
  /** Where it went. Absent while a screen is still preview-only. */
  live?: string;
};

const BUILT: Screen[] = [
  {
    // Not one of the twelve — it comes from "Manhattanite Landing v3.dc.html",
    // a separate file in the same design project.
    n: "L3",
    label: "Landing v3",
    href: "/",
    live: "/",
    note: "The public page: one-screen hero, the six teaser listings, hairline footer. Nobody is named.",
  },
  {
    n: "01",
    label: "Components",
    href: "/design/kit",
    note: "Every primitive on one screen — the real classes, not a drawing of them.",
  },
  {
    n: "02",
    label: "Browse",
    href: "/listings",
    live: "/listings",
    note: "Filter rail, sort, card grid. Real listings, real photographs, real bylines.",
  },
  {
    n: "03",
    label: "Listing detail",
    href: "/listings",
    live: "/listings/[id]",
    note: "Gallery, sticky price card, the contact popup. Open any listing from Browse.",
  },
  {
    n: "04",
    label: "Search and filters",
    href: "/search",
    live: "/search",
    note: "A typed query answered in rows, with the facets in play as removable chips.",
  },
  {
    n: "05",
    label: "Post a listing",
    href: "/design/post",
    note: "Three steps, one real form. Writes a genuine row as pending, into the moderation queue.",
  },
  {
    n: "06",
    label: "Saved",
    href: "/saved",
    live: "/saved",
    note: "What you saved on Browse. Held in this browser, not in the database.",
  },
  {
    n: "08",
    label: "Member profile",
    href: "/listings",
    live: "/members/[id]",
    note: "Assembled from the public bylines only. Open a listing and click the member's name.",
  },
  {
    n: "09",
    label: "Request access and sign in",
    href: "/design/access",
    note: "Both cards wired. The left one knows which of four states you're in.",
  },
  {
    n: "10",
    label: "Account settings",
    href: "/design/settings",
    note: "Only the rows with a column behind them. Two of the design's toggles are deliberately absent.",
  },
  {
    n: "11",
    label: "Loading, members-only, 404",
    href: "/listings/00000000-0000-0000-0000-000000000000",
    live: "/listings/[id]",
    // The two walls are reached by the same URL and which one you get is the
    // point: a guest is never told whether a listing exists, so the access
    // wall answers first and the 404 is behind it. Signing in swaps them.
    note: "The skeleton runs on Browse and Search. This link is the members-only wall signed out, and the 404 signed in.",
  },
  {
    n: "12",
    label: "Mobile",
    href: "/listings",
    live: "/listings",
    note: "Narrow the window under 600px: the header nav folds into a bottom tab bar.",
  },
];

// One screen left unbuilt, and it is not a "todo" — it is blocked on the
// product not having the feature, rather than on time. Building it anyway would
// have meant faking a control, and a faked control in a preview is how a design
// gets approved for something it cannot do.
const NOT_BUILT: { n: string; label: string; why: string }[] = [
  {
    n: "07",
    label: "Messages",
    why: "In-app messaging does not exist and is deliberately out of v1 (mvp-spec.md); contact is a form that sends email, logged for moderation. The design file marks this screen the same way — \u201cnot built yet, kept for reference\u201d. Building it would mean inventing a threads table, a read model and a notification story to illustrate a picture.",
  },
];

export default function ClassifiedsIndexPage() {
  return (
    <>
      <AppHeader active="none" />

      <main
        className="min-h-full w-full px-[clamp(16px,2.4vw,40px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(32px,4vw,64px)]"
        style={{ background: "var(--cl-ground)" }}
      >
        <div className="mx-auto w-full max-w-[900px]">
          <div className="cl-display text-[clamp(26px,3vw,38px)]">
            Manhattan<span className="italic">ite</span> — the marketplace
          </div>
          <p
            className="mt-2.5 max-w-[560px] text-[14px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            The Classifieds design system, built against the real listings
            table. Nothing here is live: it is a proving ground for a visual
            direction, so it can be judged on the network as it actually is
            before anything commits to it.
          </p>

          <div className="cl-eyebrow mt-9 mb-3">Built</div>
          <div className="cl-panel overflow-hidden">
            {BUILT.map((s, i) => (
              <Link
                key={s.n}
                href={s.href}
                className="grid grid-cols-[38px_1fr] gap-4 px-[clamp(18px,2vw,26px)] py-[18px] max-[600px]:gap-3"
                style={
                  i > 0
                    ? { borderTop: "1px solid var(--cl-hairline)" }
                    : undefined
                }
              >
                <span
                  className="text-[13px] tabular-nums"
                  style={{ color: "var(--cl-faint)" }}
                >
                  {s.n}
                </span>
                <span>
                  <span className="text-[15.5px]">{s.label}</span>
                  {s.live && (
                    <span
                      className="cl-chip cl-chip-xs cl-tag-new ml-2 align-middle"
                      title={`Live at ${s.live}`}
                    >
                      Live · {s.live}
                    </span>
                  )}
                  <span
                    className="mt-1 block text-[13px] leading-[1.55]"
                    style={{ color: "var(--cl-muted)" }}
                  >
                    {s.note}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="cl-eyebrow mt-10 mb-3">Not built, and why</div>
          <div className="cl-panel overflow-hidden">
            {NOT_BUILT.map((s, i) => (
              <div
                key={s.n}
                className="grid grid-cols-[38px_1fr] gap-4 px-[clamp(18px,2vw,26px)] py-[18px] max-[600px]:gap-3"
                style={
                  i > 0
                    ? { borderTop: "1px solid var(--cl-hairline)" }
                    : undefined
                }
              >
                <span
                  className="text-[13px] tabular-nums"
                  style={{ color: "var(--cl-faint)" }}
                >
                  {s.n}
                </span>
                <div>
                  <div className="text-[15.5px]">{s.label}</div>
                  <p
                    className="mt-1 text-[13px] leading-[1.55]"
                    style={{ color: "var(--cl-muted)" }}
                  >
                    {s.why}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p
            className="mt-8 max-w-[560px] text-[12.5px] leading-[1.6]"
            style={{ color: "var(--cl-faint)" }}
          >
            The components now live in <code>app/components/cl/</code>,{" "}
            <code>lib/cl/</code> and <code>app/styles/classifieds.css</code>,
            shared with the live site — so the previews still listed here run on
            exactly the code that shipped. The screens marked Live moved into{" "}
            <code>app/(cl)/</code> on 18 August. Reverting is no longer a deleted
            directory; it is a revert of the merge commit.
          </p>
        </div>
      </main>
    </>
  );
}
