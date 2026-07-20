"use client";

// NavGate — decides whether the global nav is on screen, on the client.
//
// The landing page carries its own nav overlaid on the hero photograph, so
// SiteNav must stand down on "/" and only there.
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

export default function NavGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
