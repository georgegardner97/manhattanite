// /admin — the console overview, in the Classifieds system. (Slice 3b.)
//
// Ported from the editorial version, which was the last screen still rendering
// PageShell + ArrowLink. The stat tiles worked and they stay; what changed is
// the system they are drawn in and the fact that the console now has a nav of
// its own (ClAdminShell) rather than five back-links to here.
//
// Counts run as the signed-in admin, so the admin RLS policies are what make
// the numbers complete: accounts/members via 0002's read-all, applications via
// 0007's, listings via 0015's listings_admin_read_all.
//
// THE TWO LISTING NUMBERS ARE DIFFERENT QUESTIONS and the labels have to say so.
// "Listings" is everything that exists, at every status, and lands on the
// directory. "In review" is what is waiting on a decision from you, and lands
// on the queue. Before Slice 3b only the second had a screen at all.

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  const [accounts, members, listings, applicationsPending, listingsPending, live] =
    await Promise.all([
      supabase.from("accounts").select("id", { count: "exact", head: true }),
      supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("is_member", true),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
    ]);

  const stats: { label: string; value: number; href?: string }[] = [
    { label: "Accounts", value: accounts.count ?? 0 },
    { label: "Members", value: members.count ?? 0, href: "/admin/members" },
    { label: "Live listings", value: live.count ?? 0, href: "/admin/listings?status=published" },
    { label: "Listings, all statuses", value: listings.count ?? 0, href: "/admin/listings" },
    { label: "Listings in review", value: listingsPending.count ?? 0, href: "/admin/moderation" },
    {
      label: "Applications pending",
      value: applicationsPending.count ?? 0,
      href: "/admin/applications",
    },
  ];

  const waiting = (applicationsPending.count ?? 0) + (listingsPending.count ?? 0);

  return (
    <ClAdminShell
      active="dashboard"
      title="The state of the network."
      intro={
        waiting === 0
          ? "Nothing is waiting on you."
          : `${waiting} ${waiting === 1 ? "thing is" : "things are"} waiting on a decision from you.`
      }
    >
      {/* Six tiles, so the grid divides evenly at three columns and at two and
          there is no empty cell to paper over — the editorial version needed a
          filler div for exactly that reason. */}
      <dl className="grid max-w-[860px] grid-cols-3 gap-px max-[720px]:grid-cols-2 max-[420px]:grid-cols-1"
          style={{ background: "var(--cl-hairline)", border: "1px solid var(--cl-hairline)" }}>
        {stats.map((stat) => {
          const body = (
            <>
              <dd className="text-[34px] leading-none tabular-nums">
                {stat.value.toLocaleString("en-US")}
              </dd>
              <dt className="cl-grouplabel mt-2.5">{stat.label}</dt>
            </>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="block px-5 py-6"
              style={{ background: "var(--cl-surface)" }}
            >
              {body}
            </Link>
          ) : (
            <div
              key={stat.label}
              className="px-5 py-6"
              style={{ background: "var(--cl-surface)" }}
            >
              {body}
            </div>
          );
        })}
      </dl>
    </ClAdminShell>
  );
}
