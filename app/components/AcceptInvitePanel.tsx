"use client";

// AcceptInvitePanel — the button a logged-in Tier-1 account uses to accept an
// invite (the "signed up first, invited later" path). The work runs server-side
// in acceptInviteAction; this owns the pending state + inline error.

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteState } from "@/lib/invites/accept";

const INITIAL: AcceptInviteState = { error: null };

export default function AcceptInvitePanel({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction, INITIAL);

  return (
    <form action={action} className="text-center">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
      {state.error && (
        <p className="mt-6 text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
