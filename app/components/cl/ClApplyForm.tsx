"use client";

// Screen 09's request-access form, wired to the real application pipeline.
//
// Same submitApplication the live /apply calls, same fields, same anti-spam
// pair (a honeypot the eye can't see plus a dwell-time floor). Nothing here is
// a re-implementation — it is the live action wearing the Classifieds clothes.
//
// TWO HONEST DEPARTURES FROM THE DESIGN CARD:
//
//   No email field. The design's card collects one, because it imagines a
//   stranger applying cold. The real pipeline takes the email from the session:
//   you make an account, then you apply. Rendering an email box that the action
//   ignores would be a lie the size of a whole field.
//
//   Submitting leaves the preview. submitApplication ends in redirect("/apply"),
//   which is the live editorial page, where the pending-row guard takes over.
//   That redirect lives in shared code this slice must not edit, so the form is
//   genuinely real right up to the moment it hands you to the other design
//   system. Worth knowing before you press it.

import { useActionState, useState } from "react";
import {
  submitApplication,
  type SubmitApplicationState,
} from "@/lib/applications/submit";

const INITIAL: SubmitApplicationState = { error: null };

export default function ClApplyForm({
  defaultName,
  defaultNeighborhood,
}: {
  defaultName: string | null;
  defaultNeighborhood: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    submitApplication,
    INITIAL
  );

  // Stamped once at mount. The action drops anything submitted within 2.5s of
  // this timestamp — a person cannot fill four fields that fast, a bot can.
  const [loadedAt] = useState(() => Date.now());

  return (
    <form action={formAction}>
      {/* The honeypot. Off-screen rather than display:none, because some bots
          skip hidden inputs; aria-hidden and tabIndex keep it away from anyone
          using a screen reader or the keyboard. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="cl-company">Company</label>
        <input id="cl-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="form_loaded_at" value={loadedAt} />

      <div className="flex flex-col gap-3.5">
        <div>
          <label htmlFor="cl-name" className="cl-fieldlabel">
            Your name
          </label>
          <input
            id="cl-name"
            name="name"
            type="text"
            required
            defaultValue={defaultName ?? ""}
            disabled={isPending}
            className="cl-input"
            placeholder="First and last"
          />
        </div>

        <div>
          <label htmlFor="cl-neighborhood" className="cl-fieldlabel">
            Your neighborhood
          </label>
          <input
            id="cl-neighborhood"
            name="neighborhood"
            type="text"
            required
            defaultValue={defaultNeighborhood ?? ""}
            disabled={isPending}
            className="cl-input"
            placeholder="West Village"
          />
        </div>

        <div>
          <label htmlFor="cl-occupation" className="cl-fieldlabel">
            What you do
          </label>
          <input
            id="cl-occupation"
            name="occupation"
            type="text"
            disabled={isPending}
            className="cl-input"
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="cl-sponsor" className="cl-fieldlabel">
            Who&rsquo;s vouching for you
          </label>
          <input
            id="cl-sponsor"
            name="sponsor_reference"
            type="text"
            disabled={isPending}
            className="cl-input"
            placeholder="Member's name, or leave blank"
          />
        </div>

        <div>
          <label htmlFor="cl-about" className="cl-fieldlabel">
            A line about you
          </label>
          <textarea
            id="cl-about"
            name="about"
            maxLength={2000}
            disabled={isPending}
            className="cl-textarea"
            style={{ minHeight: "96px" }}
            placeholder="In your own words."
          />
        </div>
      </div>

      {state.error && (
        <p className="cl-fielderror mt-3" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={isPending ? "cl-pill-disabled mt-6" : "cl-pill mt-6"}
      >
        {isPending ? "Sending…" : "Send request"}
      </button>

      <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
        Read by a person, usually within a week.
      </p>
    </form>
  );
}
