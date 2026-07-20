// /admin/members — read-only member directory. (Admin Console slice.)
//
// Server Component, role='admin' only. One row per member: name, neighborhood,
// occupation, primary sponsor, joined date. Strictly a view — member admin
// (rename, de-member, sponsor edits) is out of scope.
//
// Sourcing notes:
//   - occupation lives on the APPLICATION (accounts never got the column), so
//     it comes from the member's approved application when one exists. The
//     founder and seed-phase members admitted by SQL have none — renders as —.
//   - "primary sponsor" is accounts.sponsor_id (the inviter pointer kept by
//     0012), embedded via the self-FK. The full sponsor list lives in the
//     locked-down sponsorships table; the one-name view is enough here.
//   - "joined" = the approved application's reviewed_at when there is one,
//     else the account's created_at (founder, hand-seeded members).

import { requireAdmin } from "@/lib/admin/guard";
import PageShell from "@/app/components/PageShell";

export const dynamic = "force-dynamic"; // session state varies per request.

type MemberRow = {
  id: string;
  name: string | null;
  neighborhood: string | null;
  created_at: string;
  sponsor_id: string | null;
  applications: {
    status: string;
    occupation: string | null;
    reviewed_at: string | null;
  }[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminMembersPage() {
  const { supabase } = await requireAdmin();

  // The primary sponsor is fetched in a SECOND query rather than a self-join
  // embed. PostgREST needs a constraint-name hint to disambiguate a self-
  // referential FK (accounts.sponsor_id → accounts.id), and the live
  // constraint isn't named accounts_sponsor_id_fkey — the embed errored and
  // dropped the whole result. Two plain queries are robust to the FK's name.
  const { data: members } = await supabase
    .from("accounts")
    .select(
      // Disambiguate the reverse embed: applications now has TWO FKs to
      // accounts (account_id = applicant, sponsor_id = inviter, added in 0020),
      // so a bare applications(...) is ambiguous and PostgREST drops the whole
      // result. Join via the applicant FK — these are the member's OWN apps.
      "id, name, neighborhood, created_at, sponsor_id, applications!applications_account_id_fkey(status, occupation, reviewed_at)"
    )
    .eq("is_member", true)
    .order("created_at", { ascending: true })
    .returns<MemberRow[]>();

  // Resolve sponsor names in one round-trip. Admin read-all (0002) lets us
  // read every referenced account.
  const sponsorIds = [
    ...new Set((members ?? []).map((m) => m.sponsor_id).filter((id): id is string => Boolean(id))),
  ];
  const sponsorNameById = new Map<string, string | null>();
  if (sponsorIds.length > 0) {
    const { data: sponsors } = await supabase
      .from("accounts")
      .select("id, name")
      .in("id", sponsorIds)
      .returns<{ id: string; name: string | null }[]>();
    for (const s of sponsors ?? []) sponsorNameById.set(s.id, s.name);
  }

  return (
    <PageShell
      label="Member directory"
      title={<>Everyone inside.</>}
      backHref="/admin"
      backLabel="Admin"
    >

        {!members || members.length === 0 ? (
          <p className="text-center font-serif text-2xl text-ink py-10">
            No members yet.
          </p>
        ) : (
          <ul className="space-y-px">
            {members.map((member) => {
              const approved = member.applications.find(
                (a) => a.status === "approved"
              );
              const joined = approved?.reviewed_at ?? member.created_at;
              const sponsorName = member.sponsor_id
                ? sponsorNameById.get(member.sponsor_id) ?? null
                : null;
              return (
                <li
                  key={member.id}
                  className="border-t border-ink/10 py-8 last:border-b"
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <h2 className="font-serif font-light text-2xl tracking-tight text-ink">
                      {member.name ?? "(no name)"}
                    </h2>
                    <p className="text-[11px] tracking-[0.22em] uppercase text-slate whitespace-nowrap">
                      Joined {formatDate(joined)}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] tracking-[0.22em] uppercase text-slate">
                    {[member.neighborhood, approved?.occupation]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-3 text-sm text-slate">
                    {sponsorName
                      ? `Brought in by ${sponsorName}`
                      : "No sponsor on record (seed account)"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
    </PageShell>
  );
}
