// /sponsor-request/[token] — a member confirms or declines a request to vouch
// for an applicant. Sponsorship Request slice (2026-06-16).
//
// Server Component. Reads the request by token (get_sponsorship_request, 0025 —
// anon-readable by the secret token), then branches:
//   - no row              → notFound().
//   - already answered    → show the resolved state.
//   - not signed in       → details + "log in, then reopen this link".
//   - signed in, not the named sponsor → explain it's for someone else.
//   - signed in, the sponsor, pending  → the Confirm / Decline buttons.
//
// Confirming records consent only; the founder still gives final approval in the
// admin queue (the moat stays). American spelling throughout.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SponsorRequestActions from "@/app/components/SponsorRequestActions";

export const dynamic = "force-dynamic"; // session state varies per request.

type SponsorRequest = {
  requester_name: string | null;
  sponsor_name: string | null;
  sponsor_id: string;
  status: "pending" | "confirmed" | "declined";
};

export default async function SponsorRequestPage({
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

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Sponsorship request
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            {req.status === "pending"
              ? `${requesterName} asked you to vouch.`
              : "This request has been answered."}
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        {/* ---------- Already answered ---------- */}
        {req.status !== "pending" ? (
          <div className="max-w-md mx-auto text-center">
            <p className="font-serif text-lg leading-relaxed text-slate">
              {req.status === "confirmed"
                ? `You've already vouched for ${requesterName}. Manhattanite will take it from here.`
                : `You've already declined this request. ${requesterName} won't be told who declined.`}
            </p>
            <div className="mt-12">
              <Link
                href="/listings"
                className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
              >
                Browse listings &rarr;
              </Link>
            </div>
          </div>
        ) : !user ? (
          /* ---------- Not signed in ---------- */
          <div className="max-w-md mx-auto text-center space-y-8">
            <p className="font-serif text-lg leading-relaxed text-ink">
              {requesterName} is applying to join Manhattanite and named you as
              someone who&apos;d vouch for them. Sign in to your member account,
              then reopen this link to confirm or decline.
            </p>
            <Link
              href="/login"
              className="mh-link inline-block text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Sign in &rarr;
            </Link>
          </div>
        ) : !isSponsor ? (
          /* ---------- Signed in, but not the named sponsor ---------- */
          <div className="max-w-md mx-auto text-center space-y-8">
            <p className="font-serif text-lg leading-relaxed text-ink">
              This request was sent to a different member. If it was meant for
              you, sign in with the account that received the email and reopen
              this link.
            </p>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          /* ---------- The named sponsor, pending ---------- */
          <>
            <div className="max-w-md mx-auto mb-12 text-center">
              <p className="font-serif text-lg leading-relaxed text-slate">
                {requesterName} named you as someone who&apos;d vouch for them.
                If you know them and you&apos;re happy to sponsor them, confirm
                below. Your name will be shown as their sponsor. Manhattanite
                still gives every application a final look.
              </p>
            </div>
            <SponsorRequestActions token={token} requesterName={requesterName} />
          </>
        )}
      </div>
    </main>
  );
}
