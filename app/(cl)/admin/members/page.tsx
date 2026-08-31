// /admin/members — the member directory, in the Classifieds system. (Slice 3b.)
//
// A straight port of the editorial screen: same three queries, same sourcing
// notes, new frame. Strictly a view — member admin (rename, de-member, sponsor
// edits) stays out of scope.
//
// Sourcing notes, carried over because they are still the reason the code looks
// like this:
//   - occupation lives on the APPLICATION (accounts never got the column), so
//     it comes from the member's approved application when one exists. The
//     founder and seed-phase members admitted by SQL have none — renders as —.
//   - "primary sponsor" is accounts.sponsor_id (the inviter pointer kept by
//     0012), fetched in a SECOND query rather than a self-join embed: PostgREST
//     needs a constraint-name hint to disambiguate a self-referential FK and the
//     live constraint is not named accounts_sponsor_id_fkey, so the embed
//     errored and dropped the whole result.
//   - "joined" = the approved application's reviewed_at when there is one, else
//     the account's created_at (founder, hand-seeded members).
//
// Names are linked to /members/[id] now, which the editorial version could not
// do because that screen did not exist yet. Same reasoning as the vouching
// lists on /profile: a name that is a link in one place and plain text in
// another means one of the two is wrong.

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminMembersPage() {
  const { supabase } = await requireAdmin();

  const { data: members } = await supabase
    .from("accounts")
    .select(
      // Disambiguate the reverse embed: applications has TWO FKs to accounts
      // (account_id = applicant, sponsor_id = inviter, added in 0020), so a
      // bare applications(...) is ambiguous and PostgREST drops the whole
      // result. Join via the applicant FK — these are the member's OWN apps.
      "id, name, neighborhood, created_at, sponsor_id, applications!applications_account_id_fkey(status, occupation, reviewed_at)"
    )
    .eq("is_member", true)
    .order("created_at", { ascending: true })
    .returns<MemberRow[]>();

  const rows = members ?? [];

  const sponsorIds = [
    ...new Set(
      rows.map((m) => m.sponsor_id).filter((id): id is string => Boolean(id))
    ),
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
    <ClAdminShell
      active="members"
      title="Everyone inside"
      intro={`${rows.length} ${rows.length === 1 ? "member" : "members"}. A view only — renaming, removing and vouching changes are not built.`}
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-[15px]" style={{ color: "var(--cl-muted)" }}>
          No members yet.
        </p>
      ) : (
        <ul className="max-w-[860px]">
          {rows.map((member) => {
            const approved = member.applications.find((a) => a.status === "approved");
            const joined = approved?.reviewed_at ?? member.created_at;
            const sponsorName = member.sponsor_id
              ? sponsorNameById.get(member.sponsor_id) ?? null
              : null;
            return (
              <li
                key={member.id}
                className="border-b py-4"
                style={{ borderColor: "var(--cl-hairline)" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                  <Link href={`/members/${member.id}`} className="text-[15px]">
                    {member.name ?? "(no name)"}
                  </Link>
                  <span
                    className="text-[12.5px] whitespace-nowrap"
                    style={{ color: "var(--cl-faint)" }}
                  >
                    Joined {formatDate(joined)}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--cl-muted)" }}>
                  {[member.neighborhood, approved?.occupation]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--cl-muted)" }}>
                  {sponsorName
                    ? `Brought in by ${sponsorName}`
                    : "Nobody on record as vouching (seed account)"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ClAdminShell>
  );
}
