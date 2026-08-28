"use client";

// The three controls on one row of /admin/listings — Slice 3b.
//
// TAKE DOWN IS DESTRUCTIVE, so it follows the rule ClRemoveListing set: the red
// accent, a confirm step, and copy that says what actually happens rather than
// what sounds gentlest. Archiving is not deleting — the row and its moderation
// history stay, and soft-delete-only is locked (0014).
//
// THE REASON IS REQUIRED, and it is not bureaucracy. A take-down with no
// recorded reason is what turns a trust layer into an opinion, and the member
// can be told what happened. Both the server action and admin_archive_listing
// itself refuse an empty note, so the required attribute here is the third of
// three checks rather than the only one.
//
// THIS RENDERS ITS OWN <form> AND IS NEVER NESTED IN ANOTHER. That sentence
// exists because the identical component on the member side spent a fortnight
// inside ClPostForm's form: a <form> in a <form> is invalid, the browser drops
// the inner one, and the button silently posts the outer action. The guard that
// holds it is checkNotInForm() in scripts/audit-gates.ts, not this comment —
// see /admin/listings, which renders this inside a <li> and nothing else.

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  adminArchiveListing,
  type AdminListingState,
} from "@/lib/admin/listings";

const INITIAL: AdminListingState = { error: null };

export default function ClAdminListingRow({
  listingId,
  title,
  status,
  viewHref,
}: {
  listingId: string;
  title: string;
  status: string;
  viewHref: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    adminArchiveListing,
    INITIAL
  );

  const down = status === "archived";

  return (
    <div className="mt-2.5">
      {!confirming ? (
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          {viewHref ? (
            <Link href={viewHref} className="cl-quiet">
              View
            </Link>
          ) : (
            <span style={{ color: "var(--cl-faint)" }} title="Only a live listing has a public page">
              View
            </span>
          )}

          {/* Editing an archived listing is allowed — a correction may be why
              it is coming back later — but the far commoner case is a live row,
              so nothing special is done for it. */}
          <Link href={`/admin/listings/${listingId}/edit`} className="cl-quiet">
            Edit
          </Link>

          {down ? (
            <span style={{ color: "var(--cl-faint)" }}>Taken down</span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="cl-quiet"
              style={{ color: "var(--cl-red)" }}
            >
              Take down
            </button>
          )}
        </div>
      ) : (
        <form action={formAction} className="max-w-[52ch]">
          <input type="hidden" name="id" value={listingId} />

          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--cl-muted)" }}>
            Take down &ldquo;{title}&rdquo;? It comes off the network
            {status === "pending" ? " and out of review" : ""} straight away. The
            listing stays in the member&rsquo;s records, under Archived.
          </p>

          <label htmlFor={`note-${listingId}`} className="sr-only">
            Reason this listing came down
          </label>
          <input
            id={`note-${listingId}`}
            name="note"
            required
            maxLength={300}
            placeholder="Why it came down — kept on the record"
            className="cl-input mt-2.5 w-full text-[13.5px]"
            style={{ padding: "9px 12px" }}
          />

          <div className="mt-2.5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isPending}
              className={isPending ? "cl-pill-disabled" : "cl-ghost"}
              style={
                isPending
                  ? undefined
                  : { color: "var(--cl-red)", borderColor: "var(--cl-error-panel-border)" }
              }
            >
              {isPending ? "Taking it down…" : "Yes, take it down"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="cl-quiet"
            >
              Keep it
            </button>
          </div>
        </form>
      )}

      {state.error && <p className="cl-fielderror mt-2">{state.error}</p>}
    </div>
  );
}
