// Screen 01 — Components, in the Classifieds system.
//
// The kit page from the design file: every primitive the system defines, on one
// screen, so the parts can be judged next to each other rather than hunted for
// across finished pages. Buttons, inputs, chips and tags, the member row, the
// listing card, feedback, pagination, the contact popover.
//
// These are the REAL classes from classifieds.css and, where one exists, the
// real component — the listing card below is the same ClListingCard the browse
// grid renders, given sample data. A kit drawn with its own private copies of
// the styles proves only that a picture can be drawn.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";
import ClListingCard from "@/app/components/cl/ClListingCard";

export default function ClassifiedsKitPage() {
  return (
    <>
      <AppHeader active="none" />

      {/* The one place --cl-ground is used. The kit is an artboard — a canvas
          with a panel of specimens on it — which is exactly the relationship
          the design file's own body color describes. Product screens sit on
          --cl-surface instead; see the note at the top of classifieds.css. */}
      <main
        className="min-h-dvh w-full px-[clamp(16px,2.4vw,40px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(32px,4vw,64px)]"
        style={{ background: "var(--cl-ground)" }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
        <div className="cl-display text-[clamp(26px,3vw,38px)]">
          Manhattan<span className="italic">ite</span>.
        </div>
        <p
          className="mt-2.5 max-w-[560px] text-[14px]"
          style={{ color: "var(--cl-muted)" }}
        >
          The Classifieds component set. Newsreader for the mark and display
          numerals, Instrument Sans for everything else. Filled pill for the one
          real action, outlined pill for the alternative, naked text for
          anything that only navigates.
        </p>

        <div className="cl-eyebrow mt-8 mb-3">01 · Components</div>

        <div className="cl-panel grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(28px,3vw,48px)] p-[clamp(24px,3vw,44px)]">
          <Group label="Buttons">
            <div className="flex flex-col items-start gap-3">
              <Link href="/listings" className="cl-pill">
                Primary action
              </Link>
              <Link href="/listings" className="cl-ghost">
                Secondary action
              </Link>
              <Link href="/listings" className="cl-quiet">
                Quiet link →
              </Link>
              {/* A real disabled control, not a styled span — the cursor and
                  the screen-reader announcement are half of what "disabled"
                  means. */}
              <button type="button" className="cl-pill-disabled" disabled>
                Disabled
              </button>
            </div>
          </Group>

          <Group label="Inputs">
            <div className="flex flex-col gap-3">
              <input className="cl-input" placeholder="Search the network" />
              <input className="cl-input" defaultValue="Perry Street" />
              <select className="cl-input" defaultValue="">
                <option value="" disabled>
                  Category
                </option>
                <option>Apartments</option>
                <option>Furniture</option>
                <option>Services</option>
              </select>
              <input
                className="cl-input cl-input-error"
                defaultValue="$ —"
                aria-invalid
                aria-describedby="cl-kit-price-error"
              />
              <div id="cl-kit-price-error" className="cl-fielderror">
                Add a price, even if it&rsquo;s zero.
              </div>
            </div>
          </Group>

          <Group label="Tags & chips">
            <div className="flex flex-wrap gap-2">
              <span className="cl-chip cl-chip-on">Apartments</span>
              <span className="cl-chip">Sublets</span>
              <span className="cl-chip">Furniture</span>
              <span className="cl-chip cl-tag-vouched">Vouched</span>
              <span className="cl-chip cl-tag-new">New today</span>
              <span className="cl-chip" style={{ color: "var(--cl-muted)" }}>
                West Village ×
              </span>
            </div>

            <div className="cl-grouplabel mt-[26px] mb-3.5">Member</div>
            <div className="flex items-center gap-3">
              <div
                className="size-10 shrink-0 rounded-full"
                style={{ background: "var(--cl-fill-avatar)" }}
              />
              <div>
                <div className="text-[14.5px] font-medium">Claire M.</div>
                <div
                  className="text-[12.5px]"
                  style={{ color: "var(--cl-muted)" }}
                >
                  Member since 2023 · sponsored by 4
                </div>
              </div>
            </div>
          </Group>

          <Group label="Listing card">
            <div className="max-w-[260px]">
              {/* The real component. Its save pill writes to the same
                  localStorage store the browse grid reads, so toggling it here
                  and going to Browse shows the state carried across. */}
              <ClListingCard
                card={{
                  id: "kit-sample",
                  title: "Pre-war two bedroom, Perry Street",
                  place: "West Village",
                  price: "$6,800/mo",
                  meta: "Listed by Claire M. · sponsored by Daniel R. · 4 days ago",
                  coverUrl: null,
                  isExample: true,
                }}
              />
              <p
                className="mt-3 text-[12px] leading-[1.5]"
                style={{ color: "var(--cl-faint)" }}
              >
                Shown with no photograph, which is the state the frame has to
                survive. The Example tag is carried over from the live system
                and is not optional.
              </p>
            </div>
          </Group>

          <Group label="Feedback">
            <div className="flex flex-col gap-3">
              <div className="cl-toast flex justify-between gap-4">
                Saved to your list
                <span style={{ color: "#8E8880" }}>Undo</span>
              </div>
              <div className="cl-note">
                Submitted. Live once a person has read it.
              </div>
              <div className="cl-alert">
                This listing was taken down by its member.
              </div>
              <div className="cl-inset">
                Sponsored by <strong className="font-medium">Ada P.</strong>
              </div>
            </div>

            <div className="cl-grouplabel mt-[26px] mb-3.5">Loading</div>
            <div>
              <div className="cl-sk h-[90px]" />
              <div className="cl-sk mt-3.5 h-[11px] w-1/2" />
              <div className="cl-sk mt-2 h-[14px] w-[88%]" />
            </div>

            <div className="cl-grouplabel mt-[26px] mb-3.5">Pagination</div>
            <div className="flex items-center gap-1.5">
              <span className="cl-page cl-page-off">←</span>
              <span className="cl-page cl-page-on">1</span>
              <span className="cl-page">2</span>
              <span className="cl-page">3</span>
              <span style={{ color: "var(--cl-faint)", padding: "0 4px" }}>
                …
              </span>
              <span className="cl-page">→</span>
            </div>
          </Group>

          <Group label="Contact popup">
            <div
              className="max-w-[300px] rounded-[12px] border p-[22px]"
              style={{
                borderColor: "var(--cl-border-control)",
                background: "var(--cl-white)",
                boxShadow: "0 14px 30px rgba(20,18,16,.1)",
              }}
            >
              <div className="text-[16.5px] leading-[1.3]">
                Contact Omar about the piano
              </div>
              <div
                className="mt-2.5 text-[13px]"
                style={{ color: "var(--cl-muted)" }}
              >
                Email him directly.
              </div>
              <div className="cl-input mt-3.5">omar.t@example.com</div>
              <div className="mt-3.5 flex gap-2.5">
                <span className="cl-pill cl-pill-sm">Open email</span>
                <span className="cl-ghost cl-pill-sm">Copy</span>
              </div>
              <p
                className="mt-3.5 text-[12px] leading-[1.5]"
                style={{ color: "var(--cl-faint)" }}
              >
                He sees your name and who sponsored you when you write.
              </p>
            </div>
          </Group>
          </div>
        </div>
      </main>
    </>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="cl-grouplabel mb-4">{label}</div>
      {children}
    </div>
  );
}
