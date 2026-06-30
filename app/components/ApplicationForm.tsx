// Client form for the membership application — Phase 2 Slice A.
//
// Refactored from the dormant waitlist form. The applicant is already signed in,
// so this form no longer collects email (it comes from the session). It pulls
// the account's current name + neighborhood as defaults and writes any changes
// back to the accounts row on submit (see lib/applications/submit.ts).
//
// Fields per the spec (mvp-spec.md): real name, neighborhood, occupation, a
// paragraph in their own words, optional sponsor reference. Name + neighborhood
// are required here (stricter than /profile/edit) — applying is the moment we
// insist on a real name for the byline convention.
//
// Style classes match NewListingForm / ProfileEditForm exactly.

"use client";

import { useActionState, useState } from "react";
import {
  submitApplication,
  type SubmitApplicationState,
} from "@/lib/applications/submit";

const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";
const HINT =
  "font-serif italic normal-case tracking-normal text-slate/70 ml-1";

const INITIAL: SubmitApplicationState = { error: null };

type ApplicationFormProps = {
  defaultName: string | null;
  defaultNeighborhood: string | null;
};

export default function ApplicationForm({
  defaultName,
  defaultNeighborhood,
}: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitApplication,
    INITIAL
  );

  // Timestamp set once when the form mounts. The server action drops any
  // submission that arrives faster than a human could plausibly fill the form
  // (see the dwell-time check in submitApplication). Lazy initializer so it's
  // captured at mount, not on every render.
  const [loadedAt] = useState(() => Date.now());

  return (
    <form action={formAction} className="space-y-12">
      {/* ---------- Honeypot (anti-spam) ----------
          A field no human ever sees or focuses, but a dumb bot will dutifully
          fill. Hidden from sighted users AND assistive tech via off-screen
          positioning (not display:none — some bots skip display:none fields),
          aria-hidden, tabIndex=-1 and autoComplete off. If "company" arrives
          non-empty, the server silently drops the submission. "form_loaded_at"
          powers the dwell-time check. */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <label htmlFor="company">Company</label>
        <input
          type="text"
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="form_loaded_at" value={loadedAt} />

      {/* ---------- Name ---------- */}
      <div>
        <label htmlFor="name" className={LABEL}>
          Full name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={defaultName ?? ""}
          maxLength={80}
          placeholder="e.g. George Gardner"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Neighborhood ---------- */}
      <div>
        <label htmlFor="neighborhood" className={LABEL}>
          Where you live
        </label>
        <input
          type="text"
          id="neighborhood"
          name="neighborhood"
          required
          defaultValue={defaultNeighborhood ?? ""}
          maxLength={60}
          placeholder="e.g. West Village"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Occupation ---------- */}
      <div>
        <label htmlFor="occupation" className={LABEL}>
          What you do
        </label>
        <input
          type="text"
          id="occupation"
          name="occupation"
          required
          maxLength={120}
          placeholder="Your work, in a few words."
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- About ---------- */}
      <div>
        <label htmlFor="about" className={LABEL}>
          A little about you
        </label>
        <textarea
          id="about"
          name="about"
          required
          rows={4}
          maxLength={1500}
          placeholder="Who you are, in your own words. We're not looking for a CV."
          className={`${FIELD_BASE} resize-none`}
        />
      </div>

      {/* ---------- Know a member? (optional) ---------- */}
      <div>
        <label htmlFor="sponsor_reference" className={LABEL}>
          Know a member?
          <span className={HINT}>(optional)</span>
        </label>
        <input
          type="text"
          id="sponsor_reference"
          name="sponsor_reference"
          maxLength={200}
          placeholder="Their email — we'll ask them to vouch for you"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Error ---------- */}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      {/* ---------- Submit ---------- */}
      <div className="pt-8 text-center">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? "Sending…" : "Apply for membership"}
        </button>
      </div>
    </form>
  );
}
