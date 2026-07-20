// /listings — read-only browse. (Design foundation, Slice 1: "light inside".)
//
// Server Component. Tiered by viewer (D1 decision, 2026-06-09 — the trust gate
// is at the ACTION layer, not viewing):
//   - guest (logged out): a TEASER — the 6 most recent published listings, then
//     a "create an account" prompt where the rest would be. Anon read is allowed
//     at the data layer by migration 0010; the 6-cap is enforced here in the
//     query (intentional for MVP — viewing is a funnel, not the moat).
//   - account / member: full browse (limit 50), unchanged.
//
// Category filter (All / Apartments / Furniture / Other / Services) is
// server-driven via the ?type= search param. Search and sort are still later
// slices.
//
// Layout (founder review, 2026-07-20 — In Common With's All Products page):
// the 220px label column the section grammar already reserves becomes a STICKY
// CATEGORY RAIL, so the categories stay on screen while the grid scrolls. The
// horizontal filter row is gone on desktop and returns below 860px, where a
// tall vertical rail would push the listings off the first screen.
//
// The page is TWO section grids, not one, and that is load-bearing: the head
// grid carries the LISTINGS label beside the title, and the feed grid carries
// the category rail beside the cards. Because the rail and the card grid are
// columns of the same grid row, "All" lines up with the first card's kicker
// intrinsically — there is no offset constant to drift when the head changes.
//
// The rail sticks because the <aside> stretches to the full height of the grid
// row (grid items stretch by default) and the sticky element is its CHILD.
// Sticky on the aside itself would do nothing — it is already as tall as the
// scrolling content.
//
// Presentation only: the links, the ?type= behavior, the gating, and the
// EXAMPLE tags are all unchanged.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import { toCardData, type ListingRow } from "@/lib/listings/card";
import ListingCard from "@/app/components/ListingCard";
import BoxButton from "@/app/components/BoxButton";
import SiteFooter from "@/app/components/SiteFooter";

export const dynamic = "force-dynamic"; // session state varies per request.

// The row shape this page selects: the shared card columns plus the byline's
// two denormalized fields, which only the product surface renders.
type BrowseRow = ListingRow & {
  author_name: string | null;
  sponsor_names: string[];
};

// The category filter — every live listing type (the type enum: apartment,
// furniture, other, service). Server-driven via the ?type= param; an absent or
// unknown value means "All".
const FILTERS = [
  { label: "All", value: null },
  { label: "Apartments", value: "apartment" },
  { label: "Furniture", value: "furniture" },
  { label: "Other", value: "other" },
  { label: "Services", value: "service" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const VALID_TYPES = new Set(["apartment", "furniture", "other", "service"]);

function normalizeType(raw: string | undefined): FilterValue {
  return raw && VALID_TYPES.has(raw) ? (raw as FilterValue) : null;
}

function hrefFor(value: FilterValue): string {
  return value ? `/listings?type=${value}` : "/listings";
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Next 16: searchParams is async. Validate to a known enum value or null.
  const { type: rawType } = await searchParams;
  const activeType = normalizeType(rawType);

  const isGuest = !user;
  const TEASER_LIMIT = 6;

  // Published rows are readable by signed-in users (listings_read_published_for_accounts)
  // and, after migration 0010, by anon too. Guests are capped at the teaser set
  // in the query below; accounts/members get the full feed. The category filter
  // narrows by type when one is selected.
  let query = supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_name, sponsor_names"
    )
    .eq("status", "published");

  if (activeType) {
    query = query.eq("type", activeType);
  }

  const { data: listings } = await query
    .order("created_at", { ascending: false })
    .limit(isGuest ? TEASER_LIMIT : 50)
    .returns<BrowseRow[]>();

  // Sign all cover-image paths in one round-trip, then look up per card.
  const coverPaths =
    listings
      ?.map((l) => l.images?.[0]?.path)
      .filter((p): p is string => Boolean(p)) ?? [];
  const coverUrlByPath = await signImagePaths(coverPaths);

  const hasListings = Boolean(listings && listings.length > 0);

  return (
    <>
      <main className="mh-gutter pt-16 max-[860px]:pt-10">
        {/* ================= PAGE HEAD =================
            Its own section grid: the LISTINGS label sits in the label column,
            level with the title. The categories deliberately do NOT live here
            — see the feed grid below. */}
        <div className="mh-section-grid">
          <p className="mh-label text-ink max-[860px]:hidden">Listings</p>

          {/* min-w-0: a grid track defaults to min-width:auto, so the nowrap
              filter row below would refuse to shrink and push the whole
              column — and the page — wider than the viewport. */}
          <div className="min-w-0">
            <h1 className="font-serif font-normal text-[52px] max-[860px]:text-[38px] leading-[1.05] text-ink">
              {/* Typographic apostrophe, not the straight one: at 52px in
                  Instrument Serif the difference is the whole difference
                  between set type and a text field. */}
              Today&rsquo;s listings.
            </h1>

            {/* Below 860px the rail is hidden and this takes over. */}
            <FilterRow activeType={activeType} />
          </div>
        </div>

        {/* ================= THE FEED =================
            The hairline spans both columns, and the category rail is the label
            column of THIS grid — the same grid row as the listing cards. That
            is what makes "All" line up with the first card's kicker: both
            columns start at the same y, below the rule's padding. No magic
            offset to drift out of date when the head changes. */}
        <div className="mh-rule mt-14 max-[860px]:mt-9">
          <div className="mh-section-grid">
            <aside className="max-[860px]:hidden">
              {/* Sticky on the CHILD — see the note at the top of this file. */}
              <div className="sticky top-24">
                <CategoryRail activeType={activeType} />
              </div>
            </aside>

            <div className="min-w-0">
              {!hasListings ? (
                <EmptyState filtered={activeType !== null} />
              ) : (
                <div className="mh-card-grid">
                  {listings!.map((row) => {
                    const coverPath = row.images?.[0]?.path;
                    const coverUrl = coverPath
                      ? coverUrlByPath.get(coverPath) ?? null
                      : null;
                    return (
                      <ListingCard
                        key={row.id}
                        listing={toCardData(
                          row,
                          coverUrl,
                          renderByline(row.author_name, row.sponsor_names)
                        )}
                        surface="light"
                      />
                    );
                  })}
                </div>
              )}

              {/* Teaser wall — guests see the create-account prompt where the
                  rest of the network would be. The action layer stays the real
                  gate; this is the funnel. */}
              {isGuest && hasListings && (
                <div className="mt-[72px] mh-rule pt-9">
                  <p className="font-serif text-[26px] leading-[1.2] text-ink max-w-[26ch]">
                    This is a glimpse. Create an account to see every listing in
                    the network.
                  </p>
                  <div className="mt-7">
                    <BoxButton href="/signup" surface="light">
                      Create an account
                    </BoxButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter surface="light" />
    </>
  );
}

// The desktop rail: a vertical category list in the label column of the feed
// grid. Active item is ink with a leading park-green dot; the dot is always in
// the layout (just transparent when inactive) so the labels never shift
// sideways.
//
// The negative top margin cancels the first link's own py-[7px], so "All"
// starts flush with the top of the column — which is the top of the first
// card's kicker row, since both columns of the feed grid begin at the same y.
// The padding stays on the links themselves so the spacing BETWEEN items is
// even and the whole row stays clickable.
function CategoryRail({ activeType }: { activeType: FilterValue }) {
  return (
    <nav aria-label="Categories" className="-mt-[7px] flex flex-col items-start">
      {FILTERS.map((f) => {
        const isActive = f.value === activeType;
        return (
          <Link
            key={f.label}
            href={hrefFor(f.value)}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2.5 py-[7px] text-[14px] leading-[1.5] transition-colors ${
              isActive ? "text-ink" : "text-slate hover:text-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-1 h-1 shrink-0 rounded-full bg-park transition-opacity ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            {f.label}
          </Link>
        );
      })}
    </nav>
  );
}

// The mobile fallback: the horizontal small-caps row, scrollable rather than
// wrapping to two lines. Hidden at 861px and up, where the rail takes over.
function FilterRow({ activeType }: { activeType: FilterValue }) {
  return (
    <div className="hidden max-[860px]:flex min-w-0 gap-x-[26px] mt-[26px] overflow-x-auto whitespace-nowrap mh-no-scrollbar">
      {FILTERS.map((f) => {
        const isActive = f.value === activeType;
        return (
          <Link
            key={f.label}
            href={hrefFor(f.value)}
            aria-current={isActive ? "page" : undefined}
            className={`mh-label shrink-0 pb-[5px] border-b transition-colors ${
              isActive
                ? "text-ink border-park"
                : "text-slate border-transparent hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({ filtered = false }: { filtered?: boolean }) {
  if (filtered) {
    return (
      <div className="max-w-[44ch] py-4">
        <p className="font-serif text-[26px] leading-[1.2] text-ink">
          Nothing in this category yet.
        </p>
        <p className="mt-5 text-slate leading-relaxed">
          Try another category, or bring in someone who has the perfect piece —
          they can post it directly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[44ch] py-4">
      <p className="font-serif text-[26px] leading-[1.2] text-ink">
        Nothing here yet. The network is small on purpose.
      </p>
      <p className="mt-5 text-slate leading-relaxed">
        If you know someone with the perfect apartment, piece, or job opening
        coming up, bring them in. They can post it directly.
      </p>
    </div>
  );
}
