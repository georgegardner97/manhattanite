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

// Visual (design foundation, Slice 2): the dark threshold, via AuthShell. Apply
// belongs "outside" with the auth screens — it is the second half of the same
// door, and putting it on the light product ground would have implied the
// applicant was already through it.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationForm from "@/app/components/ApplicationForm";
import AuthShell, { AuthLink } from "@/app/components/AuthShell";
import ArrowLink from "@/app/components/ArrowLink";

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

  if (pending) {
    /* ---------- Confirmation state ---------- */
    return (
      <AuthShell
        kicker="Application received"
        headline="Thanks for applying."
        width="wide"
        footer={<AuthLink href="/profile">Back to your profile</AuthLink>}
      >
        <div className="space-y-6 text-center">
          <p className="font-serif text-lg leading-relaxed text-bone">
            We read every application personally, which means it&rsquo;ll take a
            few days. We&rsquo;ll be in touch either way.
          </p>
          <p className="font-serif text-lg leading-relaxed text-bone/70">
            In the meantime, if you know a member of Manhattanite who&rsquo;d
            vouch for you, ask them to send a note. Sponsored applications move
            faster.
          </p>
          <div className="pt-4">
            <ArrowLink href="/listings" surface="dark">
              Browse listings
            </ArrowLink>
          </div>
        </div>
      </AuthShell>
    );
  }

  /* ---------- Application form ----------
     Opening copy verbatim from voice-and-copy.md, "Application form opening". */
  return (
    <AuthShell
      kicker="Apply for membership"
      headline="Tell us who you are."
      width="wide"
      sub="Manhattanite is a private network. We read every application personally, so tell us who you are in your own words. The basics matter: real name, where you live in Manhattan, what you do. The rest is up to you. We’re not looking for a CV."
      footer={<AuthLink href="/profile">Back to your profile</AuthLink>}
    >
      <ApplicationForm
        defaultName={account?.name ?? null}
        defaultNeighborhood={account?.neighborhood ?? null}
      />
    </AuthShell>
  );
}
