// /admin — the dashboard. (Admin Console slice.)
//
// Server Component, role='admin' only (requireAdmin: no session → /login,
// non-admin → notFound). Counts run as the signed-in admin, so the admin RLS
// policies are what make the numbers complete: accounts/members via 0002's
// read-all, applications via 0007's, listings via 0015's listings_admin_read_all
// (before 0015 runs, the listings figure quietly shows published rows only).
//
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";

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
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Admin
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            The state of the network.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        <dl className="grid grid-cols-2 gap-px bg-ink/10 border border-ink/10">
          {stats.map((stat) => (
            // Odd stat count: the last cell spans the row so the grid stays
            // a clean block.
            <div
              key={stat.label}
              className="bg-bone p-8 text-center last:odd:col-span-2"
            >
              <dd className="font-serif font-light text-5xl text-ink">
                {stat.value.toLocaleString("en-US")}
              </dd>
              <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-slate">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-16 space-y-6 text-center">
          <p>
            <Link
              href="/admin/applications"
              className="mh-link text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Review applications &rarr;
            </Link>
          </p>
          <p>
            <Link
              href="/admin/moderation"
              className="mh-link text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Review listings &rarr;
            </Link>
          </p>
          <p>
            <Link
              href="/admin/members"
              className="mh-link text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Member directory &rarr;
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
