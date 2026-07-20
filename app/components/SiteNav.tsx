// SiteNav — the global, tier-aware navigation spine. (Navigation slice.)
//
// Server Component: reads its own session the same way app/profile/page.tsx
// does, so the layout can mount it with no prop drilling. It derives a single
// `viewer` tier and renders only the links that tier can actually use —
// the nav makes the trust wall obvious by never showing a locked door
// (no "Post a listing" for guests/accounts, etc.).
//
// Tier model (decided 2026-06-09, decisions.md): the trust gate is at the
// ACTION layer, not the viewing layer.
//   - guest   (logged out) : Listings · Log in · Create account
//   - account (Tier 1)     : Listings · Apply for membership · Profile · Log out
//   - member  (Tier 2)     : Listings · Post a listing · My listings · Profile · Log out
//
// Visual (design foundation, Slice 1): the light "inside" product nav from the
// v8 mockup — full-bleed 40px gutter, 22px vertical, wordmark left, small-caps
// links and the avatar right, closed by a 1px ink/16% hairline. Restyle only;
// the links and the tier logic below are untouched.
//
// The nav stands down entirely on "/" — the dark landing carries its own nav
// overlaid on the hero photograph. That decision lives in NavGate, the client
// wrapper this component is mounted inside; it cannot be made here, because a
// Server Component in the root layout does not re-render on client-side
// navigation and would strand a landing-page visitor with no nav for the rest
// of their session.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/app/components/AccountMenu";

type Viewer = "guest" | "account" | "member";

// Shared small-caps link treatment used across the app's secondary links.
//
// The group-hover/nav variants belong to the header's hover fill: when the bar
// goes park green, every piece of type on it has to cross to bone or it
// disappears into the fill. The group is NAMED so AccountMenu — a separate
// component further down the tree — can join the same transition.
const LINK_BASE = "mh-label transition-colors duration-[400ms]";
const LINK_QUIET = `${LINK_BASE} text-ink/70 hover:text-ink group-hover/nav:text-bone/70 group-hover/nav:hover:text-bone`;
const LINK_EMPHASIS = `${LINK_BASE} text-ink group-hover/nav:text-bone`; // the tier's conversion CTA

export default async function SiteNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewer: Viewer = "guest";
  let isAdmin = false;
  let name: string | null = null;
  if (user) {
    // RLS "read own row" allows this. A missing row (signup race) falls back
    // to 'account' — logged in but not yet confirmed a member.
    const { data: account } = await supabase
      .from("accounts")
      .select("is_member, role, name")
      .eq("id", user.id)
      .single<{ is_member: boolean; role: string; name: string | null }>();
    viewer = account?.is_member ? "member" : "account";
    // Admin rides on top of the tier — the Admin link lives in the account
    // menu and only renders for role='admin'. The /admin routes gate
    // themselves (and RLS underneath); this is just nav.
    isAdmin = account?.role === "admin";
    name = account?.name ?? null;
  }

  return (
    <header className="mh-navbar group/nav border-b border-ink/16">
      {/* The hover fill, ported from In Common With's header: a full-bleed
          panel, invisible at rest, fading to opaque over 400ms when the
          pointer enters the bar anywhere.

          Park green rather than a warmer bone: this bar already sits ON bone,
          so fading in a near-neighbour would be a change nobody sees. Green is
          also already the site's other surface — the landing and the auth
          screens — so the nav briefly becoming "outside" is a move the system
          already knows how to make. */}
      <div className="mh-navbar-fill bg-park" aria-hidden="true" />

      <nav className="relative mh-gutter py-[22px] flex items-center justify-between gap-6">
        {/* Wordmark — the single canonical wordmark now that interior pages
            drop their centered one. Clicking it takes you back "outside". */}
        <Link
          href="/"
          className="font-serif text-[24px] leading-none text-ink transition-colors duration-[400ms] group-hover/nav:text-bone"
        >
          Manhattan<span className="italic">ite</span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-[34px] flex-wrap justify-end">
          {/* Listings is visible to every tier (guests get the teaser). */}
          <Link href="/listings" className={LINK_QUIET}>
            Listings
          </Link>

          {viewer === "guest" && (
            <>
              <Link href="/login" className={LINK_QUIET}>
                Log in
              </Link>
              <Link href="/signup" className={LINK_EMPHASIS}>
                Create account
              </Link>
            </>
          )}

          {viewer === "account" && (
            <>
              {/* The conversion CTA for Tier 1 — emphasized. Profile + log out
                  live in the account menu. */}
              <Link href="/apply" className={LINK_EMPHASIS}>
                Apply for membership
              </Link>
              <AccountMenu name={name} isMember={false} isAdmin={isAdmin} />
            </>
          )}

          {viewer === "member" && (
            <>
              {/* Primary action stays in the bar; My listings / Profile /
                  Admin / Log out move into the account menu. */}
              <Link href="/listings/new" className={LINK_QUIET}>
                Post a listing
              </Link>
              <AccountMenu name={name} isMember={true} isAdmin={isAdmin} />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
