// Landing v4 — the door, and nothing else.
//
// v3 (2026-08-18) argued the case by showing the product: a full-screen hero,
// then the six listings a logged-out visitor is allowed to see, then the way
// in, then a hairline footer. The argument was that the listings are good, and
// it made it by showing six of them.
//
// THE LISTINGS ARE GONE FROM "/" AS OF 2026-08-28, at the founder's direction.
// The landing is now the wordmark, the line, and the sign-in — one screen, no
// scroll, nothing to browse. The reading is that a private network should look
// shut from the outside; the bet is that being told nothing is more intriguing
// than being shown six things you cannot have.
//
//   THIS IS EXPLICITLY REVERSIBLE. George: "if that proves to be not the right
//   method, then we can always change it back." v3 is one commit back in git
//   history, and the pieces it used are all still here — readPermittedListings
//   and toClCards in lib/cl/listings-read.ts, ClLandingCard in components. The
//   teaser cap (D1, six rows to a guest) is enforced in the read layer, not
//   here, so nothing about it decayed when this page stopped calling it.
//
//   WHAT IT COSTS. A stranger now meets a lock and no evidence. v3's whole
//   structure existed to put proof before the ask; this removes the proof and
//   keeps the ask. If applications fall off, that is the cause, and the fix is
//   the revert rather than a redesign.
//
// THE WAY IN MOVED TO THE FOOTER. It cannot simply be deleted — a member has
// to vouch for you, so /login is the only door a non-member has, and a page
// with no door at all is a dead end rather than a mystery. It sits in the
// footer's register now: a quiet link beside Privacy and Terms, not a band and
// not a pill. The hero keeps exactly one control, which is the point of it.
//
// NOBODY IS NAMED HERE, because nothing is shown here. The guest-anonymity rule
// (2026-08-26, names hidden from logged-out visitors everywhere) lives in
// cardMeta() in lib/cl/listings-read.ts and still governs browse and search.
// This page no longer touches it either way.
//
// ONE SCREEN, NO SCROLL. v3's hero carried `cl-hero` (min-height 100dvh) and
// let the listings scroll under it. With nothing under it but a footer, that
// same rule would push the footer just past the fold and buy a page a few
// pixels of pointless scroll. So the page is a full-height column instead: the
// hero grows, the footer sits on the bottom edge, and the landing is exactly
// as tall as the window.

// A SIGNED-IN VISITOR NEVER SEES THIS PAGE. It is the door, and someone already
// inside the building does not need one — before this, a member who typed the
// bare domain got a sign-in form while holding a valid session, which is the
// product asking a question it already knows the answer to. So "/" redirects
// them to /listings. That restores the pre-v3 behaviour (v3 showed them the six
// cards with real bylines; that reading died with the cards) and it matches what
// signing in from this very page already does — ClSignIn pushes to /listings on
// success, so the redirect just makes the second visit agree with the first.
//
//   IT DOES NOT COST THE PAGE-SPEED WIN (356ms -> 107ms, 2026-08-28), and the
//   reason is worth writing down before someone "optimises" it back out:
//
//   - THE PROXY ALREADY READS AUTH ON THIS REQUEST. proxy.ts matches every path
//     but static assets and calls getUser() to refresh the session. The auth
//     round trip on "/" is already being paid; this reads the result of it.
//   - A GUEST PAYS NOTHING. supabase-js short-circuits getUser() when there is
//     no auth cookie — measured at 0ms in the page-speed pass. Guests are who
//     the 107ms describes, and they still make zero Supabase calls here.
//   - THERE IS NO CACHE TO BREAK. The 107ms came from unstable_cache wrapping
//     the guest teaser read in listings-read.ts. This page stopped calling that
//     when the cards went, so there is no cached branch on "/" left to defeat.
//   - THERE IS NO PRERENDER TO LOSE. The route was force-dynamic before and
//     after; it has never been static.

import Link from "next/link";
import { redirect } from "next/navigation";
import Wordmark from "@/app/components/Wordmark";
import ClSignIn from "@/app/components/cl/ClSignIn";
import { createClient } from "@/lib/supabase/server";

// Per-request, for two reasons now: the signed-in redirect above has to see the
// session, and the footer's copyright year is read at request time rather than
// frozen at build — a static "/" would carry whichever year the last deploy
// happened in.
export const dynamic = "force-dynamic";

export default async function ClassifiedsLandingPage() {
  // Read, don't trust: the proxy refreshed the token, getUser() validates it.
  // Anyone holding a real session is sent to the product; everyone else — every
  // logged-out visitor, which is nearly all of this page's traffic — falls
  // straight through to the render below without touching Supabase.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/listings");

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------- The hero ---------- */}
      <section className="cl-hero-settle flex flex-1 flex-col items-center justify-center px-[clamp(20px,5vw,40px)] py-[clamp(48px,10vh,120px)] text-center">
        {/* The period is a locked brand decision (Concept D, 2026-07-21 — "the
            period is PART of the mark: never dropped"), so this renders the
            shared Wordmark, same as AppHeader does. With the listings gone it
            is now the largest thing on the site's front door by some distance,
            which is the sharpest test the mark will get. */}
        <Wordmark
          className="cl-enter text-[clamp(30px,4.4vw,54px)] leading-none"
          periodClassName="cl-period"
        />

        {/* The one line of copy that survives. It is doing the work the six
            cards used to do — a stranger's only clue what this is — so it
            stays, and it stays exactly this length. */}
        <p
          className="cl-enter cl-enter-2 mt-[clamp(20px,2.6vw,30px)] text-[clamp(16px,1.5vw,19px)] leading-[1.5]"
          style={{ color: "var(--cl-muted)" }}
        >
          A private marketplace for New York.
        </p>

        {/* ONE control, and it is Sign in. It opens a real, working form in
            place — no navigation, no modal — so the page never has to become a
            second page. */}
        <div className="cl-enter cl-enter-3 mt-[clamp(30px,4vw,44px)] w-full max-w-[340px]">
          <ClSignIn />
        </div>
      </section>

      {/* ---------- The footer ---------- */}
      <footer
        className="border-t"
        style={{ borderColor: "var(--cl-hairline)" }}
      >
        <div
          className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-5 px-[clamp(16px,3vw,32px)] py-5 text-[12.5px]"
          style={{ color: "var(--cl-faint)" }}
        >
          <span>New York City</span>
          <div className="flex gap-5">
            {/* The only way into the network, kept deliberately quiet. It reads
                as boilerplate here, which is the trade v3 refused to make and
                this version accepts: the hero is worth more undivided than the
                ask is worth prominent. */}
            <Link href="/apply">How to join</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            {/* Read at request time, not hardcoded — a copyright year that has
                to be remembered is one that will be wrong every January. */}
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
