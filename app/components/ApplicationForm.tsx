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
    <form action={submitAction} className="space-y-10">
      {/* ---------- Name ---------- */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base focus:border-ink focus:outline-none transition-colors"
        />
      </div>

      {/* ---------- Email ---------- */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base focus:border-ink focus:outline-none transition-colors"
        />
      </div>

      {/* ---------- Neighborhood ---------- */}
      <div>
        <label
          htmlFor="neighborhood"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          Neighborhood
        </label>
        <select
          id="neighborhood"
          name="neighborhood"
          required
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base focus:border-ink focus:outline-none transition-colors appearance-none cursor-pointer"
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
          <label
            htmlFor="otherNeighborhood"
            className="block text-xs tracking-widest uppercase text-slate mb-3"
          >
            Where, then?
          </label>
          <input
            type="text"
            id="otherNeighborhood"
            name="otherNeighborhood"
            required
            placeholder="e.g. Williamsburg, Cobble Hill"
            className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* ---------- Instagram or LinkedIn ---------- */}
      <div>
        <label
          htmlFor="social"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          Instagram or LinkedIn
        </label>
        <input
          type="text"
          id="social"
          name="social"
          required
          placeholder="@you on Instagram or linkedin.com/in/you"
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors"
        />
      </div>

      {/* ---------- Use Cases ---------- */}
      <div>
        <p className="block text-xs tracking-widest uppercase text-slate mb-4">
          What might you use it for?{" "}
          <span className="normal-case tracking-normal text-slate/60">
            (pick any)
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {USE_CASES.map((useCase) => (
            <label
              key={useCase}
              className="flex items-center gap-3 text-sm text-ink cursor-pointer group"
            >
              <input
                type="checkbox"
                name="useCases"
                value={useCase}
                className="h-4 w-4 border border-ink/30 rounded-none accent-park cursor-pointer"
              />
              <span className="group-hover:text-ink transition-colors">
                {useCase}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ---------- About ---------- */}
      <div>
        <label
          htmlFor="about"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          A little about you{" "}
          <span className="normal-case tracking-normal text-slate/60">
            (optional)
          </span>
        </label>
        <textarea
          id="about"
          name="about"
          rows={3}
          placeholder="Two sentences is plenty."
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* ---------- Referred By ---------- */}
      <div>
        <label
          htmlFor="referee"
          className="block text-xs tracking-widest uppercase text-slate mb-3"
        >
          Referred By{" "}
          <span className="normal-case tracking-normal text-slate/60">
            (optional)
          </span>
        </label>
        <input
          type="text"
          id="referee"
          name="referee"
          placeholder="If a member sent you, who?"
          className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors"
        />
      </div>

      {/* ---------- Submit ---------- */}
      <div className="pt-4 text-center">
        <button
          type="submit"
          className="inline-block bg-park text-bone px-10 py-4 rounded text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
        >
          Submit Application
        </button>
      </div>
    </form>
  );
}
