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

// One route in this group is not a product screen and must not carry product
// navigation: the landing. It is a public page addressed to someone who has
// never signed in, and offering them Saved, Post and Profile is offering three
// doors that are locked.
//
// It was two routes before the migration — the preview's own contents page sat
// here as well. The landing is now "/" rather than "/design/landing", so the
// set is down to the one entry.
const NAVLESS = new Set(["/"]);

export default function MobileTabBar() {
  const pathname = usePathname();

  if (NAVLESS.has(pathname)) return null;

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
