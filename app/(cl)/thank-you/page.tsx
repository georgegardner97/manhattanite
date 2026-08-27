// /thank-you — the last screen an applicant sees before they are waiting on a
// person.
//
// NOTHING IN THE PRODUCT ROUTES HERE ANY MORE, and it is worth saying so out
// loud rather than quietly deleting the route. submitApplication ends in
// redirect("/apply"), where ClAccess answers the pending state on the page
// itself ("We have your request") — which is better, because it is the same
// screen they applied on and it knows who they are. What still reaches this
// address is old links: the waitlist-era emails, a bookmark, anything sent
// before the apply flow learned to answer for itself. Those people should land
// somewhere that looks like Manhattanite and tells them the truth, not on the
// last page of a retired design system.
//
// SO THE COPY IS DELIBERATELY ABOUT WAITING, NOT ABOUT SUBMITTING. It cannot
// claim to have just received anything — it does not know — so it says what is
// true of anyone who is here: a person reads these, and you will hear back.
//
// THE TIMELINE IS THE ONE THE PRODUCT ALREADY PROMISES. trust-and-moderation.md
// sets the internal target at under 48 hours with a 72-hour maximum; the apply
// form and ClAccess both say "usually within a week". The slower line is the one
// on screen, on purpose: the target is what George holds himself to, and the
// promise is what a stranger is allowed to hold him to. Never promise faster
// than the SLA you actually keep — and never make two screens in one flow
// promise different things.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";
import ClAuthCard from "@/app/components/cl/ClAuthCard";

export const metadata = {
  title: "Thank you — Manhattanite",
};

export default function ClassifiedsThankYouPage() {
  return (
    <>
      <AppHeader active="none" />

      <ClAuthCard
        title="Thank you — it’s in."
        note="A person reads every application by hand, usually within a week. You’ll hear back either way, by email."
        footer={
          <>
            Applied a while ago?{" "}
            <Link href="/apply" style={{ color: "var(--cl-ink)" }}>
              Check where you are
            </Link>
          </>
        }
      >
        {/* One quiet thing worth knowing, and one thing to do meanwhile. A
            waiting screen with no exit is a dead end, and the listings are the
            best argument the network has for being worth the wait. */}
        <p className="cl-inset">
          A member vouching for you moves it along. If you know one, ask them to
          send a note.
        </p>

        <Link href="/listings" className="cl-pill mt-5 w-full text-center">
          Look around meanwhile
        </Link>
      </ClAuthCard>
    </>
  );
}
