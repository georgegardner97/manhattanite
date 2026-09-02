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
//
// THE ANSWER IS THE CONFIRMATION. There is no survey after the fact and no
// extra step: the four buttons ARE the confirm control, so recording why a
// listing came down costs the member nothing over the single button that used
// to sit here. A question asked afterwards gets answered by nobody, and one
// asked as a toll gets answered dishonestly by people trying to leave. The four
// values, why NULL is meaningful, and why there is no RLS change are all in
// supabase/migrations/0031_listing_outcome.sql — not restated here.
//
// FOUR SUBMITS, ONE FORM. Each carries name="outcome" and its own value; the
// browser sends only the clicked submitter's pair, so the choice arrives in the
// action with no client state and no hidden field to keep in sync.
//
// NOT RED, AND NOT FOUR PILLS. Four destructive-looking buttons in a row reads
// as four ways to do damage. These are choices, so they take the rail's own
// furniture — full-width rows in a panel, the same pattern as the filter rail.
// The red stays on the control that opens this step, where the destruction is.

import { useActionState, useId, useState } from "react";
import { archiveListing, type ArchiveListingState } from "@/lib/listings/archive";
import type { ListingStatus } from "@/lib/cl/listings-read";

const INITIAL: ArchiveListingState = { error: null };

// Order is deliberate: the two that found their person first, then the two that
// did not. Values must stay in step with the check constraint in 0031.
const OUTCOMES: { value: string; label: string }[] = [
  { value: "found_here", label: "Found its person here" },
  { value: "found_elsewhere", label: "Sorted, but not through Manhattanite" },
  { value: "withdrawn", label: "Changed my mind" },
  { value: "no_luck", label: "No luck — nobody suitable" },
];

export default function ClRemoveListing({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(archiveListing, INITIAL);
  const groupId = useId();

  // A pending listing was never published, so it cannot have found anyone —
  // it keeps the single button and writes no outcome. Same branch the copy
  // above already turns on.
  const asks = status !== "pending";

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

          {asks ? (
            <>
              <div id={groupId} className="cl-grouplabel mt-5 mb-2">
                Why is it coming down?
              </div>
              <div
                role="group"
                aria-labelledby={groupId}
                className="cl-panel max-w-[52ch] p-1.5"
              >
                {OUTCOMES.map((o) => (
                  <button
                    key={o.value}
                    type="submit"
                    name="outcome"
                    value={o.value}
                    disabled={isPending}
                    className="cl-rail-row w-full text-left"
                    style={isPending ? { opacity: 0.5, cursor: "wait" } : undefined}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
                  {isPending ? "Taking it down…" : "Whichever you pick takes it down."}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                  className="cl-quiet"
                >
                  Keep it
                </button>
              </div>
            </>
          ) : (
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
          )}
        </form>
      )}

      {state.error && <p className="cl-fielderror mt-3">{state.error}</p>}
    </div>
  );
}
