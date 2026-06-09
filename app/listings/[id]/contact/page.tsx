// /listings/[id]/contact — the contact mechanic. Phase 2, the contact slice.
//
// Server Component. Gates, in order:
//   1. No session (guest)      → redirect to /login.
//   2. Listing missing/unpublished → notFound().
//   3. Tier-1 (is_member=false) → the interaction gate (copy verbatim from
//      voice-and-copy.md). NOT a silent redirect — it explains why and points
//      to membership (the D1 action-layer gate, spec §Interaction gating).
//   4. Member                   → the contact form (ContactForm).
//
// Contacting is a member-only ACTION. The real wall is log_listing_contact()
// (0011), which raises for a non-member — these route-level checks are the clean
// user-facing experience. Both layers stay.
//
// Interaction-gate copy is lifted verbatim from COMPANY/voice-and-copy.md
// ("Interaction gate — account holder tries to contact a member"). The lister's
// name comes from the listing's denormalized author_name byline. American
// spelling throughout.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/app/components/ContactForm";

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

  // Guest → login. (Logged-out can't contact anyone.)
  if (!user) {
    redirect("/login");
  }

  // The listing must exist and be published. RLS returns published rows only.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, author_id, author_name, title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<ContactListing>();

  if (!listing) {
    notFound();
  }

  // The member flag decides form vs. gate. RLS read-own.
  const { data: account } = await supabase
    .from("accounts")
    .select("name, is_member")
    .eq("id", user.id)
    .single<{ name: string | null; is_member: boolean }>();

  const listerName = listing.author_name ?? "this member";

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/listings/${listing.id}`}
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
        >
          &larr; Listing
        </Link>

        {account?.is_member ? (
          /* ---------- Member: contact form ---------- */
          <>
            <div className="text-center mt-12 mb-12">
              <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
                Contact
              </p>
              <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
                Message {listerName}.
              </h1>
              <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
            </div>

            <div className="max-w-md mx-auto mb-16 text-center">
              <p className="font-serif text-lg leading-relaxed text-slate">
                Your note goes straight to their inbox. They&apos;ll see your name
                and can reply to you directly.
              </p>
            </div>

            <ContactForm
              listingId={listing.id}
              listerName={listerName}
              senderName={account?.name ?? null}
              senderEmail={user.email ?? ""}
            />
          </>
        ) : (
          /* ---------- Tier-1: interaction gate ----------
             Copy verbatim from voice-and-copy.md, "Interaction gate — account
             holder tries to contact a member." */
          <>
            <div className="text-center mt-12 mb-12">
              <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
                Members only
              </p>
              <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
            </div>

            <div className="max-w-md mx-auto text-center space-y-10">
              <p className="font-serif text-2xl leading-relaxed text-ink">
                To message {listerName}, you need a member account. Members are
                sponsored by an existing member or approved through application.
              </p>

              <div className="space-y-5">
                <Link
                  href="/apply"
                  className="mh-link block text-[14px] tracking-[0.22em] uppercase text-ink"
                >
                  Apply for membership &rarr;
                </Link>

                {/* "I have an invite →" — no /invite route exists yet, so it
                    stays commented out per the dead-link rule (same as the
                    gating page). Wire it when the invite flow lands. */}
                {/* <Link
                  href="/invite"
                  className="mh-link block text-[14px] tracking-[0.22em] uppercase text-slate"
                >
                  I have an invite &rarr;
                </Link> */}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
