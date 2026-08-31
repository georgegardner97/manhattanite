"use client";

// Approve / Decline / Request more info, for one pending application.
// The Classifieds port of ApplicationActions. (Slice 3b.)
//
// Every outcome is confirm-gated inline — no browser dialogs: the first click
// swaps the controls for a one-line consequence, with a note field where a note
// makes sense and a way back. Approval flips membership instantly and sends the
// welcome email, so it confirms too.
//
// The server actions re-check the admin role and the database functions check
// it again (0015) — these buttons are the polite layer only.

import { useActionState, useState } from "react";
import {
  approveApplication,
  declineApplication,
  requestInfo,
  type ReviewActionState,
} from "@/lib/admin/review";

const INITIAL: ReviewActionState = { error: null };

type Mode = "idle" | "approve" | "decline" | "needs_info";

export default function ClApplicationActions({
  applicationId,
  sponsorId,
  sponsorName,
}: {
  applicationId: string;
  // The inviter, when this applicant came in through an invite — passed to the
  // approve action so the real sponsor is recorded, not the founder default.
  sponsorId?: string | null;
  sponsorName?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [approveState, approveAction, approving] = useActionState(approveApplication, INITIAL);
  const [declineState, declineAction, declining] = useActionState(declineApplication, INITIAL);
  const [infoState, infoAction, requesting] = useActionState(requestInfo, INITIAL);

  const error = approveState.error ?? declineState.error ?? infoState.error;
  const busy = approving || declining || requesting;

  return (
    <div className="mt-4">
      {mode === "idle" && (
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <button type="button" onClick={() => setMode("approve")} className="cl-quiet">
            Approve
          </button>
          <button type="button" onClick={() => setMode("decline")} className="cl-quiet">
            Decline
          </button>
          <button type="button" onClick={() => setMode("needs_info")} className="cl-quiet">
            Request more info
          </button>
        </div>
      )}

      {mode === "approve" && (
        <form action={approveAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={applicationId} />
          {sponsorId && <input type="hidden" name="sponsor_id" value={sponsorId} />}
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Bring them in? Membership is immediate, vouched for by{" "}
            {sponsorName ?? "George"}, and the welcome email goes out.
          </p>
          <Controls
            submitLabel={approving ? "Approving…" : "Approve"}
            busy={busy}
            onBack={() => setMode("idle")}
          />
        </form>
      )}

      {mode === "decline" && (
        <form action={declineAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={applicationId} />
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Turn them away? They stay an account holder and can browse as before.
          </p>
          <Note id={applicationId} placeholder="A note for the record (optional)" />
          <Controls
            submitLabel={declining ? "Declining…" : "Decline"}
            busy={busy}
            onBack={() => setMode("idle")}
            destructive
          />
        </form>
      )}

      {mode === "needs_info" && (
        <form action={infoAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={applicationId} />
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Ask for more? This closes the application; they can apply again with
            the fuller picture.
          </p>
          <Note id={applicationId} placeholder="What's missing? (optional, for the record)" />
          <Controls
            submitLabel={requesting ? "Sending…" : "Request more info"}
            busy={busy}
            onBack={() => setMode("idle")}
          />
        </form>
      )}

      {error && <p className="cl-fielderror mt-2">{error}</p>}
    </div>
  );
}

function Note({ id, placeholder }: { id: string; placeholder: string }) {
  return (
    <>
      <label htmlFor={`app-note-${id}`} className="sr-only">
        {placeholder}
      </label>
      <input
        id={`app-note-${id}`}
        type="text"
        name="note"
        maxLength={500}
        placeholder={placeholder}
        className="cl-input mt-2.5 w-full text-[13.5px]"
        style={{ padding: "9px 12px" }}
      />
    </>
  );
}

function Controls({
  submitLabel,
  busy,
  onBack,
  destructive = false,
}: {
  submitLabel: string;
  busy: boolean;
  onBack: () => void;
  destructive?: boolean;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={busy}
        className={busy ? "cl-pill-disabled" : "cl-ghost"}
        style={
          busy || !destructive
            ? undefined
            : { color: "var(--cl-red)", borderColor: "var(--cl-error-panel-border)" }
        }
      >
        {submitLabel}
      </button>
      <button type="button" onClick={onBack} disabled={busy} className="cl-quiet">
        Go back
      </button>
    </div>
  );
}
