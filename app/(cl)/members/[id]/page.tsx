// Screen 08 — Member profile, in the Classifieds system.
//
// BUILT ENTIRELY FROM LISTINGS, AND THAT IS THE INTERESTING PART. `accounts` is
// read-own under RLS (0001): a viewer cannot select another member's row, so
// the obvious implementation — fetch the member, render them — is not available
// and should not be made available casually. What IS public is the denormalized
// byline that migration 0006 put on every listing: `author_name` and
// `sponsor_names`, already shown on every card to every visitor.
//
// So this page shows exactly what the listings already say out loud, gathered in
// one place: who they are, who vouched for them, and what they have posted.
// Nothing here is a new disclosure — it is the same facts, re-sorted.
//
// WHAT THE DESIGN HAS THAT THIS DOESN'T, and what each would cost:
//
//   Avatar, "Member since 2023", neighborhood, bio → columns on `accounts`
//   (avatar_path and linkedin_url arrived in 0023). Reaching them from another
//   member's page needs either a new SELECT policy or a SECURITY DEFINER
//   function returning a deliberately narrow public slice. That is a real
//   privacy decision — it decides what a member's name buys you — and it is
//   written up in supabase/migrations/0026_member_profile.sql, which is NOT
//   applied. This page does not call it, so applying it changes nothing until
//   the follow-up wiring lands.
//
//   "Members vouched: 4" → the sponsorships table is RLS-locked with no client
//   policies, and get_my_connections() (0024) is keyed on auth.uid(), so it
//   answers only for the signed-in member. Counting someone else's sponsees is
//   not possible without new server code, and it is the most socially loaded
//   number on the screen. Omitted rather than approximated.
//
//   "Usually replies: same day" → nothing measures reply time. listing_contacts
//   records that a message was sent, never that one came back.
//
// The stat row therefore carries the two figures that are true.

import { notFound } from "next/navigation";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { formatPrice, placeOf } from "@/lib/listings/card";
import AppHeader from "@/app/components/cl/AppHeader";
import ClListingCard, { type ClCard } from "@/app/components/cl/ClListingCard";
import { readMemberListings } from "@/lib/cl/listings-read";
import { relativeDay } from "@/lib/cl/filters";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Published rows only, THROUGH THE SHARED GATE. This page used to run its own
  // query here and that was a hole: the six-row teaser is an application cap,
  // not an RLS one, so a second read showed a logged-out visitor listings that
  // /listings/[id] would then refuse them. readMemberListings() narrows the
  // permitted set for a guest instead of querying around it — see the note on
  // it in lib/cl/listings-read.ts.
  const { rows, isGuest } = await readMemberListings(id);

  // A member with no listings this viewer may see is, to this page, not a member
  // it can describe: there is no public fact to show. For a guest that is also
  // the correct answer for a member whose listings are all outside the teaser —
  // they are told nothing, rather than told a name and shown an empty grid.
  if (rows.length === 0) notFound();

  const name = rows.find((r) => r.author_name)?.author_name ?? "A member";

  // Sponsors, unioned across their listings. The byline cache is per-listing and
  // can differ between rows if sponsors were added over time, so the union is
  // the fullest true answer; order is preserved from the newest listing first.
  const sponsors = [...new Set(rows.flatMap((r) => r.sponsor_names ?? []))];

  const coverUrlByPath = await signImagePaths(
    rows.map((r) => r.images?.[0]?.path).filter((p): p is string => Boolean(p))
  );

  const cards: ClCard[] = rows.map((row) => {
    const coverPath = row.images?.[0]?.path;
    return {
      id: row.id,
      title: row.title,
      place: placeOf(row),
      price: formatPrice(row.price_cents, row.type),
      // The byline is redundant on someone's own profile — every card here has
      // the same author — so the meta line carries the date alone.
      meta: relativeDay(row.created_at),
      coverUrl: coverPath ? coverUrlByPath.get(coverPath) ?? null : null,
      isExample: row.is_example,
    };
  });

  const neighborhoods = [
    ...new Set(
      rows
        .map((r) => r.details?.neighborhood)
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    ),
  ];

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1000px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        <div className="flex flex-wrap items-center gap-[22px]">
          {/* The design's photograph, held as the placeholder circle — see the
              note on .cl-avatar in classifieds.css. */}
          <div className="cl-avatar h-[76px] w-[76px]" aria-hidden="true" />

          <div className="min-w-[200px] flex-1">
            <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
              {name}
            </h1>
            <p
              className="mt-[7px] text-[13.5px]"
              style={{ color: "var(--cl-muted)" }}
            >
              {[
                neighborhoods[0],
                sponsors.length > 0 && `Vouched by ${sponsors.slice(0, 2).join(" & ")}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* Two cells, not the design's three. The third — "usually replies" —
            has nothing behind it. */}
        <div
          className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] overflow-hidden rounded-[12px] border"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          {/* For a guest this counts the rows ON THIS PAGE, which is the only
              honest number available: their view is the teaser slice, so a
              network-wide total would be a fact they cannot check and a second
              way to learn how much is being withheld. */}
          <Stat
            label={isGuest ? "Listings shown" : "Listings"}
            value={String(rows.length)}
          />
          <Stat
            label={sponsors.length === 1 ? "Vouched by" : "Vouched by"}
            value={String(sponsors.length)}
            divided
          />
        </div>

        <div className="cl-grouplabel mt-[34px] mb-4">Their listings</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[26px]">
          {cards.map((card) => (
            <ClListingCard key={card.id} card={card} />
          ))}
        </div>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  divided,
}: {
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div
      className="px-5 py-[18px]"
      style={divided ? { borderLeft: "1px solid var(--cl-hairline)" } : undefined}
    >
      <div
        className="text-[11.5px] uppercase"
        style={{ letterSpacing: "0.1em", color: "var(--cl-faint)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-[20px] font-medium tabular-nums">{value}</div>
    </div>
  );
}
