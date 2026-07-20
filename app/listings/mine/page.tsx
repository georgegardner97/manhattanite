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
//
// Layout (design foundation, Slice 3). The audit graded this page C+ for one
// specific reason: an ARCHIVED QA test listing rendered at full card weight and
// out-shouted the live ones. The fix is structural, not cosmetic —
//
//   active (pending / published / draft) → the standard ListingCard, so a live
//     listing looks here exactly as it looks on browse.
//   archived → compact hairline ROWS beneath a separate heading. Status, title,
//     price, date, and the moderation note if there is one. No image, no card.
//
// An archived listing can never again outweigh a live one, because it is no
// longer the same object on the page.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import {
  formatPrice,
  formatPostedDate,
  type ListingRow,
} from "@/lib/listings/card";
import MyListingActions from "@/app/components/MyListingActions";
import ListingCard from "@/app/components/ListingCard";
import PageShell from "@/app/components/PageShell";
import ArrowLink from "@/app/components/ArrowLink";
import BoxButton from "@/app/components/BoxButton";

export const dynamic = "force-dynamic"; // session state varies per request.

export type ListingStatus = "pending" | "published" | "draft" | "archived";

// The shared card columns plus what only this page needs: the byline fields,
// the status, and the moderation note.
type MyListing = ListingRow & {
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
  // created_at and details join the select for the card kicker (posted date,
  // neighborhood) — same row, same policy, no new reach.
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_name, sponsor_names, status, moderation_note"
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .returns<MyListing[]>();

  const all = listings ?? [];
  const active = all.filter((l) => l.status !== "archived");
  const archived = all.filter((l) => l.status === "archived");

  const coverPaths = active
    .map((l) => l.images?.[0]?.path)
    .filter((p): p is string => Boolean(p));
  const coverUrlByPath = await signImagePaths(coverPaths);

  return (
    <PageShell
      label="My listings"
      title="What you've posted."
      backHref="/listings"
      backLabel="Listings"
    >
      {/* The post-submit confirmation. Pre-moderation means there's no public
          page to land on, so this is where a new listing reports in. */}
      {submitted === "1" && (
        <p className="font-serif text-[26px] leading-[1.25] max-w-[30ch] mt-10 text-ink">
          Your listing is in review. We&rsquo;ll email you once we&rsquo;ve
          taken a look.
        </p>
      )}

      {all.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {active.length > 0 && (
            <div className="mt-10 mh-card-grid">
              {active.map((listing) => {
                const coverPath = listing.images?.[0]?.path;
                const coverUrl = coverPath
                  ? coverUrlByPath.get(coverPath) ?? null
                  : null;
                return (
                  <div key={listing.id}>
                    <ListingCard
                      surface="light"
                      // Status replaces the neighborhood in the kicker's left
                      // slot: on your own listings, "In review" is the thing
                      // you came to check, not where the apartment is.
                      listing={{
                        id: listing.id,
                        title: listing.title,
                        description: listing.description ?? null,
                        place: STATUS_BADGE[listing.status],
                        price: formatPrice(listing.price_cents, listing.type),
                        postedAt: formatPostedDate(listing.created_at),
                        coverUrl,
                        isExample: listing.is_example,
                        byline: renderByline(
                          listing.author_name,
                          listing.sponsor_names
                        ),
                      }}
                      // Only a live listing has a public page to link to —
                      // pending and draft rows aren't readable on
                      // /listings/[id] (published-only RLS read).
                      href={
                        listing.status === "published"
                          ? `/listings/${listing.id}`
                          : null
                      }
                    />

                    {listing.moderation_note && (
                      <p className="mt-3.5 text-[12.5px] leading-relaxed text-slate max-w-[44ch]">
                        <span className="mh-label">From the review:&nbsp;</span>
                        {listing.moderation_note}
                      </p>
                    )}

                    <MyListingActions
                      listingId={listing.id}
                      status={listing.status}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- Archived ----------
              Compact rows, muted, under their own hairline heading. This is
              the audit fix: an archived listing is a record, not an offer. */}
          {archived.length > 0 && (
            <div className="mt-[72px] mh-rule">
              <p className="mh-label text-slate mb-1">Archived</p>
              <ul className="mt-5">
                {archived.map((listing) => (
                  <li
                    key={listing.id}
                    className="grid grid-cols-[110px_1fr_auto_auto] items-baseline gap-x-6 gap-y-1 py-3.5 border-t border-ink/12 last:border-b max-[860px]:grid-cols-[1fr_auto]"
                  >
                    <span className="mh-label text-slate max-[860px]:col-span-2">
                      {STATUS_BADGE[listing.status]}
                    </span>
                    <span className="text-slate truncate">{listing.title}</span>
                    <span className="text-slate tabular-nums whitespace-nowrap">
                      {formatPrice(listing.price_cents, listing.type)}
                    </span>
                    <span className="mh-label text-slate/70 whitespace-nowrap max-[860px]:hidden">
                      {formatPostedDate(listing.created_at)}
                    </span>
                    {listing.moderation_note && (
                      <span className="col-span-4 max-[860px]:col-span-2 text-[12.5px] leading-relaxed text-slate/70 max-w-[52ch]">
                        <span className="mh-label">From the review:&nbsp;</span>
                        {listing.moderation_note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] text-slate/70">
                Archived listings are off the network. They stay here for your
                records.
              </p>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 max-w-[34ch]">
      <p className="font-serif text-[26px] leading-[1.25] text-ink">
        You haven&rsquo;t posted anything yet.
      </p>
      <div className="mt-7">
        <BoxButton href="/listings/new" surface="light">
          Post a listing
        </BoxButton>
      </div>
      <div className="mt-6">
        <ArrowLink href="/listings">Browse the network</ArrowLink>
      </div>
    </div>
  );
}
