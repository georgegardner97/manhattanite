// Server action: a signed-in account accepts an invite — Invite Stage 4.
//
// For the "I already have an account, then got invited" case. The /join page
// shows an Accept button to a logged-in Tier-1 account; this links them to the
// inviter (accept_invite, which also back-fills the sponsor onto a pending
// application) and sends them to /apply to finish — where, if they hadn't
// applied yet, the sponsor attaches at submit. Members never see this path.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteState = { error: string | null };

export async function acceptInviteAction(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return { error: "Something went wrong with that invitation. Try the link again." };
  }

  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already been used")) {
      return { error: "This invitation has already been used." };
    }
    if (msg.includes("no longer valid")) {
      return { error: "This invitation is no longer valid." };
    }
    if (msg.includes("not found")) {
      return { error: "We couldn't find that invitation. Check the link." };
    }
    console.error("acceptInviteAction failed:", error);
    return {
      error: "Something went wrong accepting the invitation. Try again in a moment.",
    };
  }

  // Linked. Finish at /apply — if they already applied, it shows the in-review
  // confirmation (now with the sponsor attached); if not, it shows the form.
  redirect("/apply");
}
