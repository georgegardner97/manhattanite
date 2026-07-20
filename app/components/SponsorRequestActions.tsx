// SponsorRequestActions — the Confirm / Decline buttons on the sponsorship
// request page. Client component (useActionState), so the page can stay a
// Server Component. Two submit buttons share one form; the clicked button's
// name/value ("decision") tells the action which way the member chose.

"use client";

import { useActionState } from "react";
import { respondToSponsorship, type RespondState } from "@/lib/sponsorship/respond";

const INITIAL: RespondState = { status: "idle" };

export default function SponsorRequestActions({
  token,
  requesterName,
}: {
  token: string;
  requesterName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    respondToSponsorship,
    INITIAL
  );

  if (state.status === "confirmed") {
    return (
      <div className="max-w-md mx-auto text-center space-y-5">
        <p className="font-serif text-2xl text-ink">
          You&rsquo;ve vouched for {requesterName}.
        </p>
        <p className="font-serif text-lg leading-relaxed text-slate">
          Thank you. Manhattanite gives every application a final look, so
          we&rsquo;ll take it from here.
        </p>
      </div>
    );
  }

  if (state.status === "declined") {
    return (
      <div className="max-w-md mx-auto text-center space-y-5">
        <p className="font-serif text-2xl text-ink">Noted — you&rsquo;ve declined.</p>
        <p className="font-serif text-lg leading-relaxed text-slate">
          {requesterName} won&rsquo;t be told who declined. Thanks for letting us
          know.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md mx-auto">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && (
        <p className="mb-8 text-center text-sm text-red-700">{state.message}</p>
      )}

      <div className="flex flex-col items-center gap-6">
        <button
          type="submit"
          name="decision"
          value="confirm"
          disabled={isPending}
          className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? "Saving…" : `Confirm — I vouch for ${requesterName}`}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          disabled={isPending}
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer disabled:opacity-40"
        >
          Decline
        </button>
      </div>
    </form>
  );
}
