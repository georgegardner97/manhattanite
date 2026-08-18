"use client";

// NavGate — decides whether the global nav is on screen, on the client.
//
// SiteNav stands down on the pages that carry their own chrome:
//   - "/"        the landing, whose nav is overlaid on the hero photograph.
//   - the five THRESHOLD routes (Slice 2), which sit on the landing's dark side
//     and carry only the centered wordmark AuthShell renders. The light,
//     tier-aware product nav on a park-ground page was both a visual seam and a
//     contradiction: these screens exist because you are not inside yet.
//

// This has to be a CLIENT decision. The first implementation read the pathname
// from a header set in proxy.ts, which is correct on a fresh page load and
// wrong forever after: the root layout is a Server Component and does not
// re-render on client-side navigation, so a visitor who landed on "/" and
// clicked through to /listings kept the "hide" answer for the rest of the SPA
// session and browsed with no nav at all. usePathname() re-renders on every
// navigation, which is exactly the subscription this needs.
//
// SiteNav itself stays a Server Component with its session and tier logic
// intact — it is rendered on the server and passed in as `children`, so this
// wrapper never sees or duplicates any of that.

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Exact matches only — no prefix test. "/listings" must keep its nav even
// though "/login" is in the set, and a prefix rule invites exactly that class
// of accident as routes are added.
const NAVLESS = new Set([
  "/",
  "/login",
  "/signup",
  "/reset-request",
  "/reset-password",
  "/apply",
]);

// The one prefix rule, and the reason it is safe where a general one is not:
// "/design" is a whole SUBTREE that belongs to a different design system and
// brings its own header (app/design/AppHeader.tsx). There is no route under it
// that wants the editorial nav, and — unlike the "/listings" vs "/login" trap
// above — nothing else in the app starts with these characters.
const NAVLESS_SUBTREE = "/design";

export default function NavGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (NAVLESS.has(pathname)) return null;
  if (pathname === NAVLESS_SUBTREE || pathname.startsWith(`${NAVLESS_SUBTREE}/`))
    return null;
  return <>{children}</>;
}
