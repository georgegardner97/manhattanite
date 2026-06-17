// /listings/mine — a member's own listings, every status. (Listing Moderation slice.)
//
// Server Component. Member-only, mirroring the /apply + /listings/new gate:
//   1. No session            → /login.
//   2. Account, not a member → /profile (the membership nudge).
//   3. Member                → list ALL of the viewer's own listings.
//
// Pre-moderation changed this page from "own published listings" to the
// member's whole picture: every listing they've posted, each under a status
// badge — In review (pending) / Live (published) / Needs changes (draft,
// returned by the admin with a note) / Archived. The listings_read_own policy
// (migration 0016) is what makes the any-status read possible.
//
// Returned (draft) listings show the moderation note and a Resubmit control;
// rejected (archived) listings show the note for the record. Edit/Remove stay
// from the Edit & Remove slice, now status-aware (MyListingActions).
//
// ?submitted=1 (the redirect from posting) renders the review-aware
// confirmation up top — a pending listing has no public page to land on.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import MyListingActions from "@/app/components/MyListingActions";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingImage = { path: string };

export type ListingStatus = "pending" | "published" | "draft" | "archived";

type ListingCard = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number;
  images: ListingImage[];
  author_name: string | null;
  sponsor_names: string[];
  status: ListingStatus;
  moderation_note: string | null;
};

const STATUS_BADGE: Record<ListingStatus, string> = {
  pending: "In review",
  published: "Live",
  draft: "Needs changes",
  archived: "Archived",
};

function formatPrice(cents: number, type: ListingCard["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
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

  // ALL own listings, newest first. The author_id filter + listings_read_own
  // (0016) together return exactly this member's posts, any status.
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, images, author_name, sponsor_names, status, moderation_note"
    )
    .eq("author_id", user.id)
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
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            My listings
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        {submitted === "1" && (
          <p className="mb-14 text-center font-serif text-xl leading-relaxed text-ink">
            Your listing is in review. We&apos;ll email you once we&apos;ve
            taken a look.
          </p>
        )}

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
                <li
                  key={listing.id}
                  className="border-t border-ink/10 py-10 last:border-b"
                >
                  <ListingCardItem listing={listing} coverUrl={coverUrl} />
                  {listing.moderation_note && (
                    <p className="mt-5 text-sm text-slate">
                      <span className="text-[11px] tracking-[0.22em] uppercase">
                        From the review:&nbsp;
                      </span>
                      {listing.moderation_note}
                    </p>
                  )}
                  <MyListingActions
                    listingId={listing.id}
                    status={listing.status}
                  />
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
  const muted = listing.status === "archived";

  const card = (
    <>
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
      <p className="mb-4 text-[11px] tracking-[0.22em] uppercase text-slate">
        {STATUS_BADGE[listing.status]}
      </p>
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
    </>
  );

  // Only a live listing has a public page to link to — pending, draft, and
  // archived rows aren't readable on /listings/[id] (published-only RLS read),
  // so their cards render unlinked.
  if (listing.status === "published") {
    return (
      <Link href={`/listings/${listing.id}`} className="group block">
        {card}
      </Link>
    );
  }
  return <div className={muted ? "opacity-60" : undefined}>{card}</div>;
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
