// Screen 10 — Account settings, in the Classifieds system.
//
// The design's left rail and label/value rows, over the columns that actually
// exist. This is the screen where the gap between a mockup and a product is
// widest, so it is worth being precise about what was kept and what was cut.
//
// KEPT, because there is a column and a working write path behind it:
//   Name, Neighborhood, Bio, LinkedIn  → accounts, via updateProfile (own row)
//   Email                              → auth, shown read-only
//   Password                           → the real /reset-request flow
//   Who you've vouched for             → get_my_connections() (0024), which is
//                                        keyed on auth.uid() and so answers only
//                                        for the person reading it
//   Leave the network                  → no self-serve delete exists; this says
//                                        so and gives the human route
//
// CUT, and this is the honest half:
//   "Weekly digest of new listings"    → no notifications system, no column, no
//                                        sender. A toggle here would be a switch
//                                        wired to nothing that people would set
//                                        once and then wonder why no email came.
//   "Show my name on listings"         → the byline is denormalized onto every
//                                        listing at write time (0006) and named
//                                        sponsorship is the trust mechanic. A
//                                        switch that turned it off would have to
//                                        rewrite history across listings AND
//                                        contradict the product's central claim.
//                                        Not a settings toggle — a strategy
//                                        change.
//
// A settings screen is the worst place in a product to draw a control that does
// nothing, because the whole promise of the screen is that flipping things
// changes them.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";

export const dynamic = "force-dynamic"; // session state varies per request.

type Connection = {
  direction: "sponsor" | "sponsee";
  account_id: string;
  name: string;
  is_primary: boolean;
};

export default async function ClassifiedsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("accounts")
    .select("name, neighborhood, bio, linkedin_url, is_member")
    .eq("id", user.id)
    .maybeSingle<{
      name: string | null;
      neighborhood: string | null;
      bio: string | null;
      linkedin_url: string | null;
      is_member: boolean;
    }>();

  // Own connections only — the function is keyed on auth.uid(), so there is no
  // way to ask it about anyone else. Non-members simply have none yet.
  const { data: connections } = await supabase.rpc("get_my_connections");
  const vouchedFor = ((connections ?? []) as Connection[]).filter(
    (c) => c.direction === "sponsee"
  );
  const vouchedBy = ((connections ?? []) as Connection[]).filter(
    (c) => c.direction === "sponsor"
  );

  return (
    <>
      <AppHeader active="profile" />

      <main className="mx-auto grid w-full max-w-[900px] grid-cols-[180px_1fr] items-start gap-[clamp(24px,3vw,48px)] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)] max-[720px]:grid-cols-1 max-[720px]:gap-6">
        {/* The design's rail. Every entry is an anchor to a section that exists
            on this page — the mockup's five tabs included Notifications and
            Privacy, which have nothing to show. */}
        <nav className="flex flex-col gap-1 text-[13.5px] max-[720px]:flex-row max-[720px]:flex-wrap">
          <span className="cl-rail-row cl-rail-row-on">Account</span>
          <a href="#vouching" className="cl-rail-row">
            Vouching
          </a>
          <a href="#leaving" className="cl-rail-row">
            Leaving
          </a>
        </nav>

        <div className="min-w-0">
          <h1 className="mb-6 text-[clamp(20px,2.2vw,26px)] font-medium tracking-[-0.02em]">
            Account
          </h1>

          <div className="flex flex-col">
            <Row label="Name" value={account?.name} href="/profile/edit" />
            {/* Read-only: changing an email is an auth operation with a
                confirmation round-trip, not a profile field. */}
            <Row label="Email" value={user.email ?? null} />
            <Row
              label="Neighborhood"
              value={account?.neighborhood}
              href="/profile/edit"
            />
            <Row label="Bio" value={account?.bio} href="/profile/edit" />
            <Row
              label="LinkedIn"
              value={account?.linkedin_url}
              href="/profile/edit"
            />
            <Row label="Password" value="••••••••" href="/reset-request" cta="Reset" />
          </div>

          {/* ---------- Vouching ---------- */}
          <div id="vouching" className="cl-grouplabel mt-8 mb-3.5">
            Who you&rsquo;ve vouched for
          </div>
          {vouchedFor.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: "var(--cl-muted)" }}>
              {account?.is_member
                ? "Nobody yet. Bringing someone in is how the network grows."
                : "Members can vouch for people. You’ll be able to once you’re in."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {vouchedFor.map((c) => (
                <li key={c.account_id} className="flex items-center gap-3">
                  <div className="cl-avatar h-[34px] w-[34px]" aria-hidden="true" />
                  <span className="text-[14px]">{c.name}</span>
                </li>
              ))}
            </ul>
          )}

          {vouchedBy.length > 0 && (
            <>
              <div className="cl-grouplabel mt-7 mb-3.5">Who vouched for you</div>
              <ul className="flex flex-col gap-3">
                {vouchedBy.map((c) => (
                  <li key={c.account_id} className="flex items-center gap-3">
                    <div className="cl-avatar h-[34px] w-[34px]" aria-hidden="true" />
                    <span className="text-[14px]">
                      {c.name}
                      {c.is_primary && (
                        <span
                          className="ml-2 text-[12.5px]"
                          style={{ color: "var(--cl-muted)" }}
                        >
                          brought you in
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ---------- Leaving ---------- */}
          <div id="leaving" className="cl-grouplabel mt-9 mb-3.5">
            Leaving the network
          </div>
          <p
            className="max-w-[52ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            There&rsquo;s no self-serve delete yet. Email us and a person will
            remove your account and your listings — usually the same day.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href="mailto:hello@manhattanite.com" className="cl-ghost">
              Email us
            </a>
            {/* POST, not a link — a prefetched GET would sign people out. */}
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="cl-quiet px-2 py-[11px]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  href,
  cta = "Edit",
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
  cta?: string;
}) {
  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-5 border-t py-[18px]"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <div className="min-w-0">
        <div className="text-[14.5px]">{label}</div>
        <div
          className="mt-1 truncate text-[13px]"
          style={{ color: value ? "var(--cl-muted)" : "var(--cl-disabled)" }}
        >
          {value || "Not set"}
        </div>
      </div>
      {href && (
        <Link href={href} className="cl-quiet text-[13px]">
          {cta}
        </Link>
      )}
    </div>
  );
}
