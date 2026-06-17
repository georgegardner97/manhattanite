// Server action: a member confirms or declines a sponsorship request —
// Sponsorship Request slice (2026-06-16).
//
// Called from /sponsor-request/[token]. The decision goes through the
// respond_to_sponsorship_request DEFINER function (0025), which enforces that
// the caller IS the named sponsor (auth.uid() = sponsor_id) and that the
// request is still pending. Confirming records consent only — it does NOT make
// the applicant a member; the founder's approval in the admin queue still does.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RespondState =
  | { status: "idle" }
  | { status: "confirmed" }
  | { status: "declined" }
  | { status: "error"; message: string };

export async function respondToSponsorship(
  _prev: RespondState,
  formData: FormData
): Promise<RespondState> {
  const token = String(formData.get("token") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!token || (decision !== "confirm" && decision !== "decline")) {
    return { status: "error", message: "Something went wrong. Try the link again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const confirm = decision === "confirm";
  const { error } = await supabase.rpc("respond_to_sponsorship_request", {
    p_token: token,
    p_confirm: confirm,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("someone else")) {
      return {
        status: "error",
        message: "This request is for a different member's account.",
      };
    }
    if (msg.includes("already answered")) {
      return { status: "error", message: "You've already answered this request." };
    }
    if (msg.includes("not found")) {
      return { status: "error", message: "We couldn't find that request. Check the link." };
    }
    console.error("respondToSponsorship failed:", error);
    return { status: "error", message: "Something went wrong. Try again in a moment." };
  }

  return { status: confirm ? "confirmed" : "declined" };
}
