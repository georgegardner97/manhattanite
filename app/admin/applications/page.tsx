// /admin/applications — the review queue. (Admin Console slice.)
//
// Server Component, role='admin' only. Lists open applications in two groups:
//   - pending     → oldest first (review in the order they arrived), with the
//                   Approve / Decline / Request more info actions.
//   - needs_info  → shown without actions: the review functions only act on
//                   'pending' rows, and a needs_info application is waiting on
//                   the APPLICANT, who re-applies via /apply (the one-pending
//                   index only blocks on pending). Listed so George can see
//                   who's in limbo, muted so it reads as "their move".
//
// Reads run as the signed-in admin — 0007's "applications: admin reads all"
// policy (and 0002's accounts read-all for the name embed) are the data gate.

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import ApplicationActions from "@/app/components/ApplicationActions";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdmin();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      // Disambiguate the embed: applications now has TWO FKs to accounts
      // (account_id = applicant, sponsor_id = inviter), so a bare accounts(...)
      // is ambiguous and PostgREST errors. Name the applicant FK explicitly.
      "id, status, occupation, about, sponsor_reference, sponsor_id, neighborhood, reviewer_note, created_at, accounts!applications_account_id_fkey(name, email)"
    )
    .in("status", ["pending", "needs_info"])
    .order("created_at", { ascending: true })
    .returns<ApplicationRow[]>();

  const pending = (applications ?? []).filter((a) => a.status === "pending");
  const needsInfo = (applications ?? []).filter(
    (a) => a.status === "needs_info"
  );

  // Resolve inviter names in one extra query (no PostgREST FK embed — a second
  // FK to accounts is exactly what broke the member directory before). Map of
  // sponsor account id → name, used to show "Invited by …" and to label the
  // approve confirm.
  const sponsorIds = [
    ...new Set(
      (applications ?? [])
        .map((a) => a.sponsor_id)
        .filter((x): x is string => Boolean(x))
    ),
  ];
  const sponsorNameById = new Map<string, string>();
  if (sponsorIds.length > 0) {
    const { data: sponsors } = await supabase
      .from("accounts")
      .select("id, name")
      .in("id", sponsorIds)
      .returns<{ id: string; name: string | null }[]>();
    for (const s of sponsors ?? []) {
      if (s.name) sponsorNameById.set(s.id, s.name);
    }
  }

  // Match the free-text "Know a member?" referral to a real member (by email or
  // name). At seed scale, fetch all members and match in JS. A matched referral
  // is only a SUGGESTION — shown to you and recorded as the sponsor only on
  // your one-click approval (never auto-trusted: anyone could type any email).
  // RLS: admin reads all accounts (0002).
  const { data: allMembers } = await supabase
    .from("accounts")
    .select("id, name, email")
    .eq("is_member", true)
    .returns<{ id: string; name: string | null; email: string }[]>();

  // Sponsorship-request status per application (migration 0025). Admin reads all
  // via the sponsorship_requests_admin_read policy. Shown next to a referral so
  // George sees whether the named member has actually confirmed the vouch. Fails
  // soft before the migration is applied (the table is missing → no rows → no
  // status shown, queue behaves exactly as today).
  const requestStatusByApp = new Map<
    string,
    "pending" | "confirmed" | "declined"
  >();
  {
    const appIds = (applications ?? []).map((a) => a.id);
    if (appIds.length > 0) {
      const { data: reqs } = await supabase
        .from("sponsorship_requests")
        .select("application_id, status")
        .in("application_id", appIds)
        .returns<
          { application_id: string; status: "pending" | "confirmed" | "declined" }[]
        >();
      for (const r of reqs ?? []) {
        requestStatusByApp.set(r.application_id, r.status);
      }
    }
  }

  function matchReferral(
    ref: string | null
  ): { id: string; name: string | null } | null {
    const r = (ref ?? "").trim().toLowerCase();
    if (!r) return null;
    const m = (allMembers ?? []).find(
      (x) =>
        x.email.toLowerCase() === r ||
        (x.name !== null && x.name.toLowerCase() === r)
    );
    return m ? { id: m.id, name: m.name } : null;
  }

  type EffectiveSponsor = {
    id: string;
    name: string | null;
    source: "invite" | "referral";
  };

  // An invite's sponsor_id (the verified inviter) wins; else a matched referral;
  // else none (→ founder default on approval).
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
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
        >
          &larr; Admin
        </Link>

        <div className="text-center mt-12 mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Applications
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            Who&apos;s asking in.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        {pending.length === 0 && needsInfo.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {pending.length > 0 && (
              <ul className="space-y-px">
                {pending.map((application) => {
                  const sp = effectiveSponsor(application);
                  return (
                    <li
                      key={application.id}
                      className="border-t border-ink/10 py-10 last:border-b"
                    >
                      <ApplicationCard
                        application={application}
                        sponsor={sp}
                        requestStatus={
                          requestStatusByApp.get(application.id) ?? null
                        }
                      />
                      <ApplicationActions
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
              <div className={pending.length > 0 ? "mt-20" : ""}>
                <p className="text-[13px] tracking-[0.22em] uppercase text-slate mb-8">
                  Waiting on them
                  <span className="font-serif italic normal-case tracking-normal text-slate/70 ml-2">
                    (more info requested — they can re-apply)
                  </span>
                </p>
                <ul className="space-y-px opacity-60">
                  {needsInfo.map((application) => (
                    <li
                      key={application.id}
                      className="border-t border-ink/10 py-10 last:border-b"
                    >
                      <ApplicationCard
                        application={application}
                        sponsor={effectiveSponsor(application)}
                        requestStatus={
                          requestStatusByApp.get(application.id) ?? null
                        }
                      />
                      {application.reviewer_note && (
                        <p className="mt-4 text-sm text-slate">
                          <span className="text-[11px] tracking-[0.22em] uppercase">
                            Your note:&nbsp;
                          </span>
                          {application.reviewer_note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </main>
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
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-serif font-light text-2xl tracking-tight text-ink">
          {application.accounts?.name ?? "(no name on the account)"}
        </h2>
        <p className="text-[11px] tracking-[0.22em] uppercase text-slate whitespace-nowrap">
          {formatDate(application.created_at)}
        </p>
      </div>

      <p className="mt-2 text-[11px] tracking-[0.22em] uppercase text-slate">
        {[application.neighborhood, application.occupation]
          .filter(Boolean)
          .join(" · ") || "No neighborhood or occupation given"}
      </p>

      {application.about && (
        <p className="mt-5 font-serif text-lg text-ink leading-relaxed whitespace-pre-wrap">
          {application.about}
        </p>
      )}

      {sponsor && sponsor.source === "invite" && (
        <p className="mt-4 text-sm text-ink">
          <span className="text-[11px] tracking-[0.22em] uppercase text-slate">
            Invited by:&nbsp;
          </span>
          {sponsor.name ?? "a member"}
        </p>
      )}

      {sponsor && sponsor.source === "referral" && (
        <p className="mt-4 text-sm text-ink">
          <span className="text-[11px] tracking-[0.22em] uppercase text-slate">
            {requestStatus === "confirmed"
              ? "Sponsor confirmed: "
              : requestStatus === "declined"
                ? "Sponsor declined: "
                : "Referred by: "}
          </span>
          {sponsor.name ?? "a member"}
          <span className="font-serif italic text-slate">
            {requestStatus === "confirmed"
              ? " — they vouched; approve to record as sponsor"
              : requestStatus === "declined"
                ? " — they declined the request"
                : requestStatus === "pending"
                  ? " — asked to vouch, awaiting their reply"
                  : " — a member; approve to record as sponsor"}
          </span>
        </p>
      )}

      {/* A referral that doesn't match any member — just an unverified hint. */}
      {!sponsor && application.sponsor_reference && (
        <p className="mt-4 text-sm text-slate">
          <span className="text-[11px] tracking-[0.22em] uppercase">
            Says they know:&nbsp;
          </span>
          {application.sponsor_reference}
          <span className="font-serif italic">&nbsp;(not a member yet)</span>
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center max-w-md mx-auto py-10">
      <p className="font-serif text-2xl leading-relaxed text-ink">
        The queue is clear.
      </p>
      <p className="mt-6 text-slate leading-relaxed">
        Nothing waiting. New applications land here the moment they&apos;re
        submitted.
      </p>
    </div>
  );
}
