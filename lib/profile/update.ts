// Server action for updating the signed-in user's own profile.
// Phase 4 Slice 2 — profile editing
//
// What it touches: accounts.name, accounts.neighborhood, accounts.bio.
// What it cannot touch (and doesn't try to): role, is_member, sponsor_id,
// email. The BEFORE UPDATE trigger protect_account_columns() from migration
// 0001 rejects any non-admin attempt to change those columns — even if a
// crafted request tried, the database would refuse. We just don't pass them.
//
// Returns a { error: string | null } shape for inline display via useActionState
// in the client form. On success, redirects back to /profile so the new values
// render immediately and the rename trigger (migration 0006) has time to
// propagate name changes to every listing the user authored or sponsored.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = { error: string | null };

const MAX_NAME = 80;
const MAX_NEIGHBORHOOD = 60;
const MAX_BIO = 500;

// Helper: pull a string from FormData, trim, and treat empty as null so the
// database column reverts to NULL (rather than storing an empty string).
function pluck(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = pluck(formData, "name");
  const neighborhood = pluck(formData, "neighborhood");
  const bio = pluck(formData, "bio");

  // ---- Validation ----
  // Name is optional but encouraged — the GdC-style byline convention
  // (decisions.md, 2026-06-04) treats real names as the visible side of
  // being vouched for. We allow a member to clear it (back to "a member"
  // fallback) but enforce sensible bounds when provided.
  if (name !== null) {
    if (name.length < 2) {
      return { error: "Add a few more letters to your name." };
    }
    if (name.length > MAX_NAME) {
      return { error: `Keep your name to ${MAX_NAME} characters or fewer.` };
    }
  }
  if (neighborhood !== null && neighborhood.length > MAX_NEIGHBORHOOD) {
    return {
      error: `Neighborhood should be ${MAX_NEIGHBORHOOD} characters or fewer.`,
    };
  }
  if (bio !== null && bio.length > MAX_BIO) {
    return {
      error: `Bio is a little long — keep it under ${MAX_BIO} characters.`,
    };
  }

  // ---- Update. RLS "accounts: update own row" is the gate. ----
  // The protect_account_columns trigger (0001) backstops the sensitive
  // columns. We don't pass role/is_member/sponsor_id/email at all; the
  // trigger would reject them if we did.
  const { error } = await supabase
    .from("accounts")
    .update({ name, neighborhood, bio })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile:", error);
    return {
      error:
        "Something went wrong saving your profile. Try again in a moment.",
    };
  }

  // Success — bounce back to /profile so the new values render and any name
  // change has already propagated through the accounts_propagate_byline_changes
  // trigger (migration 0006).
  redirect("/profile");
}
