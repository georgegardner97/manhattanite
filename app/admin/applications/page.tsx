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
      "id, status, occupation, about, sponsor_reference, neighborhood, reviewer_note, created_at, accounts(name, email)"
    )
    .in("status", ["pending", "needs_info"])
    .order("created_at", { ascending: true })
    .returns<ApplicationRow[]>();

  const pending = (applications ?? []).filter((a) => a.status === "pending");
  const needsInfo = (applications ?? []).filter(
    (a) => a.status === "needs_info"
  );

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
                {pending.map((application) => (
                  <li
                    key={application.id}
                    className="border-t border-ink/10 py-10 last:border-b"
                  >
                    <ApplicationCard application={application} />
                    <ApplicationActions applicationId={application.id} />
                  </li>
                ))}
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
                      <ApplicationCard application={application} />
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

function ApplicationCard({ application }: { application: ApplicationRow }) {
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

      {application.sponsor_reference && (
        <p className="mt-4 text-sm text-slate">
          <span className="text-[11px] tracking-[0.22em] uppercase">
            Says they know:&nbsp;
          </span>
          {application.sponsor_reference}
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
