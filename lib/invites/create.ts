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
// Propose a Manhattanite (George, 2026-09-30): the proposer says why. Mirrors
// the invites_note_length check in migration 0034.
const MAX_NOTE = 1000;

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
  const note = String(formData.get("note") ?? "").trim();
  // The tick box. Not stored: a saved invite already means it was ticked.
  const vouched = formData.get("vouch") === "on";

  if (!email || !looksLikeEmail(email)) {
    return {
      error: "Add a valid email for the person you're inviting.",
      sentTo: null,
    };
  }
  if (!name) {
    return { error: "Add their name.", sentTo: null };
  }
  if (name.length > MAX_NAME) {
    return {
      error: `Keep the name to ${MAX_NAME} characters or fewer.`,
      sentTo: null,
    };
  }

  if (!note) {
    return {
      error: "Say a little about them. It is read before they are let in.",
      sentTo: null,
    };
  }
  if (note.length > MAX_NOTE) {
    return {
      error: `Keep it to ${MAX_NOTE} characters or fewer.`,
      sentTo: null,
    };
  }
  if (!vouched) {
    return {
      error: "Tick the box to vouch for them. Nobody comes in without it.",
      sentTo: null,
    };
  }

  // 122 bits of entropy is plenty for an unguessable invite link.
  const token = crypto.randomUUID();

  const row = {
    inviter_id: user.id,
    invitee_email: email,
    invitee_name: name,
    token,
  };

  let { error } = await supabase.from("invites").insert({ ...row, note });

  // DEGRADE, DO NOT BREAK, while 0034 is unapplied (migrations here are hand
  // run, so the code can ship first). A missing column answers 42703 from
  // Postgres or PGRST204 from PostgREST; save the invite without its note
  // rather than refuse to send it. Remove once 0034 is confirmed in prod.
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    console.warn("invites.note missing (0034 unapplied); saving without the note.");
    ({ error } = await supabase.from("invites").insert(row));
  }

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
      // Two names, on purpose. inviterName is the body copy and keeps its
      // fallback; senderName is the raw account name and builds the sender
      // line ("Alex Rivera via Manhattanite"), which falls back to plain
      // "Manhattanite" rather than to "A member". See inviteFrom().
      inviterName: account.name ?? "A member",
      senderName: account.name,
      inviteeName: name,
      token,
    });
  } catch (mailError) {
    console.error("Invite email failed (invite saved):", mailError);
  }

  return { error: null, sentTo: email };
}
