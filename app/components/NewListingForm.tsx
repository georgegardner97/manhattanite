"use client";

import { useActionState, useState } from "react";
import { createListing } from "@/lib/listings/create";
import { updateListing } from "@/lib/listings/update";
import ImageUpload from "@/app/components/ImageUpload";

// The insert/update runs server-side (createListing / updateListing, where
// the Supabase session and RLS live). This client component owns the stateful
// UI: the apartment/furniture type switch that reveals different fields, and
// inline error display via useActionState. Same action-as-server,
// form-as-client split as ApplicationForm.
//
// One form, two modes. Without `initial` it creates (the /listings/new flow,
// unchanged). With `initial` it edits: fields pre-fill, the listing id rides
// along as a hidden field, and submit goes to updateListing instead.

// Both actions return the same { error } shape.
type ListingFormState = { error: string | null };

// Pre-fill payload for edit mode, assembled by the edit page (server side,
// where price formatting and image-URL signing happen).
export type ListingFormInitial = {
  id: string;
  type: "apartment" | "furniture";
  title: string;
  description: string;
  price: string; // dollars, as the input shows it
  details: Record<string, unknown>;
  images: { path: string; previewUrl: string }[];
};

// Shared field styles — lifted from ApplicationForm for visual consistency.
const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";
const HINT =
  "font-serif italic normal-case tracking-normal text-slate/70 ml-1";

const INITIAL: ListingFormState = { error: null };

const CONDITIONS = ["new", "like new", "good", "fair"];

// Pull a details value out as an input-friendly string ("" when absent).
function detailString(
  details: Record<string, unknown> | undefined,
  key: string
): string {
  const value = details?.[key];
  return value === undefined || value === null ? "" : String(value);
}

export default function NewListingForm({
  userId,
  initial,
}: {
  userId: string;
  initial?: ListingFormInitial;
}) {
  const isEdit = Boolean(initial);
  const [state, formAction, isPending] = useActionState<
    ListingFormState,
    FormData
  >(isEdit ? updateListing : createListing, INITIAL);

  // Drives which type-specific fields render. Defaults to apartment so the
  // form is never in an unselected state.
  const [type, setType] = useState<"apartment" | "furniture">(
    initial?.type ?? "apartment"
  );

  return (
    <form action={formAction} className="space-y-12">
      {/* Edit mode: which listing this is. The action re-checks ownership. */}
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {/* ---------- Type ---------- */}
      <div>
        <p className={LABEL}>What are you listing?</p>
        <div className="flex gap-8">
          {(["apartment", "furniture"] as const).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-3 text-[15px] text-ink cursor-pointer group capitalize"
            >
              <input
                type="radio"
                name="type"
                value={opt}
                checked={type === opt}
                onChange={() => setType(opt)}
                className="mh-checkbox"
              />
              <span className="transition-colors group-hover:text-ink/80">
                {opt}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ---------- Title ---------- */}
      <div>
        <label htmlFor="title" className={LABEL}>
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          maxLength={80}
          defaultValue={initial?.title}
          placeholder={
            type === "apartment"
              ? "e.g. Two-bedroom in the West Village"
              : "e.g. Ceccotti walnut dining table"
          }
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Description ---------- */}
      <div>
        <label htmlFor="description" className={LABEL}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={2000}
          rows={5}
          defaultValue={initial?.description}
          placeholder="The details a member would want. Be specific, and name the flaws."
          className={`${FIELD_BASE} resize-none`}
        />
      </div>

      {/* ---------- Price ---------- */}
      <div>
        <label htmlFor="price" className={LABEL}>
          {type === "apartment" ? "Monthly rent ($)" : "Asking price ($)"}
        </label>
        <input
          type="number"
          id="price"
          name="price"
          required
          min="0"
          step="any"
          inputMode="decimal"
          defaultValue={initial?.price}
          placeholder={type === "apartment" ? "5400" : "1200"}
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Apartment-specific ---------- */}
      {type === "apartment" && (
        <>
          <div>
            <label htmlFor="neighborhood" className={LABEL}>
              Neighborhood
            </label>
            <input
              type="text"
              id="neighborhood"
              name="neighborhood"
              defaultValue={detailString(initial?.details, "neighborhood")}
              placeholder="e.g. West Village"
              className={FIELD_BASE}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label htmlFor="bedrooms" className={LABEL}>
                Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                min="0"
                step="1"
                defaultValue={detailString(initial?.details, "bedrooms")}
                placeholder="2"
                className={FIELD_BASE}
              />
            </div>
            <div>
              <label htmlFor="bathrooms" className={LABEL}>
                Bathrooms
              </label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                min="0"
                step="0.5"
                defaultValue={detailString(initial?.details, "bathrooms")}
                placeholder="1"
                className={FIELD_BASE}
              />
            </div>
          </div>

          <div>
            <label htmlFor="available_from" className={LABEL}>
              Available from
            </label>
            <input
              type="date"
              id="available_from"
              name="available_from"
              defaultValue={detailString(initial?.details, "available_from")}
              className={`${FIELD_BASE} mh-select`}
            />
          </div>
        </>
      )}

      {/* ---------- Furniture-specific ---------- */}
      {type === "furniture" && (
        <>
          <div>
            <label htmlFor="condition" className={LABEL}>
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              defaultValue={detailString(initial?.details, "condition")}
              className={`${FIELD_BASE} mh-select appearance-none cursor-pointer capitalize`}
            >
              <option value="" disabled>
                Select a condition
              </option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dimensions" className={LABEL}>
              Dimensions
              <span className={HINT}>(W × D × H, in inches)</span>
            </label>
            <input
              type="text"
              id="dimensions"
              name="dimensions"
              defaultValue={detailString(initial?.details, "dimensions")}
              placeholder="e.g. 72 × 38 × 30"
              className={FIELD_BASE}
            />
          </div>

          <div>
            <label htmlFor="brand" className={LABEL}>
              Brand
              <span className={HINT}>(optional)</span>
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              defaultValue={detailString(initial?.details, "brand")}
              placeholder="e.g. Ceccotti Collezioni"
              className={FIELD_BASE}
            />
          </div>
        </>
      )}

      {/* ---------- Photos ---------- */}
      <ImageUpload userId={userId} initialItems={initial?.images} />

      {/* ---------- Error ---------- */}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      {/* ---------- Submit ---------- */}
      <div className="pt-8 text-center">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending
            ? isEdit
              ? "Saving…"
              : "Posting…"
            : isEdit
              ? "Save changes"
              : "Post a listing"}
        </button>
      </div>
    </form>
  );
}
