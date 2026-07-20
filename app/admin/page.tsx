// /admin — the dashboard. (Admin Console slice.)
//
// Server Component, role='admin' only (requireAdmin: no session → /login,
// non-admin → notFound). Counts run as the signed-in admin, so the admin RLS
// policies are what make the numbers complete: accounts/members via 0002's
// read-all, applications via 0007's, listings via 0015's listings_admin_read_all
// (before 0015 runs, the listings figure quietly shows published rows only).
//
// Layout (design foundation, Slice 3): the standard light frame. George is the
// only user here, so this is a tidy, not a redesign — the stat tiles work and
// they stay; the page around them just stops being a one-off.

import { requireAdmin } from "@/lib/admin/guard";
import PageShell from "@/app/components/PageShell";
import ArrowLink from "@/app/components/ArrowLink";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  // Head-only counts, fired together.
  const [accounts, members, listings, pending, inReview] = await Promise.all([
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
  ]);

  const stats: { label: string; value: number }[] = [
    { label: "Accounts", value: accounts.count ?? 0 },
    { label: "Members", value: members.count ?? 0 },
    { label: "Listings", value: listings.count ?? 0 },
    { label: "Applications pending", value: pending.count ?? 0 },
    { label: "Listings in review", value: inReview.count ?? 0 },
  ];

  return (
    <PageShell label="Admin" title="The state of the network.">
      <dl className="mt-10 grid grid-cols-3 max-[860px]:grid-cols-2 gap-px bg-ink/12 border border-ink/12 max-w-[640px]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bone px-6 py-7">
            <dd className="font-serif font-normal text-[42px] leading-none text-ink tabular-nums">
              {stat.value.toLocaleString("en-US")}
            </dd>
            <dt className="mt-3 mh-label text-slate">{stat.label}</dt>
          </div>
        ))}
        {/* The hairlines are the container's background showing through a 1px
            grid gap, so an unfilled trailing cell renders as a grey block.
            Five stats leaves exactly one empty cell at both three columns and
            two, so one bone filler covers both. Revisit if the count changes. */}
        <div className="bg-bone" aria-hidden="true" />
      </dl>

      <div className="mt-10 flex flex-col items-start gap-3">
        <ArrowLink href="/admin/applications">Review applications</ArrowLink>
        <ArrowLink href="/admin/moderation">Review listings</ArrowLink>
        <ArrowLink href="/admin/members">Member directory</ArrowLink>
      </div>
    </PageShell>
  );
}
