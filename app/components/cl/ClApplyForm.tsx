"use client";

// The joining profile — what a newly invited person fills in, wired to the
// real application pipeline.
//
// IT WAS A "REQUEST ACCESS" FORM UNTIL 2026-09-08, and the rename is the
// change. George walked the invitation path that evening and landed here
// minutes after being vouched for, on a form that asked him to request access
// and to name who was vouching for him. The form was a survivor of the
// self-serve world that closed on 4 September: it made sense when a stranger
// could make an account and ask to be let in, and made none once an invitation
// was the only door.
//
// WHAT IT COLLECTS DID NOT CHANGE MUCH; WHERE IT LANDS DID. Name, neighborhood,
// occupation and the paragraph were always here — but the paragraph lived only
// on the applications row, so an approved member arrived on the network as a
// name and an email and nothing else. The action now writes the paragraph to
// accounts.bio and the link to accounts.linkedin_url, which are the columns
// /members/[id] actually reads. Filling this in IS building the profile.
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

        {/* THE "WHO'S VOUCHING FOR YOU" FIELD WAS HERE AND IS GONE (George,
            2026-09-08). It asked a person who had been vouched for four
            minutes earlier to name the person who vouched for them. Worse, it
            was decorative on the only path that now exists: the sponsor is
            derived server-side from the invite (inviter_for_me) and never from
            what is typed here, so an invited person's answer was read by
            nothing.

            WHAT WENT DORMANT WITH IT: sponsor_reference fed request_sponsorship
            (0025) and the /sponsor-request/[token] screen. Both are intact and
            neither is reachable now — the action's block is guarded on a value
            that is always null. That is the fourth screen in this product to
            lose its only entry point, so it is written down rather than
            discovered later (CLAUDE.md note 8). Restoring the field restores
            the flow; nothing was deleted. */}

        <div>
          <label htmlFor="cl-linkedin" className="cl-fieldlabel">
            LinkedIn
          </label>
          <input
            id="cl-linkedin"
            name="linkedin_url"
            // text, NOT url: type="url" makes the browser refuse anything
            // without a scheme — including the placeholder's own
            // "linkedin.com/in/…" — with a native tooltip, before the action
            // can add the https:// or say what is wrong in our own words.
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            disabled={isPending}
            className="cl-input"
            placeholder="linkedin.com/in/… (optional)"
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
            placeholder="In your own words. Other members will read this."
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
        {isPending ? "Saving…" : "Finish and send"}
      </button>

      <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
        A person reads every profile. You&rsquo;ll get an email when
        you&rsquo;re confirmed.
      </p>
    </form>
  );
}
