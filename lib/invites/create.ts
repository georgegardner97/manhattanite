// Server action for a member inviting someone — Invite slice, Stage 1.
//
// Invite-led onboarding (2026-06-12 decision): a member brings in someone they
// trust. This creates a pending invite row and emails the invitee a /join link.
// RLS (migration 0020, invites_insert_own) is the real gate — only a member can
// insert, and only with inviter_id = their own id. The membership pre-check
// here keeps the failure clean for a non-member who somehow reaches the action.
//
// Returns a { error, sentTo } state for useActionState: on success the form
// shows "Invitation sent to <email>" and offers to invite someone else, rather
// than navigating away (inviting several people in a row is the common case).

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/applications/emails";

export type CreateInviteState = { error: string | null; sentTo: string | null };

const MAX_NAME = 80;

// Light email shape check — the real validation is whether the invitee ever
// clicks through, so this only catches obvious typos.
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createInvite(
  _prevState: CreateInviteState,
  formData: FormData
): Promise<CreateInviteState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Must be a member to invite. Also pull the inviter's name for the email
  // ("<name> invited you"). RLS would block a non-member insert anyway.
  const { data: account } = await supabase
    .from("accounts")
    .select("is_member, name")
    .eq("id", user.id)
    .single<{ is_member: boolean; name: string | null }>();

  if (!account?.is_member) {
    redirect("/profile");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !looksLikeEmail(email)) {
    return {
      error: "Add a valid email for the person you're inviting.",
      sentTo: null,
    };
  }
  if (name && name.length > MAX_NAME) {
    return {
      error: `Keep the name to ${MAX_NAME} characters or fewer.`,
      sentTo: null,
    };
  }

  // 122 bits of entropy is plenty for an unguessable invite link.
  const token = crypto.randomUUID();

  const { error } = await supabase.from("invites").insert({
    inviter_id: user.id,
    invitee_email: email,
    invitee_name: name,
    token,
  });

  if (error) {
    console.error("Failed to create invite:", error);
    return {
      error: "Something went wrong sending the invitation. Try again in a moment.",
      sentTo: null,
    };
  }

  // Best-effort, like the rest of our mail — the invite row is already saved,
  // so a send failure never loses it. (A retry/resend lives in a later stage.)
  try {
    await sendInviteEmail({
      to: email,
      inviterName: account.name ?? "A member",
      inviteeName: name,
      token,
    });
  } catch (mailError) {
    console.error("Invite email failed (invite saved):", mailError);
  }

  return { error: null, sentTo: email };
}
