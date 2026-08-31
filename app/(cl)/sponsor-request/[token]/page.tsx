// /sponsor-request/[token] — a member confirms or declines a request to vouch
// for an applicant, in the Classifieds system.
//
// The other screen reached only from an email, and the more consequential of
// the two: what happens here decides whether somebody's name goes next to
// somebody else's, permanently and in public. So it says what confirming costs
// before it offers the button.
//
// Server Component. Reads the request by token (get_sponsorship_request, 0025 —
// anon-readable BY THE SECRET TOKEN ONLY), then branches:
//
//   no row                              → notFound().
//   already answered                    → the resolved state, no buttons.
//   not signed in                       → what it is, and sign in to answer.
//   signed in, not the named sponsor    → it was meant for someone else.
//   signed in, the sponsor, pending     → confirm or decline.
//
// Confirming records CONSENT ONLY. The founder still approves every application
// in the admin queue — a sponsor's yes is a necessary step, never a sufficient
// one, and the copy is careful not to imply otherwise.
//
// The applicant's name is shown to whoever holds the token, for the same reason
// /join names the inviter: the name is the entire content of the request, and a
// one-time secret link is not a public page.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClAuthCard from "@/app/components/cl/ClAuthCard";
import { ClSponsorActions } from "@/app/components/cl/ClInviteActions";

export const dynamic = "force-dynamic"; // session state varies per request.

type SponsorRequest = {
  requester_name: string | null;
  sponsor_name: string | null;
  sponsor_id: string;
  status: "pending" | "confirmed" | "declined";
};

export default async function ClassifiedsSponsorRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase.rpc("get_sponsorship_request", {
    p_token: token,
  });
  const req = (Array.isArray(rows) ? rows[0] : null) as SponsorRequest | null;
  if (!req) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requesterName = req.requester_name ?? "Someone";
  const isSponsor = !!user && user.id === req.sponsor_id;

  // ---------- Already answered ----------
  if (req.status !== "pending") {
    return (
      <>
        <AppHeader active="none" />
        <ClAuthCard
          title="This request has been answered."
          note={
            req.status === "confirmed"
              ? `You’ve already vouched for ${requesterName}. Manhattanite will take it from here.`
              : `You’ve already declined this request. ${requesterName} won’t be told who declined.`
          }
        >
          <Link href="/listings" className="cl-pill w-full text-center">
            Browse listings
          </Link>
        </ClAuthCard>
      </>
    );
  }

  // ---------- Not signed in ----------
  if (!user) {
    return (
      <>
        <AppHeader active="none" />
        <ClAuthCard
          title={`${requesterName} asked you to vouch.`}
          note={`They’re applying to join Manhattanite and named you as someone who’d vouch for them. Sign in to your member account, then reopen this link to answer.`}
        >
          <Link href="/login" className="cl-pill w-full text-center">
            Sign in
          </Link>
        </ClAuthCard>
      </>
    );
  }

  // ---------- Signed in, but not the named sponsor ----------
  if (!isSponsor) {
    return (
      <>
        <AppHeader active="none" />
        <ClAuthCard
          title="This request is for someone else."
          note="It was sent to a different member. If it was meant for you, sign in with the account that received the email and reopen this link."
        >
          {/* POST, not a link — a prefetched GET would sign people out. */}
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="cl-ghost w-full text-center">
              Sign out
            </button>
          </form>
        </ClAuthCard>
      </>
    );
  }

  // ---------- The named sponsor, pending ----------
  return (
    <>
      <AppHeader active="none" />
      <ClAuthCard
        title={`${requesterName} asked you to vouch.`}
        note={`If you know them and you’re happy to vouch for them, confirm below. Your name is shown beside theirs, on their profile and on everything they post.`}
      >
        <ClSponsorActions token={token} requesterName={requesterName} />

        <p className="cl-inset mt-5">
          Confirming is a vouch, not an approval — Manhattanite still gives every
          application a final look.
        </p>
      </ClAuthCard>
    </>
  );
}
