// Screen 09 — Request access and sign in, in the Classifieds system.
//
// The design's two cards side by side: the way in on the left, the way back on
// the right. Both are wired to the real thing.
//
// THE LEFT CARD IS STATE-AWARE, WHICH THE DESIGN'S ISN'T. The mockup draws one
// request-access form for everybody, because a canvas has one state. The real
// pipeline has four, and showing the wrong one is worse than showing none:
//
//   guest            → you cannot apply without an account. The card says so and
//                      sends you to signup, rather than collecting a name and an
//                      email into a form that has nowhere to post them.
//   account (Tier 1) → the real application form.
//   applied already  → we have it; here is what happens next.
//   member           → you're in. Nothing to ask for.
//
// WHAT IS NOT HERE: "Email me a link". The design's sign-in card offers a magic
// link beside the password. Magic-link-only was the original plan and was
// overridden in Phase 1 Slice 2 (decisions log, 2026-05-27) — auth is email and
// password, and there is no passwordless path to point that link at.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Wordmark from "@/app/components/Wordmark";
import AppHeader from "@/app/components/cl/AppHeader";
import ClSignIn from "@/app/components/cl/ClSignIn";
import ClApplyForm from "@/app/components/cl/ClApplyForm";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsAccessPage() {
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

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(32px,4vw,56px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[clamp(20px,2.4vw,32px)]">
          {/* ---------- Request access ---------- */}
          {/* id="request": ClGate's secondary button deep-links straight to
              this card, which matters on a narrow screen where the two panels
              stack and the request card is the one below the fold. */}
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
              <Settled
                title="We have your request"
                note="A person reads every one, usually within a week. You’ll hear back by email."
                href="/listings"
                cta="Look around meanwhile"
              />
            ) : user ? (
              <>
                <Head
                  title="Request access"
                  note="A member has to vouch for you."
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
                  title="Request access"
                  note="A member has to vouch for you."
                />
                {/* The honest version of the design's cold form: it takes two
                    steps, and pretending otherwise would collect a name and an
                    email into a form with nowhere to post them. */}
                <ol
                  className="mt-6 flex flex-col gap-3 text-[13.5px] leading-[1.55]"
                  style={{ color: "var(--cl-body)" }}
                >
                  <Step n={1} label="Create an account — email and a password." />
                  <Step n={2} label="Tell us who you are and who’s vouching for you." />
                  <Step n={3} label="A person reads it, usually within a week." />
                </ol>
                <Link href="/signup" className="cl-pill mt-7">
                  Create an account
                </Link>
                <p
                  className="mt-4 text-[12.5px]"
                  style={{ color: "var(--cl-faint)" }}
                >
                  Free, and it lets you look around while you wait.
                </p>
              </>
            )}
          </section>

          {/* ---------- Sign in ---------- */}
          <section className="cl-panel flex flex-col p-[clamp(24px,3vw,44px)]">
            <Wordmark className="text-[18px] leading-none" />

            <div className="flex flex-1 flex-col justify-center">
              {user ? (
                <div className="py-8">
                  <div className="text-[clamp(21px,2.2vw,27px)] font-medium tracking-[-0.02em]">
                    You&rsquo;re signed in
                  </div>
                  <p
                    className="mt-2.5 text-[13.5px] leading-[1.55]"
                    style={{ color: "var(--cl-muted)" }}
                  >
                    Signed in as {user.email}.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <Link href="/listings" className="cl-pill">
                      Browse listings
                    </Link>
                    {/* A POST route, so this is a form and not a link — a
                        prefetched or crawled GET would sign people out. */}
                    <form action="/auth/sign-out" method="post">
                      <button type="submit" className="cl-ghost">
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
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

            {!user && (
              <div
                className="mt-[18px] border-t pt-[18px] text-[12.5px]"
                style={{
                  borderColor: "var(--cl-hairline)",
                  color: "var(--cl-muted)",
                }}
              >
                Not a member yet?{" "}
                <Link href="/signup" style={{ color: "var(--cl-ink)" }}>
                  Request access
                </Link>
              </div>
            )}
          </section>
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

// The two states where there is nothing to fill in.
function Settled({
  title,
  note,
  href,
  cta,
}: {
  title: string;
  note: string;
  href: string;
  cta: string;
}) {
  return (
    <>
      <Head title={title} note={note} />
      <Link href={href} className="cl-pill mt-7">
        {cta}
      </Link>
    </>
  );
}
