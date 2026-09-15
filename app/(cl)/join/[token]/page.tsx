// /join/[token] — the invited person's front door, in the Classifieds system.
//
// ONE OF THE TWO SCREENS MOST LIKELY TO BE SOMEBODY'S FIRST SIGHT OF
// MANHATTANITE. It is reached by clicking a link in an email from a friend, by
// a person who has never seen the site, and it arrives with a name attached to
// it — someone has already vouched for them. That is the best first impression
// the product ever gets to make, and until today it made it in a design system
// that is being retired.
//
// Server Component. Looks the invite up by token (get_invite, SECURITY DEFINER
// — the token IS the secret, and there is no client RLS path for a logged-out
// visitor), then branches on who is looking:
//
//   logged out                 → ClJoinForm: set a password, and the invite is
//                                claimed in the same submit.
//   logged in, Tier-1 account  → ClAcceptInvite: link the sponsor, finish at
//                                /apply. The "signed up first, invited later"
//                                case.
//   logged in, already a member → nothing to do; they are in.
//
// Anything not pending — used, revoked, mistyped — says so plainly and does not
// hint at which. The inviter's name is shown to the person holding the token,
// because it is the whole content of the invitation; the 2026-08-26 rule about
// not naming members to logged-out visitors is about the PUBLIC pages, and a
// one-time secret link from that member is not a public page.
//
// NO PRODUCT NAVIGATION FOR ANYONE WHO IS NOT YET A MEMBER (2026-09-15). Three
// of the four branches render the header `bare` — wordmark only. The full
// header offered a logged-out invitee Browse, Profile and a filled "Post a
// listing" pill, every one a locked door, and the pill was the heaviest thing
// on the screen, set directly against "Claim your spot". MobileTabBar drops its
// bar on this route for the same reason. The already-a-member branch keeps the
// normal header: that person is in, and every link in it goes somewhere.
//
// THE METADATA IS A FIXED STRING AND NAMES NOBODY. The page body may name the
// inviter because the token is a one-time secret held by the invitee; the tab
// title, the share card and anything a crawler can read are not held by the
// invitee, so the 2026-08-26 rule applies to them in full. Fixed rather than
// generateMetadata because there is nothing to look up and nothing should be.
// noindex because a one-time link has no business in a search index.

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClAuthCard from "@/app/components/cl/ClAuthCard";
import ClJoinForm from "@/app/components/cl/ClJoinForm";
import { ClAcceptInvite } from "@/app/components/cl/ClInviteActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You’ve been invited · Manhattanite",
  robots: { index: false, follow: false },
};

type InviteRow = {
  inviter_name: string | null;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
};

export default async function ClassifiedsJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_invite", { p_token: token })
    .maybeSingle<InviteRow>();
  const invite = error ? null : data;

  if (!invite || invite.status !== "pending") {
    return (
      <>
        <AppHeader bare />
        <ClAuthCard
          title="This invitation isn’t available."
          note={
            invite && invite.status === "accepted"
              ? "It’s already been used. If that wasn’t you, ask the member to send a new one."
              : "The link may be mistyped, or no longer valid. Ask the member who invited you to send a fresh one."
          }
          footer={
            <>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--cl-ink)" }}>
                Sign in
              </Link>
            </>
          }
        />
      </>
    );
  }

  const inviter = invite.inviter_name ?? "A member";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: account } = await supabase
      .from("accounts")
      .select("is_member")
      .eq("id", user.id)
      .single<{ is_member: boolean }>();

    if (account?.is_member) {
      return (
        <>
          <AppHeader active="none" />
          <ClAuthCard
            title={`${inviter} brought you in.`}
            note="You’re already a member, so you’re all set. If you meant to bring someone else in, send them an invitation of your own."
          >
            <div className="flex flex-wrap gap-2.5">
              <Link href="/listings" className="cl-pill">
                Browse listings
              </Link>
              <Link href="/invite" className="cl-ghost">
                Invite someone
              </Link>
            </div>
          </ClAuthCard>
        </>
      );
    }

    return (
      <>
        <AppHeader bare />
        <ClAuthCard
          title={`${inviter} brought you in.`}
          note={`Accept to be vouched for by ${inviter}. We’ll take you to finish your application, then confirm your place by hand.`}
        >
          <ClAcceptInvite token={token} />
        </ClAuthCard>
      </>
    );
  }

  // Logged out — sign up through the invitation. If the email already has an
  // account, the form explains how to sign in and reopen the link.
  return (
    <>
      <AppHeader bare />
      <ClAuthCard
        title={`${inviter} brought you in.`}
        note={`Manhattanite is a private marketplace for New Yorkers. Set a password to claim your spot — ${inviter} vouched for you, and we’ll confirm your place by hand.`}
        footer={
          <>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--cl-ink)" }}>
              Sign in
            </Link>
            , then open this invitation again.
          </>
        }
      >
        <ClJoinForm token={token} email={invite.invitee_email} />
      </ClAuthCard>
    </>
  );
}
