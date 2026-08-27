"use client";

// The two token-flow buttons, in the Classifieds system. One file because they
// are the same object — a single decision taken from an email link — and
// keeping them together stops one drifting from the other.
//
//   ClAcceptInvite      — a signed-in Tier-1 account accepts an invitation.
//   ClSponsorActions    — a member confirms or declines a request to vouch.
//
// Both are restyles: the work stays in acceptInviteAction and
// respondToSponsorship, where the session and the DEFINER functions that check
// who is asking already live.

import { useActionState } from "react";
import {
  acceptInviteAction,
  type AcceptInviteState,
} from "@/lib/invites/accept";
import {
  respondToSponsorship,
  type RespondState,
} from "@/lib/sponsorship/respond";

const ACCEPT_INITIAL: AcceptInviteState = { error: null };
const RESPOND_INITIAL: RespondState = { status: "idle" };

export function ClAcceptInvite({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    acceptInviteAction,
    ACCEPT_INITIAL
  );

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className={pending ? "cl-pill-disabled w-full" : "cl-pill w-full"}
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
      {state.error && (
        <p className="cl-fielderror mt-3" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ClSponsorActions({
  token,
  requesterName,
}: {
  token: string;
  requesterName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    respondToSponsorship,
    RESPOND_INITIAL
  );

  // Answered in this session — the buttons go, because the decision is made and
  // a live Decline under a confirmation invites a second thought that the
  // action will refuse anyway.
  if (state.status === "confirmed" || state.status === "declined") {
    return (
      <div>
        <div className="text-[17px]">
          {state.status === "confirmed"
            ? `You’ve vouched for ${requesterName}.`
            : "Noted — you’ve declined."}
        </div>
        <p
          className="mt-2.5 text-[13.5px] leading-[1.55]"
          style={{ color: "var(--cl-muted)" }}
        >
          {state.status === "confirmed"
            ? "Thank you. Every application still gets a final look, so we’ll take it from here."
            : `${requesterName} won’t be told who declined. Thanks for letting us know.`}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && (
        <p className="cl-fielderror mb-3" role="alert">
          {state.message}
        </p>
      )}

      {/* Confirm is the filled pill and Decline is naked text — the system's
          own weights, and the right ones here: declining is a legitimate answer
          that should cost nothing, but it is not the action the page is for. */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="decision"
          value="confirm"
          disabled={isPending}
          className={isPending ? "cl-pill-disabled" : "cl-pill"}
        >
          {isPending ? "Saving…" : `I vouch for ${requesterName}`}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          disabled={isPending}
          className="cl-quiet px-2 py-[11px]"
        >
          Decline
        </button>
      </div>
    </form>
  );
}
