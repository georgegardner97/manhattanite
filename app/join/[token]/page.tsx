// /join/[token] — the invited person's front door. Invite slice, Stage 2.
//
// Server Component. Looks the invite up by token via the SECURITY DEFINER
// get_invite() rpc (the token is the secret; no client RLS path exists for a
// logged-out visitor). A valid PENDING invite renders the claim form; anything
// else (used, revoked, mistyped) shows a plain message, never the form. A
// signed-in visitor is sent to /listings — join links are for new people.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JoinForm from "@/app/components/JoinForm";

export const dynamic = "force-dynamic";

type InviteRow = {
  inviter_name: string | null;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/listings");
  }

  const { data, error } = await supabase
    .rpc("get_invite", { p_token: token })
    .maybeSingle<InviteRow>();
  const invite = error ? null : data;

  if (!invite || invite.status !== "pending") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          <p className="font-serif text-2xl text-ink leading-relaxed">
            This invitation isn&apos;t available.
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link
            href="/"
            className="font-serif font-extralight text-5xl md:text-6xl tracking-tighter leading-none text-ink"
          >
            Manhattan<span className="italic">ite</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            You&apos;re invited
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight">
            {inviter} brought you in.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
          <p className="font-serif text-lg text-slate leading-relaxed mt-10">
            Manhattanite is a private marketplace for New Yorkers. Set a password
            to claim your spot &mdash; {inviter} is your sponsor, and we&apos;ll
            confirm your place by hand.
          </p>
        </div>

        <JoinForm token={token} email={invite.invitee_email} />
      </div>
    </main>
  );
}
