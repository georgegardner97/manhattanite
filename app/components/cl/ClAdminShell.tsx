// The frame every /admin screen sits in — Slice 3b.
//
// WHY A SHELL AND NOT FIVE COPIES. The console went from three screens to five
// in this slice, and the editorial versions each rebuilt their own header, back
// link and title block. That is how /admin/listings would have ended up looking
// like a different product from /admin/moderation.
//
// THE CONSOLE CARRIES ITS OWN NAV, and that is the answer to a problem this
// project has now hit four times: a screen that works with no way to reach it
// (/admin, /search, /listings/mine, and admin take-down itself). Five back-links
// to a dashboard is not navigation — it is four dead ends and a hub. So every
// admin screen lists every other one, and you can never be more than one click
// from any of them.
//
// AppHeader gets `admin` unconditionally here. That is not a lookup: requireAdmin
// has already run on the page above, so by the time this renders the viewer IS an
// admin. The prop stays a prop precisely so AppHeader can remain synchronous —
// making it async to read a role would flip eight prerendered-static routes to
// server-rendered and charge every visitor an auth round trip for a link one
// account sees. Extending the prop is the widening; replacing the mechanism is
// not.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";

export type ClAdminKey =
  | "dashboard"
  | "listings"
  | "moderation"
  | "applications"
  | "members";

// Order is the order George works in: everything, then the two queues that
// need a decision, then the directory he only reads.
const TABS: { key: ClAdminKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Overview", href: "/admin" },
  { key: "listings", label: "All listings", href: "/admin/listings" },
  { key: "moderation", label: "In review", href: "/admin/moderation" },
  { key: "applications", label: "Applications", href: "/admin/applications" },
  { key: "members", label: "Members", href: "/admin/members" },
];

export default function ClAdminShell({
  active,
  title,
  intro,
  children,
}: {
  active: ClAdminKey;
  title: string;
  /** One line under the title. Optional — the dashboard needs none. */
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader active="none" admin width="wide" />

      <main className="mx-auto w-full max-w-[1400px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(22px,2.6vw,34px)] pb-[clamp(32px,4vw,56px)]">
        <div className="cl-grouplabel mb-3">Admin</div>

        <nav
          className="mb-[clamp(20px,2.4vw,30px)] flex flex-wrap items-center gap-0.5 border-b pb-3 text-[13px]"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          {TABS.map((tab) => {
            const on = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className="rounded-full px-3 py-[7px]"
                style={
                  on
                    ? {
                        color: "var(--cl-ink)",
                        fontWeight: 500,
                        background: "var(--cl-fill-active)",
                      }
                    : { color: "var(--cl-muted)" }
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <h1 className="text-[clamp(21px,2.4vw,28px)] font-medium tracking-[-0.02em]">
          {title}
        </h1>
        {intro && (
          <p
            className="mt-2 max-w-[62ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            {intro}
          </p>
        )}

        <div className="mt-[clamp(20px,2.4vw,30px)]">{children}</div>
      </main>
    </>
  );
}
