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
// Styling (Slice 2): renders on the DARK threshold ground, inside AuthShell —
// boxed .mh-input controls (which pick up their dark palette from the .mh-dark
// ancestor) and a dark BoxButton submit. This form has one home, /apply, so the
// dark treatment lives here rather than behind a surface prop.

"use client";

import { useActionState, useState } from "react";
import {
  submitApplication,
  type SubmitApplicationState,
} from "@/lib/applications/submit";
import BoxButton from "@/app/components/BoxButton";

const LABEL = "mh-label block text-bone/60 mb-2.5";
const HINT = "normal-case tracking-normal font-normal text-bone/45 ml-1.5";

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
    <form action={formAction} className="space-y-[22px]">
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
          className="mh-input"
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
          className="mh-input"
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
          className="mh-input"
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
          className="mh-input resize-none"
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
          className="mh-input"
        />
      </div>

      {/* ---------- Error ---------- */}
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}

      {/* ---------- Submit ---------- */}
      <div className="pt-2">
        <BoxButton
          type="submit"
          surface="dark"
          className="w-full text-center"
          disabled={isPending}
        >
          {isPending ? "Sending…" : "Submit application"}
        </BoxButton>
      </div>
    </form>
  );
}
