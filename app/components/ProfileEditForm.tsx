// Client form for editing the signed-in user's profile.
// Phase 4 Slice 2 — profile editing
//
// Pre-fills from the current accounts row (passed as a prop by the Server
// Component shell). The actual write happens server-side in
// lib/profile/update.ts where the Supabase session + RLS live.
//
// Style classes match NewListingForm / ApplicationForm exactly — keep visual
// consistency across every form in the product.

"use client";

import { useActionState } from "react";
import {
  updateProfile,
  type UpdateProfileState,
} from "@/lib/profile/update";
import AvatarUpload from "@/app/components/AvatarUpload";

const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";
const HINT =
  "font-serif italic normal-case tracking-normal text-slate/70 ml-1";

const INITIAL: UpdateProfileState = { error: null };

type ProfileEditFormProps = {
  userId: string;
  initialName: string | null;
  initialNeighborhood: string | null;
  initialBio: string | null;
  initialAvatarPath: string | null;
  initialAvatarUrl: string | null;
  initialLinkedin: string | null;
};

export default function ProfileEditForm({
  userId,
  initialName,
  initialNeighborhood,
  initialBio,
  initialAvatarPath,
  initialAvatarUrl,
  initialLinkedin,
}: ProfileEditFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    INITIAL
  );

  return (
    <form action={formAction} className="space-y-12">
      {/* ---------- Profile photo ---------- */}
      <AvatarUpload
        userId={userId}
        initialPath={initialAvatarPath}
        initialUrl={initialAvatarUrl}
      />

      {/* ---------- Name ---------- */}
      <div>
        <label htmlFor="name" className={LABEL}>
          Name
          <span className={HINT}>(first and last)</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={initialName ?? ""}
          maxLength={80}
          placeholder="e.g. George Gardner"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Neighborhood ---------- */}
      <div>
        <label htmlFor="neighborhood" className={LABEL}>
          Neighborhood
          <span className={HINT}>(optional)</span>
        </label>
        <input
          type="text"
          id="neighborhood"
          name="neighborhood"
          defaultValue={initialNeighborhood ?? ""}
          maxLength={60}
          placeholder="e.g. West Village"
          className={FIELD_BASE}
        />
      </div>

      {/* ---------- Bio ---------- */}
      <div>
        <label htmlFor="bio" className={LABEL}>
          Bio
          <span className={HINT}>(optional, a sentence or two)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initialBio ?? ""}
          maxLength={500}
          rows={4}
          placeholder="What members might want to know about you."
          className={`${FIELD_BASE} resize-none`}
        />
      </div>

      {/* ---------- LinkedIn (optional) ---------- */}
      <div>
        <label htmlFor="linkedin_url" className={LABEL}>
          LinkedIn
          <span className={HINT}>(optional)</span>
        </label>
        <input
          type="text"
          id="linkedin_url"
          name="linkedin_url"
          defaultValue={initialLinkedin ?? ""}
          maxLength={200}
          placeholder="linkedin.com/in/you"
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
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
