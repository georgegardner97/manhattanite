"use client";

// InviteForm — a member invites someone by name + email. The insert + email
// run server-side (createInvite, where the session and RLS live); this owns the
// stateful UI and inline result via useActionState.
//
// On success we keep the form on screen (remounted empty via the key) under a
// confirmation line, because inviting several people in a row is the common
// case — no navigating away.

import { useActionState } from "react";
import { createInvite, type CreateInviteState } from "@/lib/invites/create";

const INITIAL: CreateInviteState = { error: null, sentTo: null };

const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";
const HINT = "font-serif italic normal-case tracking-normal text-slate/70 ml-1";

export default function InviteForm() {
  const [state, formAction, isPending] = useActionState(createInvite, INITIAL);

  return (
    <div>
      {state.sentTo && (
        <p className="mb-10 text-center font-serif text-lg text-ink leading-relaxed">
          Invitation sent to{" "}
          <span className="italic">{state.sentTo}</span>. They&rsquo;ll arrive
          vouched for by you. Invite someone else below.
        </p>
      )}

      {/* key changes on each successful send → the form remounts empty. */}
      <form key={state.sentTo ?? "new"} action={formAction} className="space-y-12">
        <div>
          <label htmlFor="name" className={LABEL}>
            Their name
            <span className={HINT}>(optional)</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            maxLength={80}
            placeholder="e.g. Alex Rivera"
            className={FIELD_BASE}
          />
        </div>

        <div>
          <label htmlFor="email" className={LABEL}>
            Their email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="alex@example.com"
            className={FIELD_BASE}
          />
        </div>

        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <div className="pt-4 text-center">
          <button
            type="submit"
            disabled={isPending}
            className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}
