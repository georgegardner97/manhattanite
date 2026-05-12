"use client";

import { useState } from "react";

// The server action is defined in app/page.tsx and passed in as a prop. This
// is the Next.js 16 / React 19 idiomatic way to keep the action on the server
// (where the API keys live) while still giving us a client component for
// stateful UI like the "Other neighborhood" conditional reveal.
type SubmitAction = (formData: FormData) => Promise<void>;

const NEIGHBORHOOD_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "Below 14th",
    options: [
      "West Village",
      "East Village",
      "SoHo",
      "Tribeca",
      "Lower East Side",
      "Chinatown",
      "Financial District",
    ],
  },
  {
    label: "Midtown",
    options: [
      "Chelsea",
      "Flatiron",
      "Gramercy",
      "Kips Bay",
      "Murray Hill",
      "Hell's Kitchen",
      "Midtown East",
      "Midtown West",
    ],
  },
  {
    label: "Uptown",
    options: [
      "Upper West Side",
      "Upper East Side",
      "Morningside Heights",
      "Harlem",
      "East Harlem",
      "Washington Heights",
      "Inwood",
    ],
  },
  {
    label: "Other",
    options: ["I'm moving to Manhattan soon", "Other"],
  },
];

const USE_CASES = [
  "Find a place to live",
  "Post a place to live",
  "Buy or sell furniture",
  "Hire someone",
  "Offer a service",
  "Find a job or a gig",
  "Just looking around",
];

// Shared classnames for our underline-style inputs. Tightened tracking, ink
// focus border, and subtle 200ms transition.
const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";

// Editorial label style — tracked-out, slightly larger than the default
// uppercase eyebrow. As size goes up, tracking comes down a touch so it
// doesn't read as overly precious.
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";

// "(optional)" / "(pick any)" hints rendered in serif italic for a print-mag feel.
const HINT = "font-serif italic normal-case tracking-normal text-slate/70 ml-1";

export default function ApplicationForm({
  submitAction,
}: {
  submitAction: SubmitAction;
}) {
  // We only need to track the neighborhood value so we can decide whether to
  // show the conditional "Other neighborhood" text field. Everything else is
  // uncontrolled — the form posts its own values directly via the server action.
  const [neighborhood, setNeighborhood] = useState("");
  const showOther = neighborhood === "Other";

  return (
    <form action={submitAction} className="space-y-12">
      {/* ---------- Name ---------- */}
      <div>
        <label htmlFor="name" className={LABEL}>
          Full Name
        </label>
        <input type="text" id="name" name="name" required className={FIELD_BASE} />
      </div>

      {/* ---------- Email ---------- */}
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input type="email" id="email" name="email" required className={FIELD_BASE} />
      </div>

      {/* ---------- Neighborhood ---------- */}
      <div>
        <label htmlFor="neighborhood" className={LABEL}>
          Neighborhood
        </label>
        <select
          id="neighborhood"
          name="neighborhood"
          required
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          className={`${FIELD_BASE} mh-select appearance-none cursor-pointer`}
        >
          <option value="" disabled>
            Select a neighborhood
          </option>
          {NEIGHBORHOOD_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ---------- Other neighborhood (conditional) ---------- */}
      {showOther && (
        <div>
          <label htmlFor="otherNeighborhood" className={LABEL}>
            Where, then?
          </label>
          <input
            type="text"
            id="otherNeighborhood"
            name="otherNeighborhood"
            required
            placeholder="e.g. Williamsburg, Cobble Hill"
            className={FIELD_BASE}
          />
        </div>
      )}

      {/* ---------- Instagram or LinkedIn ---------- */}
      <div>
        <label htmlFor="social" className={LABEL}>
          Instagram or LinkedIn
        </label>
        <input
          type="text"
          id="social"
          name="social"
          required
          placeholder="A profile link."
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Use Cases ---------- */}
      <div>
        <p className={LABEL}>
          What might you use it for?
          <span className={HINT}>(pick any)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
          {USE_CASES.map((useCase) => (
            <label
              key={useCase}
              className="flex items-center gap-3 text-[15px] text-ink cursor-pointer group"
            >
              <input
                type="checkbox"
                name="useCases"
                value={useCase}
                className="mh-checkbox"
              />
              <span className="transition-colors group-hover:text-ink/80">
                {useCase}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ---------- About ---------- */}
      <div>
        <label htmlFor="about" className={LABEL}>
          A little about you
          <span className={HINT}>(optional)</span>
        </label>
        <textarea
          id="about"
          name="about"
          rows={3}
          placeholder="Two sentences is plenty."
          className={`${FIELD_BASE} resize-none`}
        />
      </div>

      {/* ---------- Referred By ---------- */}
      <div>
        <label htmlFor="referee" className={LABEL}>
          Referred By
          <span className={HINT}>(optional)</span>
        </label>
        <input
          type="text"
          id="referee"
          name="referee"
          placeholder="If a member sent you, who?"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Submit ---------- */}
      <div className="pt-8 text-center">
        <button
          type="submit"
          className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink"
        >
          Submit Application
        </button>
      </div>
    </form>
  );
}
