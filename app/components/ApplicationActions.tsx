"use client";

import { useActionState, useState } from "react";
import {
  approveApplication,
  declineApplication,
  requestInfo,
  type ReviewActionState,
} from "@/lib/admin/review";

// Approve / Decline / Request more info for one pending application.
//
// Every outcome is confirm-gated inline (same pattern as MyListingActions —
// no browser dialogs): the first click swaps the controls for a one-line
// consequence + a note field where a note makes sense, with a Go back escape.
// Approval flips membership instantly, so it confirms too.
//
// The server actions re-check the admin role, and the database functions
// check it again (migration 0015) — these buttons are the polite layer only.

const INITIAL: ReviewActionState = { error: null };

const CONTROL =
  "mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer disabled:opacity-40";
const CONFIRM_CONTROL =
  "mh-link text-[11px] tracking-[0.22em] uppercase text-ink cursor-pointer disabled:opacity-40";
const NOTE_FIELD =
  "w-full bg-transparent border-b border-ink/20 pb-2 text-sm text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";

type Mode = "idle" | "approve" | "decline" | "needs_info";

export default function ApplicationActions({
  applicationId,
  sponsorId,
  sponsorName,
}: {
  applicationId: string;
  // The inviter, when this applicant came in through an invite — passed to the
  // approve action so the real sponsor is recorded (not the George default).
  sponsorId?: string | null;
  sponsorName?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [approveState, approveAction, approving] = useActionState(
    approveApplication,
    INITIAL
  );
  const [declineState, declineAction, declining] = useActionState(
    declineApplication,
    INITIAL
  );
  const [infoState, infoAction, requesting] = useActionState(
    requestInfo,
    INITIAL
  );

  const error =
    approveState.error ?? declineState.error ?? infoState.error;
  const busy = approving || declining || requesting;

  return (
    <div className="mt-6">
      {mode === "idle" && (
        <div className="flex items-center gap-10">
          <button type="button" onClick={() => setMode("approve")} className={CONTROL}>
            Approve
          </button>
          <button type="button" onClick={() => setMode("decline")} className={CONTROL}>
            Decline
          </button>
          <button type="button" onClick={() => setMode("needs_info")} className={CONTROL}>
            Request more info
          </button>
        </div>
      )}

      {mode === "approve" && (
        <form action={approveAction} className="space-y-4">
          <input type="hidden" name="id" value={applicationId} />
          {sponsorId && (
            <input type="hidden" name="sponsor_id" value={sponsorId} />
          )}
          <p className="font-serif italic text-[15px] text-ink">
            Bring them in? Membership is immediate, sponsored by{" "}
            {sponsorName ?? "George"}, and the welcome email goes out.
          </p>
          <div className="flex items-center gap-10">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {approving ? "Approving…" : "Approve"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {mode === "decline" && (
        <form action={declineAction} className="space-y-4">
          <input type="hidden" name="id" value={applicationId} />
          <p className="font-serif italic text-[15px] text-ink">
            Turn them away? They stay an account holder and can browse as
            before.
          </p>
          <input
            type="text"
            name="note"
            maxLength={500}
            placeholder="A note for the record (optional)"
            className={NOTE_FIELD}
          />
          <div className="flex items-center gap-10">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {declining ? "Declining…" : "Decline"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {mode === "needs_info" && (
        <form action={infoAction} className="space-y-4">
          <input type="hidden" name="id" value={applicationId} />
          <p className="font-serif italic text-[15px] text-ink">
            Ask for more? This closes the application; they can apply again
            with the fuller picture.
          </p>
          <input
            type="text"
            name="note"
            maxLength={500}
            placeholder="What's missing? (optional, for the record)"
            className={NOTE_FIELD}
          />
          <div className="flex items-center gap-10">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {requesting ? "Sending…" : "Request more info"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function GoBack({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={CONTROL}>
      Go back
    </button>
  );
}
