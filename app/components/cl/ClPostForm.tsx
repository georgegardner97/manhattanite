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
// EDITING REUSES THIS FORM, WITHOUT THE STEPS (Slice 2). `initial` pre-fills it
// and switches the write to updateListing; `stepped={false}` renders every field
// on one page with no step chrome. The steps exist to stop a blank form feeling
// like a wall — an edit form is not blank, and you arrived to change one field,
// so making you page through three of them to reach it is friction with nothing
// on the other side. Because every field is already mounted the whole time and
// the steps only toggle visibility, this is a presentation flag and not a second
// code path: the same inputs post the same FormData either way.
//
// AN ADMIN CORRECTING SOMEBODY ELSE'S LISTING REUSES THIS FORM (Slice 3b), via
// mode="admin", which changes exactly one thing: which action reads the
// FormData. That is not laziness, it is the whole point. `details` is rebuilt
// WHOLESALE on save from the fields the form posts, so a reduced admin editor
// would quietly delete bedrooms, condition, dimensions and brand from any
// listing an admin touched. Every field is mounted here the whole time, so
// reusing this form is what makes an admin correction non-destructive.
//
// CATEGORIES ARE THE FOUR THAT EXIST. The design offers nine (Apartment, Sublet,
// Room, Furniture, Bike, Art, Service, Ticket, Job); the listings type enum has
// four, and this slice makes no schema changes. Same call as the browse rail.

import { useActionState, useState } from "react";
import { createListing, type CreateListingState } from "@/lib/listings/create";
import { updateListing } from "@/lib/listings/update";
import { adminUpdateListing } from "@/lib/admin/listings";
import ClImageUpload from "@/app/components/cl/ClImageUpload";
import ClRemoveListing from "@/app/components/cl/ClRemoveListing";
import type { ListingStatus } from "@/lib/cl/listings-read";

const INITIAL: CreateListingState = { error: null };

/** An existing listing, pre-filled for editing. */
export type ClPostFormInitial = {
  id: string;
  type: string;
  title: string;
  description: string;
  /** Whole dollars as a string, the way the price input shows it. */
  price: string;
  details: Record<string, unknown>;
  images: { path: string; previewUrl: string }[];
  status: ListingStatus;
};

const TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "furniture", label: "Furniture" },
  { value: "service", label: "Service" },
  { value: "other", label: "Everything else" },
] as const;

const STEPS = [
  // "where it is" rather than "neighborhood": the field is labelled
  // Neighborhood for three categories and Location for a service (2026-08-28),
  // so naming either one makes this line wrong on the other. This step summary
  // is static across categories and not worth branching for one word.
  { label: "Details", note: "Category, title, price, where it is." },
  { label: "Photos", note: "Photos of the actual item or place." },
  { label: "Review", note: "Read by a person before it goes live." },
];

// Which step each required field lives on, so an invalid one can be shown
// rather than silently blocking the submit. Keyed by the input's `name`.
const STEP_OF_FIELD: Record<string, number> = {
  type: 0,
  title: 0,
  description: 0,
  // `price` is deliberately absent: it is no longer required, so it can never
  // be the field that blocks a submit.
};

export default function ClPostForm({
  userId,
  authorName,
  sponsorNames,
  initial,
  mode = "member",
}: {
  userId: string;
  authorName: string | null;
  sponsorNames: string[];
  /** Present on the edit route: pre-fills the form and switches the write. */
  initial?: ClPostFormInitial;
  /**
   * "admin" routes the save through adminUpdateListing (0028) instead of the
   * owner-only path, and stands the take-down control down — see below.
   */
  mode?: "member" | "admin";
}) {
  const editing = Boolean(initial);
  const isAdmin = mode === "admin";

  // Same FormData either way, so the only difference is which action reads it.
  // updateListing re-checks session, membership and ownership itself and leans
  // on the RLS update policy as the real gate — picking the action here changes
  // nothing about what the database will allow.
  const [state, formAction, isPending] = useActionState(
    isAdmin ? adminUpdateListing : editing ? updateListing : createListing,
    INITIAL
  );

  // Editing renders every field at once, so `step` never moves. See the note at
  // the top: this is presentation, not a second code path.
  const [step, setStep] = useState(0);

  // Controlled only for the fields the review step has to read back. Everything
  // else stays uncontrolled — the form element is the source of truth.
  const [type, setType] = useState<string>(initial?.type ?? "apartment");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [neighborhood, setNeighborhood] = useState(
    detail(initial, "neighborhood")
  );

  const isApartment = type === "apartment";
  const isFurniture = type === "furniture";
  // "other" carries a condition too; service carries only an area served.
  const hasCondition = isFurniture || type === "other";
  const last = step === STEPS.length - 1;

  // A `required` input inside a `hidden` step is the trap this layout sets. The
  // browser refuses to submit an invalid form AND refuses to focus a hidden
  // control to explain why, so pressing Submit from step 3 with an empty title
  // does nothing at all — no message, no movement. Catching it here turns that
  // dead press into a jump back to the step that needs filling in.
  function handleInvalid(e: React.InvalidEvent<HTMLFormElement>) {
    // Nothing is hidden when editing, so the browser can already point at the
    // offending field itself.
    if (editing) return;
    const field = e.target as HTMLInputElement | HTMLTextAreaElement;
    const target = STEP_OF_FIELD[field.name];
    if (target !== undefined && target !== step) {
      setStep(target);
      // The step only becomes visible after this render, so the browser has to
      // be asked again on the next frame — before that the control is still
      // hidden and reportValidity() has nothing it can point at.
      requestAnimationFrame(() => field.reportValidity());
    }
  }

  return (
    <>
      <form action={formAction} onInvalid={handleInvalid}>
        {/* Which row updateListing is allowed to touch. Ownership is re-checked
            server-side against auth.uid(); this is the address, not the key. */}
        {initial && <input type="hidden" name="id" value={initial.id} />}

        {/* ---------- Step pills ---------- */}
        {!editing && (
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
        )}

        {/* NOT IN ADMIN MODE. ClAdminShell has already set the heading and said
            what a correction does; repeating "Edit your listing · it goes back
            through review" under it would put two contradictory sentences a
            hundred pixels apart, and the admin one is the true one. */}
        {!isAdmin && (
          <>
            <h2 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
              {editing ? "Edit your listing" : STEPS[step].label}
            </h2>
            <p className="mt-2.5 text-[13.5px]" style={{ color: "var(--cl-muted)" }}>
              {editing
                ? initial!.status === "draft"
                  ? "Make the changes the moderator asked for, then send it back."
                  : "Change anything. It goes back through review before it’s live again."
                : STEPS[step].note}
            </p>
          </>
        )}

        {/* ---------- 1 · Details ---------- */}
        <div hidden={!editing && step !== 0} className="mt-7 flex flex-col gap-[18px]">
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
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cl-input"
              placeholder="What it is"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <label htmlFor="cl-price" className="cl-fieldlabel">
                Price{" "}
                <span style={{ color: "var(--cl-faint)" }}>
                  {isApartment ? "per month · optional" : "optional"}
                </span>
              </label>
              {/* NOT required. Some listings have no price — a members' rate, a
                  service quoted on request, a perk. Blank stores NULL and the
                  listing renders with no price line at all. */}
              <input
                id="cl-price"
                name="price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="cl-input"
                placeholder="$ — or leave blank"
              />
            </div>
            <div>
              {/* SERVICE SAYS "LOCATION", NOT "AREA SERVED" (George,
                  2026-08-28). "Area served" asks a plumber to describe a
                  coverage radius; most people offering something through this
                  network are answering the simpler question of where they are.
                  Marked optional for the same reason — a service may not have
                  one meaningful location, and the field has never been
                  `required`, so the label was under-reporting what the form
                  already allowed.

                  THE INPUT IS STILL name="neighborhood" AND MUST STAY THAT WAY.
                  It is the key the parser reads (lib/listings/form.ts reads
                  `neighborhood` for all four types) and the key neighborhoodOf()
                  reads back out of `details` for search and the card kicker.
                  Renaming the input would silently drop the value on every
                  save, because `details` is rebuilt wholesale. This is a LABEL
                  change and nothing else. */}
              <label htmlFor="cl-hood" className="cl-fieldlabel">
                {type === "service" ? "Location" : "Neighborhood"}
                {type === "service" && (
                  <>
                    {" "}
                    <span style={{ color: "var(--cl-faint)" }}>optional</span>
                  </>
                )}
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

          {/* Type-specific extras. `hidden` again rather than unmounted, so
              switching category twice doesn't lose what was typed.

              THESE ARE THE FIELDS create.ts AND update.ts ALREADY READ. The post
              form shipped with only two of them, which was survivable while it
              only ever created rows — the unread ones simply stayed unset. It
              stops being survivable on the edit route: updateListing rebuilds
              `details` WHOLESALE from what is posted, so a furniture listing
              edited through a form with no condition/dimensions/brand inputs
              would come back with those keys silently deleted. Rendering every
              field the actions read is what makes the round-trip lossless. */}
          <div hidden={!isApartment} className="grid grid-cols-3 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <label htmlFor="cl-beds" className="cl-fieldlabel">
                Bedrooms
              </label>
              <input
                id="cl-beds"
                name="bedrooms"
                inputMode="numeric"
                defaultValue={detail(initial, "bedrooms")}
                className="cl-input"
                placeholder="1"
              />
            </div>
            <div>
              <label htmlFor="cl-baths" className="cl-fieldlabel">
                Bathrooms
              </label>
              <input
                id="cl-baths"
                name="bathrooms"
                inputMode="numeric"
                defaultValue={detail(initial, "bathrooms")}
                className="cl-input"
                placeholder="1"
              />
            </div>
            <div>
              <label htmlFor="cl-from" className="cl-fieldlabel">
                Available from
              </label>
              <input
                id="cl-from"
                name="available_from"
                defaultValue={detail(initial, "available_from")}
                className="cl-input"
                placeholder="June 15"
              />
            </div>
          </div>

          <div hidden={!hasCondition} className="grid grid-cols-3 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <label htmlFor="cl-condition" className="cl-fieldlabel">
                Condition
              </label>
              <input
                id="cl-condition"
                name="condition"
                defaultValue={detail(initial, "condition")}
                className="cl-input"
                placeholder="Barely used"
              />
            </div>
            <div hidden={!isFurniture}>
              <label htmlFor="cl-dimensions" className="cl-fieldlabel">
                Dimensions
              </label>
              <input
                id="cl-dimensions"
                name="dimensions"
                defaultValue={detail(initial, "dimensions")}
                className="cl-input"
                placeholder="84 × 36 × 30 in"
              />
            </div>
            <div hidden={!isFurniture}>
              <label htmlFor="cl-brand" className="cl-fieldlabel">
                Brand
              </label>
              <input
                id="cl-brand"
                name="brand"
                defaultValue={detail(initial, "brand")}
                className="cl-input"
                placeholder="Vitra"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cl-desc" className="cl-fieldlabel">
              Details
            </label>
            {/* ASK FOR MORE, AND SAY WHY (George, 2026-08-28). The placeholder
                already lists what to include; this is the nudge to keep going.
                It gives the reason rather than the instruction — "as much
                detail as possible" is an order, and a member deciding how much
                to write responds better to what it buys them.

                NOT IN ADMIN MODE. An admin on this form is CORRECTING somebody
                else's listing, not expanding it (CLAUDE.md note 11), so telling
                them to say more contradicts the scope the shell above has just
                set — the same reason the member-facing heading is suppressed. */}
            {!isAdmin && (
              <p
                className="-mt-1 mb-2 text-[12.5px]"
                style={{ color: "var(--cl-faint)" }}
              >
                Say more rather than less — it saves a round of questions later.
              </p>
            )}
            <textarea
              id="cl-desc"
              name="description"
              required
              maxLength={2000}
              defaultValue={initial?.description ?? ""}
              className="cl-textarea"
              placeholder="Condition, timing, anything a buyer should know."
            />
          </div>
        </div>

        {/* ---------- 2 · Photos ---------- */}
        <div hidden={!editing && step !== 1} className="mt-7">
          {editing && <div className="cl-grouplabel mb-3.5">Photos</div>}
          <ClImageUpload userId={userId} initial={initial?.images} />
        </div>

        {/* ---------- 3 · Review ----------
            The review card is the answer to "you are about to post something you
            cannot see yet". On the edit route the listing already exists, so the
            preview would just restate the fields sitting directly above it. */}
        <div hidden={editing || step !== 2} className="mt-7">
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
              {price.trim() ? (
                `$${price.trim()}${isApartment ? "/mo" : ""}`
              ) : (
                // Says it out loud here, where the member is confirming what they
                // are about to post. On the live listing it renders as nothing.
                <span style={{ color: "var(--cl-disabled)" }}>No price</span>
              )}
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
          {editing ? (
            <button
              type="submit"
              disabled={isPending}
              className={isPending ? "cl-pill-disabled" : "cl-pill"}
            >
              {isPending ? "Saving…" : isAdmin ? "Save correction" : "Save changes"}
            </button>
          ) : last ? (
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

          {!editing && step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="cl-quiet">
              Back
            </button>
          )}
        </div>

        {!editing && last && (
          <p className="mt-4 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
            Submitted listings wait for a moderator. Yours will show as pending
            until then.
          </p>
        )}
      </form>

      {/* Taking it down. Destructive, so it sits below the save, carries the
          red accent, asks first, and says what archiving actually does.

          RENDERED OUTSIDE </form> ON PURPOSE. It brings its own <form>, and a
          <form> nested in a <form> is invalid — the browser drops the inner one,
          the submit button re-associates with the outer form, and "Yes, take it
          down" silently saves the edit instead of archiving. That is precisely
          what shipped, for a fortnight, while a comment in this spot said it
          must not. A comment is documentation, not enforcement: the guard that
          actually holds this now is scripts/test-edit-archive.ts. */}
      {/* NEVER FOR AN ADMIN. ClRemoveListing posts archiveListing, which is
          owner-only by design and would answer an admin correcting somebody
          else's listing with "Only your own listings can be removed." Admin
          take-down is its own control, with its own required reason, on
          /admin/listings. */}
      {editing && !isAdmin && initial!.status !== "archived" && (
        <ClRemoveListing listingId={initial!.id} status={initial!.status} />
      )}
    </>
  );
}

/**
 * One key out of a listing's `details` JSON, as the string an input wants.
 *
 * Empty string for anything missing, so an uncontrolled input's defaultValue is
 * never `undefined` — React would treat the field as controlled-by-accident and
 * warn on the first keystroke.
 */
function detail(initial: ClPostFormInitial | undefined, key: string): string {
  const value = initial?.details?.[key];
  if (value === undefined || value === null) return "";
  return String(value);
}
