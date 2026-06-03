// /listings/[id] — read-only listing detail.
//
// Server Component. RLS only returns published rows to signed-in users, so a
// draft, archived, or non-existent id simply resolves to no row → notFound().
// Logged-out visitors are redirected to /login (defense in depth), same as the
// browse page.
//
// Read-only this slice. The "Message the lister" CTA is intentionally not built
// — contact is a separate member-gated slice (dead-link rule: commented, not
// linked). Type-specific detail layouts come later; for now the jsonb details
// render as plain key/value pairs.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";

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
  author: { name: string | null } | null;
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

  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, details, images, author:accounts(name)"
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
        {/* Wordmark */}
        <div className="text-center mb-20">
          <Link
            href="/"
            className="font-serif font-extralight text-4xl md:text-5xl tracking-tighter leading-none text-ink"
          >
            Manhattan<span className="italic">ite</span>
          </Link>
        </div>

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
          Listed by {listing.author?.name ?? "a member"} · sponsored by &mdash;
        </p>

        {/* Contact is a separate member-gated slice — dead-link rule, not built:
        <Link
          href={`/listings/${listing.id}/contact`}
          className="mh-link inline-block mt-10 text-[14px] tracking-[0.22em] uppercase text-ink"
        >
          Message the lister
        </Link> */}
      </div>
    </main>
  );
}
