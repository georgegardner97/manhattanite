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

// Slice 3, the two-action system: the queue verbs are secondary (ArrowLink
// weight — park text, underline on hover), and the CONFIRM step is the one
// primary action in that moment, so it takes the box. Nothing here is a
// bespoke button any more.
const CONTROL =
  "inline-block text-[14px] text-park hover:underline underline-offset-4 transition-colors cursor-pointer disabled:opacity-40";
const CONFIRM_CONTROL =
  "inline-block border border-ink px-[18px] py-[9px] mh-label text-ink bg-transparent cursor-pointer transition-colors duration-[250ms] hover:bg-ink hover:text-bone disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink";
const NOTE_FIELD = "mh-input text-sm";

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
    <div className="mt-4">
      {mode === "idle" && (
        <div className="flex items-center gap-7">
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
          <p className="text-[13px] text-slate max-w-[46ch]">
            Bring them in? Membership is immediate, sponsored by{" "}
            {sponsorName ?? "George"}, and the welcome email goes out.
          </p>
          <div className="flex items-center gap-7">
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
          <p className="text-[13px] text-slate max-w-[46ch]">
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
          <div className="flex items-center gap-7">
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
          <p className="text-[13px] text-slate max-w-[46ch]">
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
          <div className="flex items-center gap-7">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {requesting ? "Sending…" : "Request more info"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-[12.5px] text-slate">{error}</p>}
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
