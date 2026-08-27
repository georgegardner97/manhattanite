// /listings/mine — your own listings, every status, in the Classifieds system.
//
// No screen was drawn for this. It is not a port, so every judgement call obeys
// the rule that governed the preview: if the product cannot do it, cut it and
// write down why.
//
// THE STRUCTURE IS LOAD-BEARING AND IT IS INHERITED, NOT INVENTED. The July
// audit graded the editorial version of this page C+ for one specific reason: an
// archived test listing rendered at full card weight and out-shouted the live
// ones. The fix was structural — an archived listing stopped being the same
// object on the page as a live one:
//
//   active (pending / published / draft) → ClListingCard, so a live listing of
//     yours looks here exactly as it looks on browse.
//   archived → compact hairline rows under their own heading, no image, no link
//     (ClArchivedRow).
//
// Changing design system does not make that less true, so it survives the port.
//
// THE READ GOES THROUGH THE SHARED MODULE. readOwnListings() lives in
// lib/cl/listings-read.ts beside the gated public readers, rather than being
// inlined here. Slice 1 shipped a trust hole precisely by writing a second
// listings query on a page — and the RLS audit passed 59/59 either side of it,
// because the hole was above the database. A screen that lists listings calls a
// reader in that module, or it is wrong. This screen needed a narrowing that did
// not exist (own rows at any status, via listings_read_own, 0016), so the
// narrowing was added there.
//
// Member-gated, mirroring /listings/new and /apply:
//   1. No session            → /login.
//   2. Account, not a member → the members-only wall.
//   3. Member                → the listings.
//
// The non-member case is the wall rather than a redirect to /profile: the
// editorial page bounced silently, and ClGate is the design's own answer for
// "you are signed in and this is still not yours". Same permission outcome, and
// nothing about the listing set reaches the page.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  readOwnListings,
  toClCards,
  type ListingStatus,
} from "@/lib/cl/listings-read";
import AppHeader from "@/app/components/cl/AppHeader";
import ClGate from "@/app/components/cl/ClGate";
import ClListingCard from "@/app/components/cl/ClListingCard";
import ClArchivedRow from "@/app/components/cl/ClArchivedRow";
import ClListingActions from "@/app/components/cl/ClListingActions";

export const dynamic = "force-dynamic"; // session state varies per request.

// On your own listings the status is the thing you came to check, so it takes
// the kicker's slot where browse puts the neighborhood.
const STATUS_LABEL: Record<ListingStatus, string> = {
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

  if (!user) redirect("/login");

  // Read-own: the viewer's row and nobody else's.
  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .maybeSingle<{ is_member: boolean }>();

  if (!account?.is_member) {
    return (
      <>
        <AppHeader active="none" />
        <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,56px)]">
          <ClGate
            title="Members post"
            note="Posting is for members, so this is where your listings will be once you’re in."
          />
        </main>
      </>
    );
  }

  const all = await readOwnListings();
  const active = all.filter((row) => row.status !== "archived");
  const archived = all.filter((row) => row.status === "archived");

  // Signing happens over the ACTIVE rows only — a signed URL is a grant, and
  // archived rows render no image at all, so there is nothing to mint for them.
  //
  // The status then replaces the neighborhood in the kicker. `place` is that
  // slot, not `meta`: the byline underneath stays as it is everywhere else, so
  // a listing of yours still reads as the same object it is on browse.
  const statusById = new Map(active.map((row) => [row.id, row.status]));
  // Your own screen: the page redirects a guest long before this, so the byline
  // is the named one. Stated rather than defaulted — see the note on toClCards.
  const cards = (await toClCards(active, { isGuest: false })).map((card) => ({
    ...card,
    place: STATUS_LABEL[statusById.get(card.id)!],
  }));
  const cardById = new Map(cards.map((card) => [card.id, card]));

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1240px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        {/* No "Post a listing" here: AppHeader already carries it as the one
            filled pill on the screen, and repeating it inches below put two
            identical primary actions side by side. */}
        <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
          What you&rsquo;ve posted
        </h1>

        {/* The post-submit confirmation. Pre-moderation means a new listing has
            no public page to land on, so this is where it reports in. */}
        {submitted === "1" && (
          <div className="cl-note mt-6 max-w-[62ch]">
            Your listing is in review. We&rsquo;ll email you once we&rsquo;ve
            taken a look — it shows as <strong>In review</strong> below until
            then.
          </div>
        )}

        {all.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {active.length > 0 && (
              <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[clamp(20px,2.2vw,30px)]">
                {active.map((row) => {
                  const card = cardById.get(row.id);
                  if (!card) return null;
                  return (
                    <div key={row.id}>
                      <ClListingCard
                        card={card}
                        showSave={false}
                        // Only a live listing has a public page to link to —
                        // pending and draft rows are not readable on
                        // /listings/[id] (published-only RLS read), so linking
                        // them would 404 for their own author.
                        href={
                          row.status === "published"
                            ? `/listings/${row.id}`
                            : null
                        }
                      />

                      {row.moderation_note && (
                        <p
                          className="mt-2.5 max-w-[44ch] text-[12.5px] leading-[1.5]"
                          style={{ color: "var(--cl-muted)" }}
                        >
                          From the review: {row.moderation_note}
                        </p>
                      )}

                      <ClListingActions listingId={row.id} status={row.status} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ---------- Archived ----------
                Compact rows under their own heading. The audit fix: an archived
                listing is a record, not an offer. */}
            {archived.length > 0 && (
              <div className="mt-[clamp(40px,5vw,72px)]">
                <div className="cl-grouplabel mb-1">Archived</div>
                <ul className="mt-4">
                  {archived.map((row) => (
                    <ClArchivedRow key={row.id} row={row} />
                  ))}
                </ul>
                <p
                  className="mt-4 text-[12.5px]"
                  style={{ color: "var(--cl-faint)" }}
                >
                  Archived listings are off the network. They stay here for your
                  records.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

// A real screen, not a shrug: it says what is true, and offers the one thing
// there is to do about it.
function EmptyState() {
  return (
    <div className="cl-panel mt-8 max-w-[520px] p-[clamp(24px,3vw,40px)]">
      <div className="text-[clamp(19px,2vw,23px)] font-medium tracking-[-0.02em]">
        Nothing posted yet
      </div>
      <p
        className="mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        Everything you post shows up here — in review, live, or archived — with
        whatever the moderator sent back.
      </p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/listings/new" className="cl-pill">
          Post a listing
        </Link>
        <Link href="/listings" className="cl-ghost">
          Browse the network
        </Link>
      </div>
    </div>
  );
}
