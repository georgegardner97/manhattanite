"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  archiveListing,
  type ArchiveListingState,
} from "@/lib/listings/archive";

// Edit / Remove controls for one row on /listings/mine.
//
// Remove is confirm-gated inline (no browser confirm() dialog — off-voice and
// off-aesthetic): first click swaps the controls for a one-line question with
// Remove / Keep it. Confirming runs the archiveListing server action — a soft
// delete; the page revalidates and the listing drops out of the list.

const INITIAL: ArchiveListingState = { error: null };

const CONTROL =
  "mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer";

export default function MyListingActions({ listingId }: { listingId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    archiveListing,
    INITIAL
  );

  return (
    <div className="mt-6">
      {!confirming ? (
        <div className="flex items-center gap-10">
          <Link href={`/listings/${listingId}/edit`} className={CONTROL}>
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={CONTROL}
          >
            Remove
          </button>
        </div>
      ) : (
        <form
          action={formAction}
          className="flex flex-wrap items-baseline gap-x-10 gap-y-3"
        >
          <input type="hidden" name="id" value={listingId} />
          <p className="font-serif italic text-[15px] text-ink">
            Remove this listing? It comes off the network right away.
          </p>
          <span className="flex items-baseline gap-10">
            <button type="submit" disabled={isPending} className={`${CONTROL} disabled:opacity-40`}>
              {isPending ? "Removing…" : "Remove"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className={CONTROL}
            >
              Keep it
            </button>
          </span>
        </form>
      )}
      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
