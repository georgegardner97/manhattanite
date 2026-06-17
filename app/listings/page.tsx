// /listings — read-only browse, now with a logged-out teaser.
//
// Server Component. Tiered by viewer (D1 decision, 2026-06-09 — the trust gate
// is at the ACTION layer, not viewing):
//   - guest (logged out): a TEASER — the 6 most recent published listings, then
//     a "create an account" prompt where the rest would be. Anon read is allowed
//     at the data layer by migration 0010; the 6-cap is enforced here in the
//     query (intentional for MVP — viewing is a funnel, not the moat).
//   - account / member: full browse (limit 50), unchanged.
//
// Category filter (All / Apartments / Furniture) is server-driven via the
// ?type= search param. Search and sort are still later slices. Posting,
// contact, and sponsor display are other slices.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingImage = { path: string };

type ListingCard = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number;
  images: ListingImage[];
  author_name: string | null;
  sponsor_names: string[];
  is_example: boolean;
};

function formatPrice(cents: number, type: ListingCard["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

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
      "id, type, title, description, price_cents, images, author_name, sponsor_names, is_example"
    )
    .eq("status", "published");

  if (activeType) {
    query = query.eq("type", activeType);
  }

  const { data: listings } = await query
    .order("created_at", { ascending: false })
    .limit(isGuest ? TEASER_LIMIT : 50)
    .returns<ListingCard[]>();

  // Sign all cover-image paths in one round-trip, then look up per card.
  const coverPaths =
    listings
      ?.map((l) => l.images?.[0]?.path)
      .filter((p): p is string => Boolean(p)) ?? [];
  const coverUrlByPath = await signImagePaths(coverPaths);

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            Listings
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        <FilterBar activeType={activeType} />

        {!listings || listings.length === 0 ? (
          <EmptyState filtered={activeType !== null} />
        ) : (
          <ul className="space-y-px">
            {listings.map((listing) => {
              const coverPath = listing.images?.[0]?.path;
              const coverUrl = coverPath
                ? coverUrlByPath.get(coverPath) ?? null
                : null;
              return (
                <li key={listing.id}>
                  <ListingCardItem listing={listing} coverUrl={coverUrl} />
                </li>
              );
            })}
          </ul>
        )}

        {/* Teaser wall — guests see the create-account prompt where the rest of
            the network would be. The action layer stays the real gate. */}
        {isGuest && listings && listings.length > 0 && (
          <div className="mt-16 border-t border-ink/10 pt-12 text-center">
            <p className="font-serif text-xl leading-relaxed text-ink">
              This is a glimpse. Create a free account to see every listing in
              the network.
            </p>
            <Link
              href="/signup"
              className="mh-link inline-block mt-8 text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Create an account to see every listing &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// Editorial segmented filter — small-caps links, active tab in ink. Selecting
// a category reloads the page with the ?type= param (server-rendered, shareable).
function FilterBar({ activeType }: { activeType: FilterValue }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8 mb-16">
      {FILTERS.map((f) => {
        const isActive = f.value === activeType;
        const href = f.value ? `/listings?type=${f.value}` : "/listings";
        return (
          <Link
            key={f.label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`mh-link text-[11px] tracking-[0.22em] uppercase ${
              isActive ? "text-ink" : "text-slate hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}

function ListingCardItem({
  listing,
  coverUrl,
}: {
  listing: ListingCard;
  coverUrl: string | null;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block border-t border-ink/10 py-10 last:border-b"
    >
      {coverUrl && (
        <div className="mb-6 aspect-[4/3] overflow-hidden bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      {listing.is_example && <ExampleBadge />}
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-serif font-light text-2xl md:text-3xl tracking-tight text-ink">
          {listing.title}
        </h2>
        <p className="font-serif text-xl text-ink whitespace-nowrap">
          {formatPrice(listing.price_cents, listing.type)}
        </p>
      </div>
      <p className="mt-3 text-slate leading-relaxed">{listing.description}</p>
      <p className="mt-5 text-[11px] tracking-[0.22em] uppercase text-slate">
        {renderByline(listing.author_name, listing.sponsor_names)}
      </p>
    </Link>
  );
}

// Small, honest label on seed content — these listings show what the network
// looks like, but nobody should mistake them for a live deal.
function ExampleBadge() {
  return (
    <p className="mb-3">
      <span className="inline-block border border-ink/20 px-2 py-[3px] text-[10px] tracking-[0.22em] uppercase text-slate">
        Example
      </span>
    </p>
  );
}

function EmptyState({ filtered = false }: { filtered?: boolean }) {
  if (filtered) {
    return (
      <div className="text-center max-w-md mx-auto py-10">
        <p className="font-serif text-2xl leading-relaxed text-ink">
          Nothing in this category yet.
        </p>
        <p className="mt-6 text-slate leading-relaxed">
          Try another category, or bring in someone who has the perfect piece —
          they can post it directly.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto py-10">
      <p className="font-serif text-2xl leading-relaxed text-ink">
        Nothing here yet. The network is small on purpose.
      </p>
      <p className="mt-6 text-slate leading-relaxed">
        If you know someone with the perfect apartment, piece, or job opening
        coming up, bring them in. They can post it directly.
      </p>
    </div>
  );
}
