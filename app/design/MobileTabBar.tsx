"use client";

// Screen 12 — the phone's navigation, in the Classifieds system.
//
// The design's answer for a small screen is a top bar carrying only the
// wordmark and one control, with navigation moved to a bottom tab bar: Browse,
// Saved, Post, Inbox. AppHeader hides its nav below 600px; this is the other
// half of that arrangement.
//
// TWO CHANGES FROM THE DESIGN'S FOUR TABS:
//
//   Inbox is not here. In-app messaging is not built — the design file labels
//   its own Messages screen "not built yet, kept for reference" — and a tab
//   leading nowhere is worse on a phone than on a desktop, where at least the
//   rest of the nav is visible beside it.
//
//   Profile takes the fourth slot instead, matching the desktop nav and the
//   design's own first phone frame, which lists Browse / Saved / Post /
//   Profile.
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
    href: "/design/browse",
    // The detail screen is part of browsing — it is where the grid leads, and
    // a tab bar that goes blank when you open a listing loses your place.
    match: (p) => p.startsWith("/design/browse") || p.startsWith("/design/listings"),
  },
  { label: "Saved", href: "/design/saved", match: (p) => p === "/design/saved" },
  { label: "Post", href: "/design/post", match: (p) => p === "/design/post" },
  {
    label: "Profile",
    href: "/design/settings",
    match: (p) => p === "/design/settings",
  },
];

// Two routes in this subtree are not product screens and must not carry product
// navigation: the landing is a public page addressed to someone who has never
// signed in — offering them Saved, Post and Profile is offering three doors
// that are locked — and /design is the preview's own contents page.
const NAVLESS = new Set(["/design", "/design/landing"]);

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
