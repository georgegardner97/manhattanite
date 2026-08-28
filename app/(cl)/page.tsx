// Landing v3, in the Classifieds system.
//
// Ported from "Manhattanite Landing v3.dc.html": a hero that fills one screen,
// then the listings, then the way in, then a hairline footer. No navigation, no
// explanation, no section headings. The argument the page makes is that the
// listings are good, and it makes it by showing six of them.
//
// THE ACTIONS ARE INVERTED FROM THE DESIGN FILE, at the founder's direction
// (2026-08-17). The design puts "Request access" in the hero as a filled pill
// with "Sign in" quiet beside it. Here the hero carries sign-in alone — and it
// opens a real, working form in place rather than leaving for /login — while
// requesting access moved to a closing band at the foot of the page. The
// trade-off that makes is written up at the hero itself.
//
// THIS IS "/" NOW (2026-08-18). It was written at /design/landing and held
// there deliberately, because promoting it replaces the product's primary
// marketing surface and reverses the "dark outside, light inside" palette split
// decided 2026-07-17 — a call to make on purpose rather than as the side effect
// of importing a file. It was then made on purpose. The previous landing (the
// park-green photographic hero, and its redirect sending signed-in visitors
// straight to /listings) is retired and lives in git history.
//
// THE SIX CARDS ARE THE REAL TEASER. The design draws six invented listings;
// six is also exactly what a logged-out visitor is allowed to see (the D1
// teaser cap, enforced in listings-read.ts). So this renders the actual six,
// and every card links to a detail page that same visitor can actually open —
// the landing leads somewhere for a stranger, which is the whole job of it.
//
// NOBODY IS NAMED HERE, AND AS OF 2026-08-26 NOBODY IS NAMED TO A LOGGED-OUT
// VISITOR ANYWHERE. This page had the instinct first — the design's card reads
// "Vouched by a member", the trust signal without the person — and browse,
// search, saved and the member profile named the same guest one click away. Put
// to the founder on 18 August it was held open; asked again on the 26th the
// answer was to hide names from guests everywhere and make browse match the
// landing. So the page-local anonymousMeta() this file used to carry is gone:
// it IS cardMeta()'s guest branch now, in lib/cl/listings-read.ts, and this
// page gets it by doing nothing special.
//
//   The design's "member since 2023" loses its year: that needs a join date
//   from `accounts`, which is read-own under RLS and so unavailable to a
//   logged-out reader. The line keeps the shape rather than inventing a number.
//
//   A SIGNED-IN VISITOR TO "/" NOW SEES THE FULL BYLINE, which is the rule
//   working, not an exception to it: nothing changes for anyone who is actually
//   in the building.

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";
import ClLandingCard from "@/app/components/cl/ClLandingCard";
import ClSignIn from "@/app/components/cl/ClSignIn";
import { readPermittedListings, toClCards } from "@/lib/cl/listings-read";

export const dynamic = "force-dynamic"; // session state varies per request.

// The design's landing grid is six cards. A signed-in visitor's read returns up
// to fifty, and the landing is not a browse page — it stays at six either way.
const LANDING_COUNT = 6;

export default async function ClassifiedsLandingPage() {
  const gated = await readPermittedListings();
  const cards = await toClCards(
    gated.rows.slice(0, LANDING_COUNT),
    gated,
    gated.covers
  );

  return (
    <>
      {/* ---------- The hero ---------- */}
      <section className="cl-hero cl-hero-settle flex flex-col items-center justify-center px-[clamp(20px,5vw,40px)] py-[clamp(48px,10vh,120px)] text-center">
        {/* The design sets the mark without its period. The period is a locked
            brand decision (Concept D, 2026-07-21 — "the period is PART of the
            mark: never dropped"), so this renders the shared Wordmark, same as
            AppHeader does. It is the one element the two design systems have in
            common, which makes the landing the best place to judge it. */}
        <Wordmark
          className="cl-enter text-[clamp(30px,4.4vw,54px)] leading-none"
          periodClassName="cl-period"
        />

        <p
          className="cl-enter cl-enter-2 mt-[clamp(20px,2.6vw,30px)] text-[clamp(16px,1.5vw,19px)] leading-[1.5]"
          style={{ color: "var(--cl-muted)" }}
        >
          A private marketplace for New York.
        </p>

        {/* ONE control, and it is Sign in.
            ----------------------------------------------------------------
            The design file gives the hero two: "Request access" filled, "Sign
            in" quiet beside it. That order is inverted here on purpose —
            signing in is now the page's primary action and opens a real form
            in place, and requesting access has moved to the foot of the page.

            Worth knowing what that trades: most landing traffic is people who
            have never been here, and above the fold they now see only a
            members' door. The listings underneath still do the arguing, and
            the way in is waiting at the end of them — but the first thing a
            stranger meets is a lock. That is the intended reading of "members
            only"; it is not the higher-converting one. */}
        <div className="cl-enter cl-enter-3 mt-[clamp(30px,4vw,44px)] w-full max-w-[340px]">
          <ClSignIn />
        </div>
      </section>

      {/* ---------- The listings ---------- */}
      {/* An empty network hides the section rather than showing a heading over
          nothing — same rule the live landing already follows. The hero still
          stands on its own, which is what it was drawn to do. */}
      {cards.length > 0 && (
        <section
          id="listings"
          className="border-t"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(24px,3vw,44px)] px-[clamp(16px,3vw,32px)] pt-[clamp(32px,4vw,56px)] pb-[clamp(56px,7vw,96px)]">
            {cards.map((card) => (
              <ClLandingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Request access, at the foot of the page ----------
          The last thing on the page rather than the first thing, so the
          listings get to make the case before the ask. It is a section rather
          than a link in the footer: a footer link reads as boilerplate, and
          this is the only way into the network. */}
      <section
        className="border-t"
        style={{ borderColor: "var(--cl-hairline)" }}
      >
        {/* Kept deliberately small. It is the last thing on the page and the
            only way in, but it is not a second hero — at full size it competed
            with the one at the top and made the listings look like the filling
            between two pitches. Now it sits closer to the footer's register:
            one line, one pill, roughly half the height it was. */}
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-center gap-x-5 gap-y-3.5 px-[clamp(16px,3vw,32px)] py-[clamp(26px,3vw,40px)] text-center">
          <p className="text-[15px] leading-[1.5]">
            Not a member yet?{" "}
            <span style={{ color: "var(--cl-muted)" }}>
              A member has to vouch for you.
            </span>
          </p>
          {/* Standard pill, not the hero's larger setting — the size difference
              is what keeps the two asks in the right order. */}
          <Link href="/login" className="cl-pill">
            Request access
          </Link>
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
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            {/* Read at request time, not hardcoded to 2026 as the design file
                has it — a copyright year that has to be remembered is one that
                will be wrong every January. */}
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
