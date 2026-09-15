"use client";

// Screen 12 — the phone's navigation, in the Classifieds system.
//
// The design's answer for a small screen is a top bar carrying only the
// wordmark and one control, with navigation moved to a bottom tab bar: Browse,
// Saved, Post, Inbox. AppHeader hides its nav below 600px; this is the other
// half of that arrangement.
//
// THREE TABS, NOT THE DESIGN'S FOUR:
//
//   Inbox is not here. In-app messaging is not built — the design file labels
//   its own Messages screen "not built yet, kept for reference" — and a tab
//   leading nowhere is worse on a phone than on a desktop, where at least the
//   rest of the nav is visible beside it. Profile took that slot.
//
//   Saved left on 2026-08-27, with the desktop nav and for the same reason
//   (George: saved posts belong in your profile, not the main menu). This bar
//   mirrors the header, so it could not keep a tab the header had dropped.
//   Browse · Post · Profile is the whole product on a phone, and search is on
//   Browse itself as of the same day.
//
// Why sticky rather than fixed: a fixed bar overlays the last line of every
// page and needs a matching bottom padding on every screen to compensate — one
// that is always slightly wrong. Sticky occupies real layout space at the end
// of the document and pins to the viewport bottom while there is more to
// scroll, which is the behavior without the bookkeeping.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { label: string; href: string; match: (p: string) => boolean }[] = [
  {
    label: "Browse",
    href: "/listings",
    // The detail screen is part of browsing — it is where the grid leads, and
    // a tab bar that goes blank when you open a listing loses your place. The
    // prefix covers /listings/[id]; the member-only routes under /listings
    // (new, mine, [id]/edit, [id]/contact) belong to the editorial system and
    // never mount this bar, so they cannot be caught by it.
    match: (p) => p.startsWith("/listings"),
  },
  { label: "Post", href: "/listings/new", match: (p) => p === "/listings/new" },
  {
    label: "Profile",
    href: "/profile",
    match: (p) => p === "/profile",
  },
];

// Two routes in this group are not product screens and must not carry product
// navigation. The first is the landing: a public page addressed to someone who
// has never signed in, and offering them Browse, Post and Profile is offering
// doors that are locked.
//
// THE SECOND IS /join/[token], FOR THE SAME REASON — SECOND INSTANCE (2026-09-15).
// An invitee arrives from a friend's email having never seen the site, and this
// bar put three locked doors under the one form they came to fill in; with the
// header's own nav that was six. It was missed because the rule was written as
// a Set of exact paths and the invitation is a dynamic segment, so the test is
// a prefix now rather than a lookup. The already-a-member branch of that screen
// loses the bar too, which is fine: its card offers Browse and Invite itself.
//
// (It was also once the preview's contents page, before the landing moved from
// "/design/landing" to "/".)
function isNavless(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/join/");
}

export default function MobileTabBar() {
  const pathname = usePathname();

  if (isNavless(pathname)) return null;

  return (
    <nav
      aria-label="Sections"
      className="cl-tabbar hidden max-[600px]:flex"
    >
      {TABS.map((tab) => {
        const on = tab.match(pathname);
        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className={on ? "cl-tabbar-on" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
