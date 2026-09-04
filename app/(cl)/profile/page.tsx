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
//   Sign out                           → the only one in the product
//   Closing your account               → no self-serve delete exists; this says
//                                        so and gives the human route, which is
//                                        what makes the /terms and /privacy
//                                        promises true
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
//
// ---------------------------------------------------------------------------
// PROMOTED TO /profile 2026-08-26 (Slice 2), with two changes to what was drawn.
//
// 1. THE PHOTO ROW IS BACK. Screen 10 has no profile photo. Shipping it as
//    drawn would have removed a working feature — 0023 added avatar_path,
//    AvatarUpload has been live since, and the 2026-06-08 decision put a real
//    photo here deliberately as the identity surface. See ClAvatarUpload.
//
// 2. /profile AND /profile/edit COLLAPSED INTO THIS ONE SCREEN. The design puts
//    every field on one page with inline rows, so the rows now carry their own
//    write paths (ClProfileForm) and /profile/edit is a redirect here rather
//    than a deleted route — an old link in an email still lands somewhere.
//
// ---------------------------------------------------------------------------
// 2026-08-27. The rail is Account · My listings · Saved · Vouching.
//
// "Leaving" stopped being a rail entry — a peer of the other three is a strange
// fourth thing to offer someone — but its two contents survive at the foot of
// Account: the product's ONLY sign-out, and the account-closure route that
// /terms and /privacy both depend on. See the section itself.
//
// MY LISTINGS IS NEW HERE, AND IT IS A BUG FIX, NOT POLISH. /listings/mine had
// no reachable entry point anywhere in the Classifieds system. Third time:
// /admin, /search, this. The lesson is in the section comment.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClProfileForm from "@/app/components/cl/ClProfileForm";

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
    .select("name, neighborhood, bio, avatar_path, linkedin_url, is_member, role")
    .eq("id", user.id)
    .maybeSingle<{
      name: string | null;
      neighborhood: string | null;
      bio: string | null;
      avatar_path: string | null;
      linkedin_url: string | null;
      is_member: boolean;
      role: string | null;
    }>();

  // Public bucket → a plain URL, no signing.
  const avatarUrl = account?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(account.avatar_path).data
        .publicUrl
    : null;

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
      {/* This screen is the way into /admin. AppHeader carries the link and
          only this page passes the flag, because only this page already reads
          the account row — see the note in AppHeader.tsx. The /admin routes
          gate themselves and RLS gates the tables underneath; this is nav. */}
      <AppHeader active="profile" admin={account?.role === "admin"} />

      <main className="mx-auto grid w-full max-w-[900px] grid-cols-[180px_1fr] items-start gap-[clamp(24px,3vw,48px)] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)] max-[720px]:grid-cols-1 max-[720px]:gap-6">
        {/* The design's rail. Every entry is an anchor to a section that exists
            on this page — the mockup's five tabs included Notifications and
            Privacy, which have nothing to show. */}
        <nav className="flex flex-col gap-1 text-[13.5px] max-[720px]:flex-row max-[720px]:flex-wrap">
          <span className="cl-rail-row cl-rail-row-on">Account</span>
          <a href="#mine" className="cl-rail-row">
            My listings
          </a>
          <a href="#saved" className="cl-rail-row">
            Saved
          </a>
          {account?.is_member && (
            <a href="#invite" className="cl-rail-row">
              Invite
            </a>
          )}
          <a href="#vouching" className="cl-rail-row">
            Vouching
          </a>
        </nav>

        <div className="min-w-0">
          <h1 className="mb-6 text-[clamp(20px,2.2vw,26px)] font-medium tracking-[-0.02em]">
            Account
          </h1>

          <ClProfileForm
            userId={user.id}
            email={user.email ?? ""}
            name={account?.name ?? null}
            neighborhood={account?.neighborhood ?? null}
            bio={account?.bio ?? null}
            linkedinUrl={account?.linkedin_url ?? null}
            avatarPath={account?.avatar_path ?? null}
            avatarUrl={avatarUrl}
          />

          {/* ---------- Signing out, and the way out of the network ----------
              There was a "Leaving" section here, in the rail as a peer of
              Account, Saved and Vouching. George, 2026-08-27: leaving is not a
              fourth thing to offer someone. The section went. The two things
              inside it did not, and neither could.

              THIS IS THE ONLY SIGN-OUT IN THE PRODUCT. Removing the section
              would have removed the ability to sign out, so it lands here as a
              quiet control at the foot of the Account rows. Still a POST: a
              prefetched GET would sign people out on hover.

              THE ACCOUNT-CLOSURE LINE IS LOAD-BEARING COPY, not filler. /terms
              says "You can close your account at any time" and /privacy says
              "When you ask us to delete your account, we delete…" — the email
              route below is the thing that makes both sentences true. Deleting
              it would leave the policy overclaiming, which is the same error
              corrected on /privacy on 26 Aug. It keeps id="leaving" so an old
              /profile#leaving link still lands on the text it described. */}
          <div
            className="mt-8 border-t pt-6"
            style={{ borderColor: "var(--cl-hairline)" }}
          >
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="cl-ghost">
                Sign out
              </button>
            </form>
            <p
              id="leaving"
              className="mt-4 max-w-[52ch] text-[13px] leading-[1.6]"
              style={{ color: "var(--cl-faint)" }}
            >
              Leaving for good? There&rsquo;s no self-serve delete yet.{" "}
              <a
                href="mailto:info@manhattanite.com"
                className="underline underline-offset-2"
              >
                Email us
              </a>{" "}
              and a person will remove your account and your listings &mdash;
              usually the same day.
            </p>
          </div>

          {/* ---------- My listings ----------
              THE ONLY WAY INTO /listings/mine (George, 2026-08-27). The page
              has worked since Slice 5; nothing in the Classifieds system linked
              to it. Its only two doors were SiteFooter (via PageShell) and
              AccountMenu (via SiteNav), both editorial — and after the
              migration the only (ed) routes left are the four admin pages. So
              the only way into a member's own listings rendered on screens only
              the founder can reach, which is why only the founder found it.

              Third instance of one failure: /admin, then /search, now this.
              When a design system is retired, the surviving routes need their
              entry points re-homed. "The route still works" is not the same
              claim as "someone can get there." */}
          <div id="mine" className="cl-grouplabel mt-9 mb-3.5">
            My listings
          </div>
          <p
            className="max-w-[52ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            Everything you&rsquo;ve posted &mdash; live, waiting on a moderator,
            and archived. Edit one, or take it down, from there.
          </p>
          <div className="mt-4">
            <Link href="/listings/mine" className="cl-ghost">
              View my listings
            </Link>
          </div>

          {/* ---------- Saved ----------
              THE ONLY WAY INTO /saved (George, 2026-08-27): "'Saved' should not
              be a main menu option. You should be able to see your saved posts
              but only in your profile." So it left AppHeader's nav and the
              phone's tab bar, and lands here.

              No count. The save set lives in the browser, not in a table — see
              SavedGrid — so a server-rendered number here would either be wrong
              or force this page to become a client component to find out. The
              screen it links to already knows. */}
          <div id="saved" className="cl-grouplabel mt-9 mb-3.5">
            Saved
          </div>
          <p
            className="max-w-[52ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            The listings you&rsquo;ve saved while browsing. They&rsquo;re kept
            in this browser, so they won&rsquo;t follow you to another device.
          </p>
          <div className="mt-4">
            <Link href="/saved" className="cl-ghost">
              View saved listings
            </Link>
          </div>

          {/* ---------- Invite ----------
              THE ONLY WAY INTO /invite. The route has worked since the invite
              slice; nothing in the product linked to it, so the only way a
              member could bring someone in was to type the address. That made
              the growth loop unreachable by the people it is for — the fourth
              instance of the orphaned-route pattern (/admin, /search,
              /listings/mine, now this).

              It lands here rather than in AppHeader because the header's nav
              is deliberately two items and the slot Saved vacated was left
              vacant on purpose. /profile is the member's own screen and
              already carries every other member-only door. Whether inviting
              earns a place in the header is George's call, not a side effect
              of adding the first link.

              Members only: RLS (invites_insert_own) refuses a Tier-1 insert
              and the page itself redirects them to /profile, so offering the
              button to an account holder would be a door into a wall. */}
          {account?.is_member && (
            <>
              <div id="invite" className="cl-grouplabel mt-9 mb-3.5">
                Bring someone in
              </div>
              <p
                className="max-w-[52ch] text-[13.5px] leading-[1.6]"
                style={{ color: "var(--cl-muted)" }}
              >
                Invite someone you&rsquo;d vouch for. They get a link from you,
                join through it, and you&rsquo;re named as the member who
                vouched for them.
              </p>
              <div className="mt-4">
                <Link href="/invite" className="cl-pill">
                  Invite someone
                </Link>
              </div>
            </>
          )}

          {/* ---------- Vouching ---------- */}
          <div id="vouching" className="cl-grouplabel mt-9 mb-3.5">
            Who you&rsquo;ve vouched for
          </div>
          {vouchedFor.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: "var(--cl-muted)" }}>
              {account?.is_member
                ? "Nobody yet. Bringing someone in is how the network grows."
                : "Members can vouch for people. You’ll be able to once you’re in."}
            </p>
          ) : (
            <ConnectionList people={vouchedFor} />
          )}

          {vouchedBy.length > 0 && (
            <>
              <div className="cl-grouplabel mt-7 mb-3.5">Who vouched for you</div>
              <ConnectionList people={vouchedBy} primaryLabel="brought you in" />
            </>
          )}
        </div>
      </main>
    </>
  );
}

/**
 * One vouching list.
 *
 * BOTH directions render through this. They were duplicated markup until
 * 2026-08-27, which is exactly how one of them could have got linked names and
 * the other kept plain text forty pixels below it. There is now one row to fix.
 *
 * THE WHOLE ROW IS THE TARGET, avatar included, rather than the 14px name. The
 * avatar placeholder stays aria-hidden, so a screen reader announces the person
 * once and not twice.
 *
 * THIS EXPOSES NOTHING NEW. The names already rendered on this page as text;
 * the link only makes them behave the way the same name already behaves in a
 * listing byline ("Listed by Anna" goes to her profile). /profile is
 * member-only and /members/[id] answers a guest with the members-only wall, so
 * every viewer of this list could already reach the destination. One of the two
 * treatments was wrong, and it was this one.
 *
 * `primaryLabel` is passed only for the sponsor direction: "brought you in"
 * is true of the person who vouched for you and backwards on someone you
 * brought in yourself.
 */
function ConnectionList({
  people,
  primaryLabel,
}: {
  people: Connection[];
  primaryLabel?: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {people.map((c) => (
        <li key={c.account_id}>
          <Link
            href={`/members/${c.account_id}`}
            className="flex items-center gap-3 py-1"
          >
            <div className="cl-avatar h-[34px] w-[34px]" aria-hidden="true" />
            <span className="text-[14px]">
              {c.name}
              {primaryLabel && c.is_primary && (
                <span
                  className="ml-2 text-[12.5px]"
                  style={{ color: "var(--cl-muted)" }}
                >
                  {primaryLabel}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
