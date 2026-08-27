"use client";

// Status-aware controls under one card on your own listings, in the Classifieds
// system. A restyle of MyListingActions: same two server actions, same confirm
// gate, same rules about which moves are legal from which status.
//
// These match exactly the moves the 0017 trigger allows a member:
//
//   pending    Edit · Remove     (content edit; pending → archived)
//   published  Edit · Remove     (content edit; published → archived)
//   draft      Edit · Resubmit   (content edit; draft → pending)
//   archived   —                 (terminal; nothing legal to do from here)
//
// Remove is confirm-gated inline rather than through the browser's confirm()
// dialog — off-voice, off-aesthetic, and unstyleable. The first press swaps the
// controls for a one-line question. Resubmit does not interrogate: sending a
// listing back to review isn't destructive.

import Link from "next/link";
import { useActionState, useState } from "react";
import { archiveListing, type ArchiveListingState } from "@/lib/listings/archive";
import { resubmitListing, type ResubmitListingState } from "@/lib/listings/resubmit";
import type { ListingStatus } from "@/lib/cl/listings-read";

const ARCHIVE_INITIAL: ArchiveListingState = { error: null };
const RESUBMIT_INITIAL: ResubmitListingState = { error: null };

export default function ClListingActions({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const [confirming, setConfirming] = useState(false);
  const [archiveState, archiveAction, archiving] = useActionState(
    archiveListing,
    ARCHIVE_INITIAL
  );
  const [resubmitState, resubmitAction, resubmitting] = useActionState(
    resubmitListing,
    RESUBMIT_INITIAL
  );

  // Archived rows are terminal for the member — no controls, no error rail.
  if (status === "archived") return null;

  const error = archiveState.error ?? resubmitState.error;

  return (
    <div className="mt-3">
      {!confirming ? (
        <div className="flex items-center gap-5">
          <Link href={`/listings/${listingId}/edit`} className="cl-quiet text-[13px]">
            Edit
          </Link>
          {status === "draft" ? (
            <form action={resubmitAction} className="inline">
              <input type="hidden" name="id" value={listingId} />
              <button
                type="submit"
                disabled={resubmitting}
                className="cl-quiet text-[13px] disabled:opacity-40"
              >
                {resubmitting ? "Resubmitting…" : "Resubmit"}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="cl-quiet text-[13px]"
              style={{ color: "var(--cl-red)" }}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <form action={archiveAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={listingId} />
          <p className="max-w-[40ch] text-[12.5px] leading-[1.5]" style={{ color: "var(--cl-muted)" }}>
            {status === "pending"
              ? "Remove this listing? It comes out of review and won’t go live."
              : "Remove this listing? It comes off the network right away."}
          </p>
          <span className="flex items-center gap-5">
            <button
              type="submit"
              disabled={archiving}
              className="cl-quiet text-[13px] disabled:opacity-40"
              style={{ color: "var(--cl-red)" }}
            >
              {archiving ? "Removing…" : "Remove"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={archiving}
              className="cl-quiet text-[13px]"
            >
              Keep it
            </button>
          </span>
        </form>
      )}
      {error && <p className="cl-fielderror mt-2">{error}</p>}
    </div>
  );
}
