"use client";

// NavGate — decides whether the global nav is on screen, on the client.
//
// SiteNav stands down on the five THRESHOLD routes, which sit on the landing's
// dark side and carry only the centered wordmark AuthShell renders. The light,
// tier-aware product nav on a park-ground page was both a visual seam and a
// contradiction: these screens exist because you are not inside yet.
//
// TWO ENTRIES LEFT THIS SET IN THE 2026-08-18 MIGRATION, and neither was
// deleted for tidiness — both stopped being reachable. SiteNav is now rendered
// by app/(ed)/layout.tsx rather than the root layout, so it only ever mounts on
// editorial routes. "/" is the Classifieds landing and "/design" is the preview
// area; neither is in the (ed) group, so neither can render this gate at all.
// What remains is the one job it still has to do on the client.
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
  "/login",
  "/signup",
  "/reset-request",
  "/reset-password",
  "/apply",
]);

export default function NavGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (NAVLESS.has(pathname)) return null;
  return <>{children}</>;
}
