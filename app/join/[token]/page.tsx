// /join/[token] — the invited person's front door. Invite slice, Stages 2 + 4.
//
// Server Component. Looks the invite up by token (get_invite, SECURITY DEFINER
// — the token is the secret; no client RLS path exists for a logged-out
// visitor). A valid PENDING invite branches on who's looking:
//   - logged out                 → JoinForm (sign up, then accept).
//   - logged in, Tier-1 account   → AcceptInvitePanel (link the sponsor, then
//                                   finish at /apply). The "signed up first,
//                                   invited later" case.
//   - logged in, already a member → nothing to do; they're in.
// Anything not pending (used / revoked / mistyped) shows a plain message.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JoinForm from "@/app/components/JoinForm";
import AcceptInvitePanel from "@/app/components/AcceptInvitePanel";
import Wordmark from "@/app/components/Wordmark";

export const dynamic = "force-dynamic";

type InviteRow = {
  inviter_name: string | null;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
};

// Shared editorial shell so every branch reads the same.
function Shell({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/" className="text-ink">
            <Wordmark className="font-extralight text-5xl md:text-6xl tracking-tighter leading-none" />
          </Link>
        </div>
        <div className="text-center mb-12">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            {kicker}
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight">
            {title}
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
          <p className="font-serif text-lg text-slate leading-relaxed mt-10">
            {body}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

export default async function JoinPage({
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          <p className="font-serif text-2xl text-ink leading-relaxed">
            This invitation isn&rsquo;t available.
          </p>
          <p className="mt-4 text-slate leading-relaxed">
            {invite && invite.status === "accepted"
              ? "It's already been used. If that wasn't you, ask the member to send a new one."
              : "The link may be mistyped or no longer valid. Ask the member who invited you to send a fresh one."}
          </p>
          <div className="mt-10">
            <Link
              href="/"
              className="mh-link text-[13px] tracking-[0.22em] uppercase text-ink"
            >
              Manhattanite &rarr;
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inviter = invite.inviter_name ?? "A member";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in — either already a member, or a Tier-1 account who can accept.
  if (user) {
    const { data: account } = await supabase
      .from("accounts")
      .select("is_member")
      .eq("id", user.id)
      .single<{ is_member: boolean }>();

    if (account?.is_member) {
      return (
        <Shell
          kicker="You're invited"
          title={`${inviter} brought you in.`}
          body="You're already a member of Manhattanite, so you're all set. If you meant to bring someone else in, send them an invite from your account menu."
        >
          <div className="text-center">
            <Link
              href="/listings"
              className="mh-link text-[13px] tracking-[0.22em] uppercase text-ink"
            >
              Browse the network &rarr;
            </Link>
          </div>
        </Shell>
      );
    }

    return (
      <Shell
        kicker="You're invited"
        title={`${inviter} brought you in.`}
        body={`Accept to be vouched for by ${inviter}. We'll take you to finish your application, then confirm your place by hand.`}
      >
        <AcceptInvitePanel token={token} />
      </Shell>
    );
  }

  // Logged out — sign up through the invite. If the email already has an
  // account, JoinForm explains how to sign in and reopen the link.
  return (
    <Shell
      kicker="You're invited"
      title={`${inviter} brought you in.`}
      body={`Manhattanite is a private marketplace for New Yorkers. Set a password to claim your spot — ${inviter} is your sponsor, and we'll confirm your place by hand.`}
    >
      <JoinForm token={token} email={invite.invitee_email} />
      <p className="mt-12 text-sm text-slate text-center leading-relaxed">
        Already have an account?{" "}
        <Link href="/login" className="mh-link text-ink">
          Sign in
        </Link>
        , then open this invitation again.
      </p>
    </Shell>
  );
}
