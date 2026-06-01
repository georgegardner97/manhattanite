// / — the public Tier 1 entry point (the gating page).
//
// Server Component. Before rendering, validate the session: a signed-in user
// is already through the gate, so we send them straight to /profile rather than
// show them the pitch again (the reverse of what /profile does for logged-out
// visitors). Logged-out visitors get the gating page: what Manhattanite is,
// the two CTAs, and the Account vs Member explainer.
//
// The old waitlist Airtable form was retired here in Slice 3.5 to close the
// front-door/side-door mismatch — visitors used to hit an application form
// while /signup quietly created real accounts. The application pipeline lives
// on, dormant, in lib/applications/submit.ts for the /apply slice to revive.
//
// Copy is the locked "Public-facing gating page" + "Two-tier explainer" from
// COMPANY/voice-and-copy.md. American spelling throughout.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function Home() {
  const supabase = await createClient();

  // getUser() validates the session against Supabase Auth on every call —
  // safer than getSession() which trusts whatever is in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already through the gate — don't show the pitch again.
    redirect("/profile");
  }

  return (
    <>
      <main>
        {/* ============ HERO + GATE ============ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <h1 className="mh-fade-in font-serif font-extralight text-7xl md:text-9xl tracking-tighter leading-none">
            Manhattan<span className="italic">ite</span>
          </h1>

          <div className="mh-fade-in max-w-md text-center mt-12">
            <p className="font-serif text-xl md:text-2xl leading-[1.4] text-ink">
              Manhattanite is a private marketplace for New Yorkers.
            </p>
            <p className="font-serif text-lg text-slate leading-relaxed mt-6">
              Create a free account to browse the network. To post a listing or
              contact a member, you&apos;ll need to be approved.
            </p>
          </div>

          {/* ============ CTAs ============ */}
          <div className="mh-fade-in-delay mt-14 flex flex-col items-center gap-7">
            <Link
              href="/signup"
              className="mh-link text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Create an account →
            </Link>

            {/* Quiet return path for existing users — links to /login. Locked
                "Log in" phrasing; slate weight so it sits under the primary CTA. */}
            <Link
              href="/login"
              className="mh-link text-[12px] tracking-[0.22em] uppercase text-slate"
            >
              Log in →
            </Link>

            {/* "I have an invite →" — no invite flow exists yet, so this stays
                commented out per the dead-link rule. A later block (5+) will
                wire it to the invite route. */}
            {/* <Link
              href="/invite"
              className="mh-link text-[14px] tracking-[0.22em] uppercase text-slate"
            >
              I have an invite →
            </Link> */}
          </div>

          {/* ============ TWO-TIER EXPLAINER ============ */}
          <div className="mh-fade-in-delay max-w-md mt-20 pt-12 border-t border-ink/10 text-center space-y-6">
            <p className="font-serif text-lg leading-relaxed text-slate">
              <span className="text-ink">Account.</span> Free. Browse every
              listing in the network. No application needed.
            </p>
            <p className="font-serif text-lg leading-relaxed text-slate">
              <span className="text-ink">Member.</span>{" "}
              Required to post, contact, or sponsor. Apply when you&apos;re ready,
              or ask a current member to bring you in.
            </p>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-ink/10 px-6 py-16 text-center">
        <div className="max-w-5xl mx-auto">
          <p className="font-serif font-extralight text-3xl tracking-tight">
            Manhattan<span className="italic">ite</span>
          </p>
          <p className="mt-3 text-[10px] tracking-[0.32em] uppercase text-slate">
            For New Yorkers
          </p>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10 text-[11px] tracking-[0.12em] uppercase text-slate">
            <a href="mailto:info@manhattanite.com" className="hover:text-ink transition-colors">
              Contact
            </a>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <span>New York City</span>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <span>© 2026</span>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
