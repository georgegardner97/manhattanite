"use client";

// Screen 05 — the post flow, in the Classifieds system.
//
// ONE FORM, THREE VIEWS. The design draws three steps whose pills advance, and
// the obvious reading is three forms and a wizard behind them. That would mean
// holding a half-written listing in client state across steps, and losing it to
// any refresh. So every field is mounted the whole time and the steps only
// change what is VISIBLE — the last step submits one complete form, once, to
// the real createListing.
//
// Fields are hidden with CSS, never unmounted: an unmounted input posts nothing,
// so conditionally rendering step 1 would silently drop the title and price the
// moment you reached step 3. This is the bug that shape of code invites, and it
// is why the steps are `hidden` rather than `&&`.
//
// WHAT THIS ACTUALLY DOES: writes a real row to the real database, as `pending`.
// The 0017 trigger pins that status server-side, so nothing posted here can
// reach the network without passing the moderation queue at /admin/moderation.
// That is the only reason a preview is allowed to have a working post form.
//
// CATEGORIES ARE THE FOUR THAT EXIST. The design offers nine (Apartment, Sublet,
// Room, Furniture, Bike, Art, Service, Ticket, Job); the listings type enum has
// four, and this slice makes no schema changes. Same call as the browse rail.

import { useActionState, useState } from "react";
import { createListing, type CreateListingState } from "@/lib/listings/create";
import ClImageUpload from "@/app/design/ClImageUpload";

const INITIAL: CreateListingState = { error: null };

const TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "furniture", label: "Furniture" },
  { value: "service", label: "Service" },
  { value: "other", label: "Everything else" },
] as const;

const STEPS = [
  { label: "Details", note: "Category, title, price, neighborhood." },
  { label: "Photos", note: "Photos of the actual item or place." },
  { label: "Review", note: "Read by a person before it goes live." },
];

export default function ClPostForm({
  userId,
  authorName,
  sponsorNames,
}: {
  userId: string;
  authorName: string | null;
  sponsorNames: string[];
}) {
  const [state, formAction, isPending] = useActionState(createListing, INITIAL);
  const [step, setStep] = useState(0);

  // Controlled only for the fields the review step has to read back. Everything
  // else stays uncontrolled — the form element is the source of truth.
  const [type, setType] = useState<string>("apartment");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const isApartment = type === "apartment";
  const last = step === STEPS.length - 1;

  return (
    <form action={formAction}>
      {/* ---------- Step pills ---------- */}
      <div className="mb-[26px] flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setStep(i)}
            aria-current={i === step ? "step" : undefined}
            className={`cl-chip${i === step ? " cl-chip-on" : ""}`}
            style={{ fontSize: "12.5px" }}
          >
            {i + 1} · {s.label}
          </button>
        ))}
      </div>

      <h2 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
        {STEPS[step].label}
      </h2>
      <p className="mt-2.5 text-[13.5px]" style={{ color: "var(--cl-muted)" }}>
        {STEPS[step].note}
      </p>

      {/* ---------- 1 · Details ---------- */}
      <div hidden={step !== 0} className="mt-7 flex flex-col gap-[18px]">
        <fieldset>
          <legend className="cl-fieldlabel">Category</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              // A real radio, visually hidden behind its label — the group is
              // keyboard-navigable with arrow keys and posts without JS.
              <label
                key={t.value}
                className={`cl-chip cursor-pointer${type === t.value ? " cl-chip-on" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="cl-title" className="cl-fieldlabel">
            Title
          </label>
          <input
            id="cl-title"
            name="title"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="cl-input"
            placeholder="What it is"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
          <div>
            <label htmlFor="cl-price" className="cl-fieldlabel">
              Price {isApartment && <span style={{ color: "var(--cl-faint)" }}>per month</span>}
            </label>
            <input
              id="cl-price"
              name="price"
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="cl-input"
              placeholder="$"
            />
          </div>
          <div>
            <label htmlFor="cl-hood" className="cl-fieldlabel">
              Neighborhood
            </label>
            <input
              id="cl-hood"
              name="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="cl-input"
              placeholder="West Village"
            />
          </div>
        </div>

        {/* Apartment-only extras. `hidden` again rather than unmounted, so
            switching category twice doesn't lose what was typed. */}
        <div hidden={!isApartment} className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
          <div>
            <label htmlFor="cl-beds" className="cl-fieldlabel">
              Bedrooms
            </label>
            <input id="cl-beds" name="bedrooms" inputMode="numeric" className="cl-input" placeholder="1" />
          </div>
          <div>
            <label htmlFor="cl-from" className="cl-fieldlabel">
              Available from
            </label>
            <input id="cl-from" name="available_from" className="cl-input" placeholder="June 15" />
          </div>
        </div>

        <div>
          <label htmlFor="cl-desc" className="cl-fieldlabel">
            Details
          </label>
          <textarea
            id="cl-desc"
            name="description"
            required
            maxLength={4000}
            className="cl-textarea"
            placeholder="Condition, timing, anything a buyer should know."
          />
        </div>
      </div>

      {/* ---------- 2 · Photos ---------- */}
      <div hidden={step !== 1} className="mt-7">
        <ClImageUpload userId={userId} />
      </div>

      {/* ---------- 3 · Review ---------- */}
      <div hidden={step !== 2} className="mt-7">
        <div
          className="rounded-[12px] border p-[22px]"
          style={{
            borderColor: "var(--cl-border-control)",
            background: "var(--cl-white)",
          }}
        >
          <div className="cl-kicker">
            {[neighborhood.trim(), TYPES.find((t) => t.value === type)?.label]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="mt-1.5 text-[17.5px] leading-[1.3]">
            {title.trim() || (
              <span style={{ color: "var(--cl-disabled)" }}>Untitled — go back to step 1</span>
            )}
          </div>
          <div className="mt-2 text-[14px] tabular-nums">
            {price.trim() ? `$${price.trim()}${isApartment ? "/mo" : ""}` : "—"}
          </div>

          <p className="cl-inset mt-5">
            Posted as {authorName ?? "you"}
            {sponsorNames.length > 0 && ` · vouched by ${sponsorNames[0]}`}. Buyers
            reply to your email address.
          </p>
        </div>
      </div>

      {state.error && (
        <p className="cl-fielderror mt-4" role="alert">
          {state.error}
        </p>
      )}

      {/* ---------- Controls ---------- */}
      <div className="mt-[30px] flex flex-wrap items-center gap-4">
        {last ? (
          <button
            type="submit"
            disabled={isPending}
            className={isPending ? "cl-pill-disabled" : "cl-pill"}
          >
            {isPending ? "Submitting…" : "Submit listing"}
          </button>
        ) : (
          // type="button": without it this is a submit, and "Continue" would
          // post a half-filled listing from step 1.
          <button type="button" onClick={() => setStep(step + 1)} className="cl-pill">
            Continue
          </button>
        )}

        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="cl-quiet">
            Back
          </button>
        )}
      </div>

      {last && (
        <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
          Submitted listings wait for a moderator. Yours will show as pending
          until then.
        </p>
      )}
    </form>
  );
}
