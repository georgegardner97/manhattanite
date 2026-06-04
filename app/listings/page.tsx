// /listings — read-only browse.
//
// Server Component. RLS gates the read server-side (only published rows, and
// only for signed-in users), but we also redirect logged-out visitors to
// /login as defense in depth — so the render path short-circuits before any
// query, never relying on RLS alone.
//
// Read-only this slice: no filters, no search, no sort controls. Posting,
// contact, and sponsor display are later slices.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingImage = { path: string };

type ListingCard = {
  id: string;
  type: "apartment" | "furniture";
  title: string;
  description: string;
  price_cents: number;
  images: ListingImage[];
  author_name: string | null;
  sponsor_name: string | null;
};

function formatPrice(cents: number, type: ListingCard["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

export default async function ListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS policy listings_read_published_for_accounts restricts this to published
  // rows for signed-in users. The author name embed is gated by the accounts
  // RLS too — it resolves for the viewer's own listings and stays null for
  // others until a public-profile read policy lands (see memory, Slice 4).
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, images, author_name, sponsor_name"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50)
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
        {/* Wordmark */}
        <div className="text-center mb-20">
          <Link
            href="/"
            className="font-serif font-extralight text-4xl md:text-5xl tracking-tighter leading-none text-ink"
          >
            Manhattan<span className="italic">ite</span>
          </Link>
        </div>

        <div className="text-center mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Listings
          </p>
          <span className="block w-8 h-px bg-ink/30 mx-auto" />
        </div>

        {!listings || listings.length === 0 ? (
          <EmptyState />
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
      </div>
    </main>
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
        {renderByline(listing.author_name, listing.sponsor_name)}
      </p>
    </Link>
  );
}

// Byline rules:
// - Author always shown. Falls back to "a member" if the denorm is null
//   (defensive; shouldn't happen post-migration 0006).
// - Sponsor portion shown only when sponsor_name is present. Founders /
//   first-cohort members with no sponsor get a clean "Listed by [Name]"
//   with no trailing em-dash.
function renderByline(
  authorName: string | null,
  sponsorName: string | null
): string {
  const author = `Listed by ${authorName ?? "a member"}`;
  return sponsorName ? `${author} · sponsored by ${sponsorName}` : author;
}

function EmptyState() {
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
