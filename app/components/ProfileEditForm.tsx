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
import BoxButton from "@/app/components/BoxButton";

const LABEL = "mh-label block text-slate mb-2.5";
const HINT = "normal-case tracking-normal font-normal text-slate/70 ml-1.5";

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
    <form action={formAction} className="space-y-[22px]">
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
          className="mh-input"
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
          className="mh-input"
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
          className="mh-input resize-none"
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
          className="mh-input"
        />
      </div>

      {/* ---------- Error ---------- */}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      {/* ---------- Submit ---------- */}
      <div className="pt-2">
        <BoxButton type="submit" surface="light" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </BoxButton>
      </div>
    </form>
  );
}
