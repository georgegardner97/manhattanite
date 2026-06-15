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
// Visual: matches the editorial look — bone surface, ink wordmark in font-serif,
// mh-link hover underline on the small-caps links. This is structure, not a
// restyle.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/app/components/AccountMenu";

type Viewer = "guest" | "account" | "member";

// Shared small-caps link treatment used across the app's secondary links.
const LINK_BASE = "mh-link text-[11px] tracking-[0.22em] uppercase";
const LINK_QUIET = `${LINK_BASE} text-slate hover:text-ink`;
const LINK_EMPHASIS = `${LINK_BASE} text-ink`; // the tier's conversion CTA

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
    <header className="border-b border-ink/10">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
        {/* Wordmark — the single canonical wordmark now that interior pages
            drop their centered one. */}
        <Link
          href="/"
          className="font-serif text-2xl tracking-tighter leading-none text-ink"
        >
          Manhattan<span className="italic">ite</span>
        </Link>

        <div className="flex items-center gap-5 sm:gap-7 flex-wrap justify-end">
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
