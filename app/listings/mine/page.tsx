// /listings/mine — a member's own listings (read-only). (Navigation slice.)
//
// Server Component. Member-only, mirroring the /apply + /listings/new gate:
//   1. No session            → /login.
//   2. Account, not a member → /profile (the membership nudge).
//   3. Member                → list the viewer's own published listings.
//
// RLS note: posting publishes directly today, so the existing
// listings_read_published_for_accounts policy already returns the member's own
// published rows when filtered by author_id — no new policy is needed. (If a
// draft state is ever introduced, add a "read own, any status" policy then.)
//
// Edit/delete controls are OUT of scope for this slice. The write RLS
// (listings_write_member_own_update / _delete) already permits the author to
// edit and delete their own rows — wire the forms in a later slice.

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

// Same byline treatment as /listings.
function renderByline(
  authorName: string | null,
  sponsorName: string | null
): string {
  const author = `Listed by ${authorName ?? "a member"}`;
  return sponsorName ? `${author} · sponsored by ${sponsorName}` : author;
}

export default async function MyListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .single<{ is_member: boolean }>();

  if (!account?.is_member) {
    redirect("/profile");
  }

  // Own published listings, newest first. author_id filter + the published-read
  // RLS together return exactly this member's posts.
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, images, author_name, sponsor_name"
    )
    .eq("author_id", user.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<ListingCard[]>();

  const coverPaths =
    listings
      ?.map((l) => l.images?.[0]?.path)
      .filter((p): p is string => Boolean(p)) ?? [];
  const coverUrlByPath = await signImagePaths(coverPaths);

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            My listings
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

function EmptyState() {
  return (
    <div className="text-center max-w-md mx-auto py-10">
      <p className="font-serif text-2xl leading-relaxed text-ink">
        You haven&apos;t posted anything yet.
      </p>
      <Link
        href="/listings/new"
        className="mh-link inline-block mt-8 text-[14px] tracking-[0.22em] uppercase text-ink"
      >
        Post a listing &rarr;
      </Link>
    </div>
  );
}
