"use client";

// Approve / Return with note / Reject, for one listing in the review queue.
// The Classifieds port of ModerationActions. (Slice 3b.)
//
// Same inline confirm-gated pattern the rest of this system uses — no browser
// dialogs: the first click swaps the controls for a one-line consequence, with
// a note field where the outcome carries feedback, and a way back.
//
// THE SERVER ACTIONS RE-CHECK THE ADMIN ROLE, AND THE DATABASE FUNCTIONS CHECK
// IT AGAIN (0017). These buttons are the polite layer only.
//
// EACH MODE RENDERS ITS OWN <form>, AND ONLY ONE IS MOUNTED AT A TIME. Three
// forms are never siblings and are never nested — a <form> inside a <form> is
// invalid, the browser drops the inner one, and the button silently posts the
// wrong action. That is not hypothetical: it is what the member take-down
// control did for a fortnight. See scripts/audit-gates.ts.

import { useActionState, useState } from "react";
import {
  approveListing,
  returnListing,
  rejectListing,
  type ModerateActionState,
} from "@/lib/admin/moderate";

const INITIAL: ModerateActionState = { error: null };

type Mode = "idle" | "approve" | "return" | "reject";

export default function ClModerationActions({
  listingId,
}: {
  listingId: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [approveState, approveAction, approving] = useActionState(approveListing, INITIAL);
  const [returnState, returnAction, returning] = useActionState(returnListing, INITIAL);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectListing, INITIAL);

  const error = approveState.error ?? returnState.error ?? rejectState.error;
  const busy = approving || returning || rejecting;

  return (
    <div className="mt-4">
      {mode === "idle" && (
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <button type="button" onClick={() => setMode("approve")} className="cl-quiet">
            Approve
          </button>
          <button type="button" onClick={() => setMode("return")} className="cl-quiet">
            Return with note
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="cl-quiet"
            style={{ color: "var(--cl-red)" }}
          >
            Reject
          </button>
        </div>
      )}

      {mode === "approve" && (
        <form action={approveAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Put it on the network? It goes live for every member right away.
          </p>
          <Controls
            submitLabel={approving ? "Approving…" : "Approve"}
            busy={busy}
            onBack={() => setMode("idle")}
          />
        </form>
      )}

      {mode === "return" && (
        <form action={returnAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Send it back? They see your note, make the changes, and resubmit.
          </p>
          <Note listingId={listingId} placeholder="What needs changing" />
          <Controls
            submitLabel={returning ? "Returning…" : "Return with note"}
            busy={busy}
            onBack={() => setMode("idle")}
          />
        </form>
      )}

      {mode === "reject" && (
        <form action={rejectAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Take it down for good? It never goes live, and your reason stays on
            the record.
          </p>
          <Note listingId={listingId} placeholder="Why it doesn't meet the bar" />
          <Controls
            submitLabel={rejecting ? "Rejecting…" : "Reject"}
            busy={busy}
            onBack={() => setMode("idle")}
            destructive
          />
        </form>
      )}

      {error && <p className="cl-fielderror mt-2">{error}</p>}
    </div>
  );
}

function Note({ listingId, placeholder }: { listingId: string; placeholder: string }) {
  return (
    <>
      <label htmlFor={`mod-note-${listingId}`} className="sr-only">
        {placeholder}
      </label>
      <input
        id={`mod-note-${listingId}`}
        type="text"
        name="note"
        maxLength={500}
        required
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
