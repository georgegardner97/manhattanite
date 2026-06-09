// /apply — the membership application route. Phase 2 Slice A.
//
// Server Component. Gates, in order:
//   1. No session              → redirect to /login.
//   2. Already a member        → redirect to /profile (members don't apply).
//   3. A pending application    → render the confirmation state (no form).
//   4. Otherwise               → render the form, prefilled from the account.
//
// RLS is the real wall (the insert policy in 0007 enforces "own + not member");
// these route-level checks are the clean user-facing experience. Both layers
// stay — never weaken either.
//
// All applicant-facing copy is lifted verbatim from COMPANY/voice-and-copy.md
// (the "Application form opening" and "Application received — confirmation"
// blocks). American spelling throughout.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationForm from "@/app/components/ApplicationForm";

export const dynamic = "force-dynamic"; // session state varies per request.

type ApplyAccount = {
  name: string | null;
  neighborhood: string | null;
  is_member: boolean;
};

export default async function ApplyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Read the member flag + current name/neighborhood (RLS read-own).
  const { data: account } = await supabase
    .from("accounts")
    .select("name, neighborhood, is_member")
    .eq("id", user.id)
    .single<ApplyAccount>();

  // Members don't apply.
  if (account?.is_member) {
    redirect("/profile");
  }

  // Is there already a pending application? If so, show the confirmation state
  // instead of the form. limit(1) + maybeSingle so zero rows is not an error.
  const { data: pending } = await supabase
    .from("applications")
    .select("id")
    .eq("account_id", user.id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">

        {pending ? (
          /* ---------- Confirmation state ---------- */
          <>
            <div className="text-center mb-12">
              <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
                Application received
              </p>
              <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
                Thanks for applying.
              </h1>
              <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
            </div>

            <div className="max-w-md mx-auto space-y-6 text-center">
              <p className="font-serif text-lg leading-relaxed text-ink">
                We read every application personally, which means it&apos;ll take
                a few days. We&apos;ll be in touch either way.
              </p>
              <p className="font-serif text-lg leading-relaxed text-ink">
                In the meantime, if you know a member of Manhattanite who&apos;d
                vouch for you, ask them to send a note. Sponsored applications
                move faster.
              </p>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/listings"
                className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
              >
                Browse listings &rarr;
              </Link>
            </div>
          </>
        ) : (
          /* ---------- Application form ---------- */
          <>
            <Link
              href="/profile"
              className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
            >
              &larr; Profile
            </Link>

            <div className="text-center mt-12 mb-12">
              <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
                Apply for membership
              </p>
              <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
                Tell us who you are.
              </h1>
              <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
            </div>

            {/* Form opening copy — voice-and-copy.md, "Application form opening" */}
            <div className="max-w-md mx-auto mb-16 space-y-5 text-center">
              <p className="font-serif text-lg leading-relaxed text-ink">
                Manhattanite is a private network. We read every application
                personally, so tell us who you are in your own words.
              </p>
              <p className="font-serif text-lg leading-relaxed text-slate">
                The basics matter: real name, where you live in Manhattan, what
                you do. The rest is up to you. We&apos;re not looking for a CV.
              </p>
            </div>

            <ApplicationForm
              defaultName={account?.name ?? null}
              defaultNeighborhood={account?.neighborhood ?? null}
            />
          </>
        )}
      </div>
    </main>
  );
}
