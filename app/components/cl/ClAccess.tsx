// Screen 09 — the way in, in the Classifieds system. Promoted from the preview
// on 2026-08-26 to cover /login, /signup and /apply.
//
// WHY THIS IS ONE COMPONENT AND NOT THREE PAGES. ClGate — the members-only wall
// a guest meets on a seventh listing — links to /login and /apply. Until this
// slice both were editorial, so the highest-traffic conversion moment on the
// logged-out path exited the design system mid-journey. Three routes now render
// one screen, so there is no seam left to cross.
//
// The design's two cards side by side: the way in on the left, the way back on
// the right. Both are wired to the real thing.
//
// THE LEFT CARD IS STATE-AWARE, WHICH THE DESIGN'S ISN'T. The mockup draws one
// request-access form for everybody, because a canvas has one state. The real
// pipeline has four, and showing the wrong one is worse than showing none:
//
//   guest            → invitation only. Since 2026-09-04 there is no account to
//                      send them to: the card explains the shape and stops,
//                      rather than collecting a name and an email into a form
//                      that has nowhere to post them.
//   account (Tier 1) → the joining profile form (was "request access" until
//                      2026-09-08 — see the Head below).
//   applied already  → your membership is being reviewed; you'll get an email.
//   member           → you're in. Nothing to ask for.
//
// THE RIGHT CARD IS THE `pane` PROP. It carried sign-in on /login and /apply and
// the real create-account form on /signup, and each offered the other. /signup
// is a redirect since 2026-09-04, so `pane="signup"` now has NO caller and the
// branch is unreachable. It is kept, not deleted: reopening the self-serve door
// is then one file — restore the page — rather than rebuilding a form. If that
// stays true for long enough to feel permanent, delete the branch and this
// paragraph together.
//
// WHAT IS NOT HERE: "Email me a link". The design's sign-in card offers a magic
// link beside the password. Magic-link-only was the original plan and was
// overridden in Phase 1 Slice 2 (decisions log, 2026-05-27) — auth is email and
// password, and there is no passwordless path to point that link at.
//
// NO REDIRECTS FOR THE SETTLED STATES, deliberately. The editorial /apply sent a
// member to /profile and a signed-in visitor to /login saw the form again. Both
// are answered here on the page instead: a member reads "you're a member", and
// a non-member reads their profile form or the review card.
//
// SIGNED IN, THIS IS ONE CARD AND NOTHING ELSE (George, 2026-09-15: "get rid of
// the right panel that allows them to browse once they've logged in. Its
// confusing. They shouldn't be able to see anything until their account has
// been approved. It ads the mystery."). REVERSES the look-around affordance.
// The right-hand panel used to say "You're signed in" and offer Browse listings
// beside Sign out, and the pending card offered "Look around meanwhile"; both
// were considered choices and both are withdrawn. A signed-in non-member is now
// sent here from every product route (lib/cl/member-gate.ts), so this screen is
// the whole of what they can see: the card, no product navigation in the header
// (`bare` for anyone who is not a member), and the waiting card deliberately
// ends on nothing. The right panel survives only for a logged-out visitor,
// where it is the sign-in form and the point of the screen.
//
// SIGN OUT MOVED INTO THE CARD, IT DID NOT GO. That panel was the only exit a
// non-member had, and stranding someone signed in with no way out is worse than
// the confusion being fixed. It is the quiet last line of the card: the address
// they are signed in as, and a POST form (see SignedInAs). The address is the
// viewer's own and only ever rendered to their own session; this route is
// dynamic and nothing in its metadata carries it.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Wordmark from "@/app/components/Wordmark";
import AppHeader from "@/app/components/cl/AppHeader";
import ClSignIn from "@/app/components/cl/ClSignIn";
import ClSignUp from "@/app/components/cl/ClSignUp";
import ClApplyForm from "@/app/components/cl/ClApplyForm";

/** Which door the right-hand card opens. */
export type ClAccessPane = "signin" | "signup";

export default async function ClAccess({
  pane = "signin",
}: {
  pane?: ClAccessPane;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Both reads are read-own under RLS — this page never looks at anyone else.
  let isMember = false;
  let name: string | null = null;
  let neighborhood: string | null = null;
  let hasPendingApplication = false;

  if (user) {
    const { data: account } = await supabase
      .from("accounts")
      .select("name, neighborhood, is_member")
      .eq("id", user.id)
      .maybeSingle<{
        name: string | null;
        neighborhood: string | null;
        is_member: boolean;
      }>();

    isMember = account?.is_member ?? false;
    name = account?.name ?? null;
    neighborhood = account?.neighborhood ?? null;

    if (!isMember) {
      const { data: pending } = await supabase
        .from("applications")
        .select("id")
        .eq("account_id", user.id)
        .eq("status", "pending")
        .maybeSingle<{ id: string }>();
      hasPendingApplication = Boolean(pending);
    }
  }

  // One card when signed in, so it must not stretch to the two-card width: 560
  // reads as a deliberate single column rather than a half-empty grid.
  const single = Boolean(user);

  return (
    <>
      <AppHeader active="none" bare={!isMember} />

      <main
        className={`mx-auto w-full ${single ? "max-w-[560px]" : "max-w-[1100px]"} px-[clamp(16px,2.4vw,28px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(32px,4vw,56px)]`}
      >
        <div
          className={
            single
              ? "flex flex-col"
              : "grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[clamp(20px,2.4vw,32px)]"
          }
        >
          {/* ---------- The way in: profile, review, or invitation only ---------- */}
          {/* id="request" is kept for any old /apply#request link; nothing in
              the product points at it any more. */}
          <section id="request" className="cl-panel p-[clamp(24px,3vw,44px)]">
            <Wordmark className="text-[18px] leading-none" />

            {isMember ? (
              <Settled
                title="You’re a member"
                note="Nothing to request. The network is open to you."
                href="/listings"
                cta="Browse listings"
              />
            ) : hasPendingApplication ? (
              // ENDS ON NOTHING, ON PURPOSE (George, 2026-09-15). There was a
              // last sentence inviting a look around and a "Look around
              // meanwhile" button; both went. A card that says you are being
              // reviewed, with no onward control, is the intended effect —
              // George's word for it is mystery.
              <Settled
                title="Your membership is being reviewed"
                note="A person reads every profile. You’ll get an email as soon as you’re confirmed — usually within a week."
              />
            ) : user ? (
              <>
                {/* NOT "REQUEST ACCESS" ANY MORE (George, 2026-09-08). Every
                    person who reaches this state now arrived through an
                    invitation, so they have already been vouched for — asking
                    them to request access described the old self-serve door
                    that closed on 4 September, and reads as a second hurdle
                    where there is only one. What they are doing here is
                    building the profile other members will read. */}
                <Head
                  title="Finish your profile"
                  note="You’ve been vouched for. Tell us who you are, and a person will confirm you."
                />
                <div className="mt-[26px]">
                  <ClApplyForm
                    defaultName={name}
                    defaultNeighborhood={neighborhood}
                  />
                </div>
              </>
            ) : (
              <>
                <Head
                  title="Invitation only"
                  note="A member has to bring you in."
                />
                {/* NO SELF-SERVE DOOR (George, 2026-09-04: the tiers are
                    scrapped — you are a member brought in by someone else, or
                    you are not). There is no form here and no account to
                    create, because there is nothing a stranger can do from
                    this screen but understand it. Collecting an email into a
                    waiting list would be the same cold form this card was
                    written to avoid. */}
                <ol
                  className="mt-6 flex flex-col gap-3 text-[13.5px] leading-[1.55]"
                  style={{ color: "var(--cl-body)" }}
                >
                  <Step n={1} label="A member invites you, and vouches for you." />
                  <Step n={2} label="You set a password and tell us who you are." />
                  <Step n={3} label="A person reads it, usually within a week." />
                </ol>
                {/* Where the "Create an account" pill used to be. It is a
                    sentence and not a control on purpose: the one thing a
                    guest here might actually be able to do is find the
                    invitation already sitting in their inbox, and there is no
                    route we could point a pill at that would help them do it
                    — the claim link is tokenised and only they have it. */}
                <p
                  className="mt-7 text-[12.5px] leading-[1.55]"
                  style={{ color: "var(--cl-faint)" }}
                >
                  Already invited? Your invitation is in your email — open the
                  link in it to claim your place.
                </p>
              </>
            )}

            {user && <SignedInAs email={user.email ?? null} />}
          </section>

          {/* ---------- Sign in / Create an account ----------
              Logged-out visitors only. Signed in, there is no second panel:
              see the header note. */}
          {!user && (
          <section className="cl-panel flex flex-col p-[clamp(24px,3vw,44px)]">
            <Wordmark className="text-[18px] leading-none" />

            <div className="flex flex-1 flex-col justify-center">
              {pane === "signup" ? (
                <>
                  <h2 className="mt-[26px] text-[clamp(21px,2.2vw,27px)] font-medium tracking-[-0.02em]">
                    Create an account
                  </h2>
                  <p
                    className="mt-2.5 text-[13.5px] leading-[1.55]"
                    style={{ color: "var(--cl-muted)" }}
                  >
                    Free. It lets you browse and apply — posting and messaging
                    come with membership.
                  </p>
                  <div className="mt-6">
                    <ClSignUp />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-[26px] text-[clamp(21px,2.2vw,27px)] font-medium tracking-[-0.02em]">
                    Sign in
                  </h2>
                  <div className="mt-6">
                    <ClSignIn variant="inline" />
                  </div>
                </>
              )}
            </div>

            <div
              className="mt-[18px] border-t pt-[18px] text-[12.5px]"
              style={{
                borderColor: "var(--cl-hairline)",
                color: "var(--cl-muted)",
              }}
            >
              {pane === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" style={{ color: "var(--cl-ink)" }}>
                    Sign in
                  </Link>
                </>
              ) : (
                <>Manhattanite is invitation only.</>
              )}
            </div>
          </section>
          )}
        </div>
      </main>
    </>
  );
}

function Head({ title, note }: { title: string; note: string }) {
  return (
    <>
      <h2 className="mt-[26px] text-[clamp(21px,2.2vw,27px)] font-medium tracking-[-0.02em]">
        {title}
      </h2>
      <p
        className="mt-2.5 text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        {note}
      </p>
    </>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex gap-3">
      <span className="tabular-nums" style={{ color: "var(--cl-faint)" }}>
        {n}
      </span>
      <span>{label}</span>
    </li>
  );
}

// The two states where there is nothing to fill in. The onward control is
// optional because only one of them has anywhere to go: a member is sent to
// the listings, and someone under review is sent nowhere.
function Settled({
  title,
  note,
  href,
  cta,
}: {
  title: string;
  note: string;
  href?: string;
  cta?: string;
}) {
  return (
    <>
      <Head title={title} note={note} />
      {href && cta && (
        <Link href={href} className="cl-pill mt-7">
          {cta}
        </Link>
      )}
    </>
  );
}

// The only exit a signed-in non-member has, so it stays — quietly, as the last
// line of the one card. A POST route, so this is a form and not a link: a
// prefetched or crawled GET would sign people out.
function SignedInAs({ email }: { email: string | null }) {
  return (
    <div
      className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-5 text-[12.5px]"
      style={{ borderColor: "var(--cl-hairline)", color: "var(--cl-faint)" }}
    >
      {email && <span className="min-w-0 break-all">Signed in as {email}</span>}
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="underline underline-offset-2"
          style={{ color: "var(--cl-muted)" }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
