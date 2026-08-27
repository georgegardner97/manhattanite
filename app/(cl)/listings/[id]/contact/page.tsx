// /listings/[id]/contact — the contact mechanic as a real page.
//
// The design's answer from the detail page is a popup, and it stays: ClContactModal
// is still what "Get in touch" opens. But this route has to exist as a page too.
// It is linked directly, it is where an old email link lands, and a mechanic that
// only works with JavaScript running is not a mechanic. Both render the same
// ClContactBody, so the popup and the page cannot drift apart about the gate, the
// copy, or what the email carries.
//
// GATES, IN ORDER — the live ones, unchanged:
//   1. No session (guest)          → /login.
//   2. Listing missing/unpublished → notFound().
//   3. Tier-1 (is_member=false)    → the interaction gate. NOT a silent
//      redirect: it explains why and points at membership (the D1 action-layer
//      gate, spec §Interaction gating).
//   4. Member                      → the contact form.
//
// Contacting is a member-only ACTION and the real wall is log_listing_contact()
// (0011), which raises for a non-member. These route-level checks are the clean
// user-facing experience. Both layers stay.
//
// The gate copy is lifted verbatim from COMPANY/voice-and-copy.md and lives in
// ClContactBody. American spelling throughout.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClContactBody from "@/app/components/cl/ClContactBody";

export const dynamic = "force-dynamic"; // session state varies per request.

type ContactListing = {
  id: string;
  author_id: string;
  author_name: string | null;
  title: string;
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged out can't contact anyone.
  if (!user) redirect("/login");

  // The listing must exist and be published. RLS returns published rows only,
  // so an unpublished id and a nonexistent one are the same answer here.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, author_id, author_name, title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<ContactListing>();

  if (!listing) notFound();

  // The member flag decides form vs. gate. RLS read-own.
  const { data: account } = await supabase
    .from("accounts")
    .select("name, is_member")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null; is_member: boolean }>();

  const isMember = account?.is_member ?? false;
  const listerName = listing.author_name ?? "this member";

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[560px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,48px)] pb-[clamp(32px,4vw,56px)]">
        <Link
          href={`/listings/${listing.id}`}
          className="cl-quiet mb-5 inline-block text-[13px]"
        >
          Back to the listing
        </Link>

        {/* The same card the popup uses, so the two frames read as one thing. */}
        <div className="cl-panel p-[clamp(22px,2.6vw,32px)]">
          <p className="cl-kicker mb-4 truncate">{listing.title}</p>

          {isMember ? (
            <ClContactBody
              mode="form"
              listingId={listing.id}
              listerName={listerName}
              senderName={account?.name ?? null}
              senderEmail={user.email ?? ""}
            />
          ) : (
            <ClContactBody mode="gate" listerName={listerName} />
          )}
        </div>
      </main>
    </>
  );
}
