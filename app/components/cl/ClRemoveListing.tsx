"use client";

// Taking a listing down, from the edit screen.
//
// The design has no treatment for this — screen 05 draws posting, and nothing
// draws the other direction. So the rules are the system's own: destructive
// actions take the red accent (--cl-red, the palette's only one), ask before
// they act, and say what actually happens rather than what sounds gentlest.
//
// ARCHIVING IS NOT DELETING, and the copy says so in both places. The row stays
// in the database, keeps its moderation history, and keeps appearing under
// Archived on your own listings. What changes is that it comes off the network.
// "Delete" would be a lie about a soft delete, and "Remove" alone leaves people
// guessing whether their record went with it.
//
// A SIBLING OF THE POST FORM, NOT A CHILD. This renders its own <form>, and a
// <form> nested inside another is invalid HTML — the browser silently drops the
// inner one, so the button would post the edit instead of the archive.

import { useActionState, useState } from "react";
import { archiveListing, type ArchiveListingState } from "@/lib/listings/archive";
import type { ListingStatus } from "@/lib/cl/listings-read";

const INITIAL: ArchiveListingState = { error: null };

export default function ClRemoveListing({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(archiveListing, INITIAL);

  return (
    <div
      className="mt-[clamp(32px,4vw,52px)] border-t pt-6"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <div className="cl-grouplabel mb-2">Take it down</div>

      {!confirming ? (
        <>
          <p
            className="max-w-[52ch] text-[13px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            {status === "pending"
              ? "This listing is still in review. Taking it down pulls it out of the queue — it won’t go live."
              : "The listing comes off the network. It stays in your records, under Archived."}
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cl-ghost mt-4"
            style={{ color: "var(--cl-red)", borderColor: "var(--cl-error-panel-border)" }}
          >
            Take this listing down
          </button>
        </>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="id" value={listingId} />
          <p
            className="max-w-[52ch] text-[13px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            Take it down? It comes off the network
            {status === "pending" ? " and out of review" : ""}, and stays in your
            records under Archived. You can&rsquo;t put it back yourself — post a
            new one instead.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
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

      {state.error && <p className="cl-fielderror mt-3">{state.error}</p>}
    </div>
  );
}
