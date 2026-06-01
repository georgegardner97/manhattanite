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

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingCard = {
  id: string;
  type: "apartment" | "furniture";
  title: string;
  description: string;
  price_cents: number;
  author: { name: string | null } | null;
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
    .select("id, type, title, description, price_cents, author:accounts(name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ListingCard[]>();

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
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCardItem listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ListingCardItem({ listing }: { listing: ListingCard }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block border-t border-ink/10 py-10 last:border-b"
    >
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
        Listed by {listing.author?.name ?? "a member"} · sponsored by &mdash;
      </p>
    </Link>
  );
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
