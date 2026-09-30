"use client";

// Propose a Manhattanite: the invite form in the Classifieds system.
//
// PROPOSE, NOT JUST INVITE (George, 2026-09-30, lifted from the Radio H-P
// "Propose a Listener" page). Two additions: a note on why they belong here,
// which the admin reads beside their application (migration 0034), and a tick
// box where the member vouches for them in so many words. Both are required
// here AND in createInvite; the form's `required` is ergonomics, the action is
// the rule. The note never reaches the invitee (get_invite does not select it).
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
          They arrive vouched for by you. Propose someone else below.
        </div>
      )}

      {/* key changes on each successful send → the form remounts empty. */}
      <form key={state.sentTo ?? "new"} action={formAction}>
        <div className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="cl-invite-name" className="cl-fieldlabel">
              Their name
            </label>
            <input
              id="cl-invite-name"
              name="name"
              type="text"
              required
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

          <div>
            <label htmlFor="cl-invite-note" className="cl-fieldlabel">
              A little about them
            </label>
            <p
              className="-mt-1 mb-2 text-[12.5px]"
              style={{ color: "var(--cl-faint)" }}
            >
              Read before they are let in. They never see it.
            </p>
            <textarea
              id="cl-invite-note"
              name="note"
              required
              maxLength={1000}
              disabled={isPending}
              className="cl-textarea"
              placeholder="How you know them, and why they belong here."
            />
          </div>
        </div>

        {/* The vouch as an act, not a paragraph. The wording matches the rule
            in /terms: a voucher is assessed alongside the person, not expelled
            with them. Do not sharpen it without changing the Terms first. */}
        <label
          htmlFor="cl-invite-vouch"
          className="mt-6 flex cursor-pointer items-start gap-3 text-[14px] leading-[1.55]"
        >
          <input
            id="cl-invite-vouch"
            name="vouch"
            type="checkbox"
            required
            disabled={isPending}
            className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer"
            style={{ accentColor: "var(--cl-ink)" }}
          />
          <span>
            I vouch for this person&rsquo;s character, reliability and place
            here. My name goes beside theirs, and I stand by it.
          </span>
        </label>

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
          {isPending ? "Sending…" : "Propose them"}
        </button>

        {/* The consequence, stated at the point of the decision rather than in
            the introduction: your name is attached to theirs, publicly, and
            that is the whole mechanic. */}
        <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
          You&rsquo;ll be named as the member who vouched for them, on their
          profile and beside every listing they post. If they break the terms,
          your membership is assessed alongside theirs. A person reads every
          new member, so it takes a few days.
        </p>
      </form>
    </div>
  );
}
