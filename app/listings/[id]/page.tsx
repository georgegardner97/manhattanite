// /listings/[id] — read-only listing detail, teaser-aware.
//
// Server Component. RLS returns published rows; a draft, archived, or
// non-existent id resolves to no row → notFound().
//
// Logged-out (guest) visibility mirrors the /listings teaser (D1 decision):
// a guest may view a detail page ONLY if the listing is within the teaser set
// (the 6 most recent published). Any other detail → redirect to /signup. Logged-in
// accounts and members view any published listing.
//
// Read-only this slice. The "Message the lister" CTA is intentionally not built
// — contact is a separate member-gated slice (dead-link rule: commented, not
// linked). Type-specific detail layouts come later; for now the jsonb details
// render as plain key/value pairs.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingImage = { path: string };

type ListingDetail = {
  id: string;
  type: "apartment" | "furniture";
  title: string;
  description: string;
  price_cents: number;
  details: Record<string, unknown>;
  images: ListingImage[];
  author_id: string;
  author_name: string | null;
  sponsor_names: string[];
};

function formatPrice(cents: number, type: ListingDetail["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatDetailValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests may only see detail for a teaser listing (the 6 most recent
  // published). Everything else sends them to signup. Anon read of published
  // rows is enabled by migration 0010; the teaser cap is enforced here.
  if (!user) {
    const { data: teaser } = await supabase
      .from("listings")
      .select("id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<{ id: string }[]>();

    const inTeaser = teaser?.some((t) => t.id === id) ?? false;
    if (!inTeaser) {
      redirect("/signup");
    }
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, details, images, author_id, author_name, sponsor_names"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<ListingDetail>();

  if (!listing) {
    notFound();
  }

  const detailEntries = Object.entries(listing.details ?? {});

  // Sign every image path in one round-trip. Map order is preserved by the
  // paths we pass in; we re-walk listing.images so display order is the
  // poster's chosen order.
  const imagePaths = (listing.images ?? [])
    .map((i) => i.path)
    .filter((p): p is string => Boolean(p));
  const urlByPath = await signImagePaths(imagePaths);
  const imageUrls = imagePaths
    .map((p) => urlByPath.get(p))
    .filter((u): u is string => Boolean(u));

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/listings"
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
        >
          &larr; Listings
        </Link>

        <div className="mt-12 flex items-baseline justify-between gap-6">
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            {listing.title}
          </h1>
          <p className="font-serif text-2xl text-ink whitespace-nowrap">
            {formatPrice(listing.price_cents, listing.type)}
          </p>
        </div>

        <p className="mt-4 text-[11px] tracking-[0.22em] uppercase text-slate">
          {humanizeKey(listing.type)}
        </p>

        <span className="block w-8 h-px bg-ink/30 mt-10 mb-10" />

        {imageUrls.length > 0 && (
          <div className="mb-12 space-y-3">
            {imageUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className={
                  idx === 0
                    ? "w-full aspect-[4/3] object-cover bg-ink/5"
                    : "w-full object-cover bg-ink/5"
                }
              />
            ))}
          </div>
        )}

        <p className="font-serif text-lg text-ink leading-relaxed whitespace-pre-wrap">
          {listing.description}
        </p>

        {detailEntries.length > 0 && (
          <dl className="mt-12 space-y-6">
            {detailEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-[11px] tracking-[0.22em] uppercase text-slate mb-1">
                  {humanizeKey(key)}
                </dt>
                <dd className="font-serif text-lg text-ink">
                  {formatDetailValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-14 text-[11px] tracking-[0.22em] uppercase text-slate">
          {renderByline(listing.author_name, listing.sponsor_names)}
        </p>

        {/* Contact lives on a member-gated page (/contact does the gating +
            explains, so guests and Tier-1 accounts see it too). Hidden only on
            the viewer's own listing — you can't message yourself, and the
            function rejects it anyway. */}
        {listing.author_id !== user?.id && (
          <Link
            href={`/listings/${listing.id}/contact`}
            className="mh-link inline-block mt-10 text-[14px] tracking-[0.22em] uppercase text-ink"
          >
            Message the lister
          </Link>
        )}
      </div>
    </main>
  );
}
