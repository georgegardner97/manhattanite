"use client";

// Bring someone in — the invite form in the Classifieds system.
//
// A restyle of the editorial InviteForm, not a reimplementation: the same
// createInvite server action, where the session, the membership check and RLS
// (invites_insert_own, 0020) all live. Only the chrome is new.
//
// THE FORM STAYS ON SCREEN AFTER A SEND, remounted empty by the key, because
// inviting two or three people in one sitting is the normal case and navigating
// away after each one makes the member do the whole journey again.

import { useActionState } from "react";
import { createInvite, type CreateInviteState } from "@/lib/invites/create";

const INITIAL: CreateInviteState = { error: null, sentTo: null };

export default function ClInviteForm() {
  const [state, formAction, isPending] = useActionState(createInvite, INITIAL);

  return (
    <div>
      {state.sentTo && (
        <div className="cl-note mb-6">
          Invitation sent to <strong className="font-medium">{state.sentTo}</strong>.
          They&rsquo;ll arrive vouched for by you. Invite someone else below.
        </div>
      )}

      {/* key changes on each successful send → the form remounts empty. */}
      <form key={state.sentTo ?? "new"} action={formAction}>
        <div className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="cl-invite-name" className="cl-fieldlabel">
              Their name{" "}
              <span style={{ color: "var(--cl-faint)" }}>optional</span>
            </label>
            <input
              id="cl-invite-name"
              name="name"
              type="text"
              maxLength={80}
              disabled={isPending}
              className="cl-input"
              placeholder="e.g. Alex Rivera"
            />
          </div>

          <div>
            <label htmlFor="cl-invite-email" className="cl-fieldlabel">
              Their email
            </label>
            <input
              id="cl-invite-email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="cl-input"
              placeholder="alex@example.com"
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
          {isPending ? "Sending…" : "Send invitation"}
        </button>

        {/* The consequence, stated at the point of the decision rather than in
            the introduction: your name is attached to theirs, publicly, and
            that is the whole mechanic. */}
        <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
          You&rsquo;ll be named as the member who vouched for them. We still read
          every new member by hand.
        </p>
      </form>
    </div>
  );
}
