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

// Layout (design foundation, Slice 2): the same light editorial grid as the
// detail page it came from — label column carries CONTACT and the way back,
// content column carries the statement, the copy and the boxed form.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/app/components/ContactForm";
import ArrowLink from "@/app/components/ArrowLink";
import SiteFooter from "@/app/components/SiteFooter";

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

  const isMember = account?.is_member ?? false;

  return (
    <>
      <main className="mh-gutter pt-14 max-[860px]:pt-9 pb-20">
        <div className="mh-section-grid">
          <aside>
            <p className="mh-label text-ink">
              {isMember ? "Contact" : "Members only"}
            </p>
            <ArrowLink
              href={`/listings/${listing.id}`}
              direction="back"
              className="mt-3.5 max-[860px]:mt-2"
            >
              Listing
            </ArrowLink>
          </aside>

          <div className="min-w-0">
            {isMember ? (
              /* ---------- Member: contact form ---------- */
              <>
                <h1 className="font-serif font-normal text-[46px] max-[860px]:text-[32px] leading-[1.08] text-ink border-b border-ink/16 pb-7">
                  Message {listerName}.
                </h1>

                <p className="max-w-[52ch] mt-8 mb-10 leading-relaxed text-slate">
                  Your note goes straight to their inbox. They&apos;ll see your
                  name and can reply to you directly.
                </p>

                <div className="max-w-[520px]">
                  <ContactForm
                    listingId={listing.id}
                    listerName={listerName}
                    senderName={account?.name ?? null}
                    senderEmail={user.email ?? ""}
                  />
                </div>
              </>
            ) : (
              /* ---------- Tier-1: interaction gate ----------
                 Copy verbatim from voice-and-copy.md, "Interaction gate —
                 account holder tries to contact a member." */
              <>
                <p className="font-serif text-[32px] max-[860px]:text-[26px] leading-[1.25] max-w-[26ch] text-ink">
                  To message {listerName}, you need a member account. Members
                  are sponsored by an existing member or approved through
                  application.
                </p>

                <div className="mt-9">
                  <ArrowLink href="/apply">Apply for membership</ArrowLink>

                  {/* "I have an invite →" — no /invite route exists yet, so it
                      stays commented out per the dead-link rule (same as the
                      gating page). Wire it when the invite flow lands. */}
                  {/* <ArrowLink href="/invite">I have an invite</ArrowLink> */}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter surface="light" />
    </>
  );
}
