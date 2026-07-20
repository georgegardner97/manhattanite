"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  archiveListing,
  type ArchiveListingState,
} from "@/lib/listings/archive";
import {
  resubmitListing,
  type ResubmitListingState,
} from "@/lib/listings/resubmit";
import type { ListingStatus } from "@/app/listings/mine/page";

// Status-aware controls for one row on /listings/mine. (Listing Moderation
// slice — these match exactly the moves the 0017 trigger allows a member:)
//
//   pending    Edit · Remove           (content edit; pending → archived)
//   published  Edit · Remove           (content edit; published → archived)
//   draft      Edit · Resubmit         (content edit; draft → pending)
//   archived   —                       (done; nothing legal to do from here)
//
// Remove is confirm-gated inline (no browser confirm() dialog — off-voice and
// off-aesthetic): first click swaps the controls for a one-line question with
// Remove / Keep it. Confirming runs the archiveListing server action — a soft
// delete; the page revalidates and the row re-renders under Archived.
// Resubmit is a single action — sending a listing back to review isn't
// destructive, so it doesn't interrogate.

const ARCHIVE_INITIAL: ArchiveListingState = { error: null };
const RESUBMIT_INITIAL: ResubmitListingState = { error: null };

// Slice 3: these are SECONDARY actions in a card footer — boxes stay reserved
// for the one primary action on a screen, so Edit/Remove/Resubmit read as
// ArrowLink-weight text at 14px park, not as buttons competing with the card.
const CONTROL =
  "inline-block text-[14px] text-park hover:underline underline-offset-4 transition-colors cursor-pointer";

export default function MyListingActions({
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
  if (status === "archived") {
    return null;
  }

  const error = archiveState.error ?? resubmitState.error;

  return (
    <div className="mt-3.5">
      {!confirming ? (
        <div className="flex items-center gap-7">
          <Link href={`/listings/${listingId}/edit`} className={CONTROL}>
            Edit
          </Link>
          {status === "draft" ? (
            <form action={resubmitAction} className="inline">
              <input type="hidden" name="id" value={listingId} />
              <button
                type="submit"
                disabled={resubmitting}
                className={`${CONTROL} disabled:opacity-40`}
              >
                {resubmitting ? "Resubmitting…" : "Resubmit"}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={CONTROL}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <form
          action={archiveAction}
          className="flex flex-wrap items-baseline gap-x-10 gap-y-3"
        >
          <input type="hidden" name="id" value={listingId} />
          <p className="text-[13px] text-slate max-w-[40ch]">
            {status === "pending"
              ? "Remove this listing? It comes out of review and won’t go live."
              : "Remove this listing? It comes off the network right away."}
          </p>
          <span className="flex items-baseline gap-7">
            <button
              type="submit"
              disabled={archiving}
              className={`${CONTROL} disabled:opacity-40`}
            >
              {archiving ? "Removing…" : "Remove"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={archiving}
              className={CONTROL}
            >
              Keep it
            </button>
          </span>
        </form>
      )}
      {error && <p className="mt-3 text-[12.5px] text-slate">{error}</p>}
    </div>
  );
}
