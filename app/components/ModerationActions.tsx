"use client";

import { useActionState, useState } from "react";
import {
  approveListing,
  returnListing,
  rejectListing,
  type ModerateActionState,
} from "@/lib/admin/moderate";

// Approve / Return with note / Reject with note for one pending listing.
//
// Same inline confirm-gated pattern as ApplicationActions — no browser
// dialogs: the first click swaps the controls for a one-line consequence,
// with a note field where the outcome carries feedback, and a Go back escape.
//
// The server actions re-check the admin role, and the database functions
// check it again (migration 0017) — these buttons are the polite layer only.

const INITIAL: ModerateActionState = { error: null };

// Slice 3, the two-action system: the queue verbs are secondary (ArrowLink
// weight — park text, underline on hover), and the CONFIRM step is the one
// primary action in that moment, so it takes the box. Nothing here is a
// bespoke button any more.
const CONTROL =
  "inline-block text-[14px] text-park hover:underline underline-offset-4 transition-colors cursor-pointer disabled:opacity-40";
const CONFIRM_CONTROL =
  "inline-block border border-ink px-[18px] py-[9px] mh-label text-ink bg-transparent cursor-pointer transition-colors duration-[250ms] hover:bg-ink hover:text-bone disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink";
const NOTE_FIELD = "mh-input text-sm";

type Mode = "idle" | "approve" | "return" | "reject";

export default function ModerationActions({ listingId }: { listingId: string }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [approveState, approveAction, approving] = useActionState(
    approveListing,
    INITIAL
  );
  const [returnState, returnAction, returning] = useActionState(
    returnListing,
    INITIAL
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectListing,
    INITIAL
  );

  const error = approveState.error ?? returnState.error ?? rejectState.error;
  const busy = approving || returning || rejecting;

  return (
    <div className="mt-4">
      {mode === "idle" && (
        <div className="flex items-center gap-7">
          <button type="button" onClick={() => setMode("approve")} className={CONTROL}>
            Approve
          </button>
          <button type="button" onClick={() => setMode("return")} className={CONTROL}>
            Return with note
          </button>
          <button type="button" onClick={() => setMode("reject")} className={CONTROL}>
            Reject
          </button>
        </div>
      )}

      {mode === "approve" && (
        <form action={approveAction} className="space-y-4">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] text-slate max-w-[46ch]">
            Put it on the network? It goes live for every member right away.
          </p>
          <div className="flex items-center gap-7">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {approving ? "Approving…" : "Approve"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {mode === "return" && (
        <form action={returnAction} className="space-y-4">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] text-slate max-w-[46ch]">
            Send it back? They see your note, make the changes, and resubmit.
          </p>
          <input
            type="text"
            name="note"
            maxLength={500}
            required
            placeholder="What needs changing"
            className={NOTE_FIELD}
          />
          <div className="flex items-center gap-7">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {returning ? "Returning…" : "Return with note"}
            </button>
            <GoBack onClick={() => setMode("idle")} disabled={busy} />
          </div>
        </form>
      )}

      {mode === "reject" && (
        <form action={rejectAction} className="space-y-4">
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] text-slate max-w-[46ch]">
            Take it down for good? It never goes live, and your reason stays on
            the record.
          </p>
          <input
            type="text"
            name="note"
            maxLength={500}
            required
            placeholder="Why it doesn't meet the bar"
            className={NOTE_FIELD}
          />
          <div className="flex items-center gap-7">
            <button type="submit" disabled={busy} className={CONFIRM_CONTROL}>
              {rejecting ? "Rejecting…" : "Reject"}
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
