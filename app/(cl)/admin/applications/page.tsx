// /admin/applications — the membership review queue, in the Classifieds system.
// (Slice 3b.)
//
// A port of the editorial screen: same queries, same sponsor-resolution logic,
// new frame. Two groups:
//   - pending     → oldest first (reviewed in the order they arrived), with the
//                   Approve / Decline / Request more info actions.
//   - needs_info  → shown WITHOUT actions: the review functions only act on
//                   'pending' rows, and a needs_info application is waiting on
//                   the APPLICANT, who re-applies via /apply. Listed so the
//                   people in limbo are visible, muted so it reads as their move.
//
// Reads run as the signed-in admin — 0007's applications read-all policy (and
// 0002's accounts read-all for the name embed) are the data gate.

import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";
import ClApplicationActions from "@/app/components/cl/ClApplicationActions";

export const dynamic = "force-dynamic"; // session state varies per request.

type ApplicationRow = {
  id: string;
  status: "pending" | "needs_info";
  occupation: string | null;
  about: string | null;
  sponsor_reference: string | null;
  sponsor_id: string | null;
  neighborhood: string | null;
  reviewer_note: string | null;
  created_at: string;
  accounts: { name: string | null; email: string } | null;
};

type EffectiveSponsor = {
  id: string;
  name: string | null;
  source: "invite" | "referral";
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdmin();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      // Disambiguate the embed: applications has TWO FKs to accounts
      // (account_id = applicant, sponsor_id = inviter), so a bare accounts(...)
      // is ambiguous and PostgREST errors. Name the applicant FK explicitly.
      "id, status, occupation, about, sponsor_reference, sponsor_id, neighborhood, reviewer_note, created_at, accounts!applications_account_id_fkey(name, email)"
    )
    .in("status", ["pending", "needs_info"])
    .order("created_at", { ascending: true })
    .returns<ApplicationRow[]>();

  const rows = applications ?? [];
  const pending = rows.filter((a) => a.status === "pending");
  const needsInfo = rows.filter((a) => a.status === "needs_info");

  // Inviter names in one extra query (no PostgREST FK embed — a second FK to
  // accounts is exactly what broke the member directory before).
  const sponsorIds = [
    ...new Set(rows.map((a) => a.sponsor_id).filter((x): x is string => Boolean(x))),
  ];
  const sponsorNameById = new Map<string, string>();
  if (sponsorIds.length > 0) {
    const { data: sponsors } = await supabase
      .from("accounts")
      .select("id, name")
      .in("id", sponsorIds)
      .returns<{ id: string; name: string | null }[]>();
    for (const s of sponsors ?? []) if (s.name) sponsorNameById.set(s.id, s.name);
  }

  // Match the free-text "Know a member?" referral to a real member (by email or
  // name). At seed scale, fetch all members and match in JS. A matched referral
  // is only a SUGGESTION — shown here and recorded as the sponsor only on a
  // one-click approval. Never auto-trusted: anyone could type any email.
  const { data: allMembers } = await supabase
    .from("accounts")
    .select("id, name, email")
    .eq("is_member", true)
    .returns<{ id: string; name: string | null; email: string }[]>();

  // Sponsorship-request status per application (0025). Fails soft if the table
  // is missing — no rows, no status shown, queue behaves as before.
  const requestStatusByApp = new Map<string, "pending" | "confirmed" | "declined">();
  if (rows.length > 0) {
    const { data: reqs } = await supabase
      .from("sponsorship_requests")
      .select("application_id, status")
      .in("application_id", rows.map((a) => a.id))
      .returns<{ application_id: string; status: "pending" | "confirmed" | "declined" }[]>();
    for (const r of reqs ?? []) requestStatusByApp.set(r.application_id, r.status);
  }

  function matchReferral(ref: string | null): { id: string; name: string | null } | null {
    const r = (ref ?? "").trim().toLowerCase();
    if (!r) return null;
    const m = (allMembers ?? []).find(
      (x) => x.email.toLowerCase() === r || (x.name !== null && x.name.toLowerCase() === r)
    );
    return m ? { id: m.id, name: m.name } : null;
  }

  // An invite's sponsor_id (the verified inviter) wins; else a matched
  // referral; else none, which means the founder default on approval.
  function effectiveSponsor(a: ApplicationRow): EffectiveSponsor | null {
    if (a.sponsor_id) {
      return {
        id: a.sponsor_id,
        name: sponsorNameById.get(a.sponsor_id) ?? null,
        source: "invite",
      };
    }
    const m = matchReferral(a.sponsor_reference);
    return m ? { id: m.id, name: m.name, source: "referral" } : null;
  }

  return (
    <ClAdminShell
      active="applications"
      title="Who’s asking in"
      intro={
        pending.length === 0
          ? "Nothing waiting on a decision."
          : `${pending.length} ${pending.length === 1 ? "application" : "applications"} waiting on you, oldest first.`
      }
    >
      {pending.length === 0 && needsInfo.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[19px]">The queue is clear.</p>
          <p
            className="mx-auto mt-2.5 max-w-[42ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            Nothing waiting. New applications land here the moment they&rsquo;re
            submitted.
          </p>
        </div>
      ) : (
        <div className="max-w-[860px]">
          {pending.length > 0 && (
            <ul>
              {pending.map((application) => {
                const sp = effectiveSponsor(application);
                return (
                  <li
                    key={application.id}
                    className="border-t py-8 last:border-b"
                    style={{ borderColor: "var(--cl-hairline)" }}
                  >
                    <ApplicationCard
                      application={application}
                      sponsor={sp}
                      requestStatus={requestStatusByApp.get(application.id) ?? null}
                    />
                    <ClApplicationActions
                      applicationId={application.id}
                      sponsorId={sp?.id ?? null}
                      sponsorName={sp?.name ?? null}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {needsInfo.length > 0 && (
            <div className={pending.length > 0 ? "mt-12" : ""}>
              <p className="cl-grouplabel mb-3.5">
                Waiting on them — more info requested, they can re-apply
              </p>
              <ul style={{ opacity: 0.65 }}>
                {needsInfo.map((application) => (
                  <li
                    key={application.id}
                    className="border-t py-8 last:border-b"
                    style={{ borderColor: "var(--cl-hairline)" }}
                  >
                    <ApplicationCard
                      application={application}
                      sponsor={effectiveSponsor(application)}
                      requestStatus={requestStatusByApp.get(application.id) ?? null}
                    />
                    {application.reviewer_note && (
                      <p className="mt-3 text-[13px]" style={{ color: "var(--cl-muted)" }}>
                        <span className="cl-grouplabel">Your note:</span>{" "}
                        {application.reviewer_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ClAdminShell>
  );
}

function ApplicationCard({
  application,
  sponsor,
  requestStatus,
}: {
  application: ApplicationRow;
  sponsor: { name: string | null; source: "invite" | "referral" } | null;
  requestStatus: "pending" | "confirmed" | "declined" | null;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h2 className="text-[19px] tracking-[-0.01em]">
          {application.accounts?.name ?? "(no name on the account)"}
        </h2>
        <p
          className="whitespace-nowrap text-[12.5px]"
          style={{ color: "var(--cl-faint)" }}
        >
          {formatDate(application.created_at)}
        </p>
      </div>

      <p className="cl-grouplabel mt-1.5">
        {[application.neighborhood, application.occupation].filter(Boolean).join(" · ") ||
          "No neighborhood or occupation given"}
      </p>

      {application.about && (
        <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.65] whitespace-pre-wrap">
          {application.about}
        </p>
      )}

      {sponsor && sponsor.source === "invite" && (
        <p className="mt-3.5 text-[13.5px]">
          <span className="cl-grouplabel">Invited by:</span>{" "}
          {sponsor.name ?? "a member"}
        </p>
      )}

      {sponsor && sponsor.source === "referral" && (
        <p className="mt-3.5 text-[13.5px]">
          <span className="cl-grouplabel">
            {requestStatus === "confirmed"
              ? "Sponsor confirmed:"
              : requestStatus === "declined"
                ? "Sponsor declined:"
                : "Referred by:"}
          </span>{" "}
          {sponsor.name ?? "a member"}
          <span style={{ color: "var(--cl-muted)" }}>
            {requestStatus === "confirmed"
              ? " — they vouched; approve to record as sponsor"
              : requestStatus === "declined"
                ? " — they declined the request"
                : requestStatus === "pending"
                  ? " — asked to vouch, awaiting their reply"
                  : " — a member; approve to record as sponsor"}
          </span>
        </p>
      )}

      {/* A referral that matches no member — an unverified hint, nothing more. */}
      {!sponsor && application.sponsor_reference && (
        <p className="mt-3.5 text-[13.5px]" style={{ color: "var(--cl-muted)" }}>
          <span className="cl-grouplabel">Says they know:</span>{" "}
          {application.sponsor_reference} (not a member yet)
        </p>
      )}
    </div>
  );
}
