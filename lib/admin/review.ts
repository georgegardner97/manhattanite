// Server actions for the application review queue — Admin Console slice.
//
// Each action re-checks that the caller is a signed-in ADMIN, then calls the
// matching SECURITY DEFINER review function over the caller's own session —
// NOT the service role. Defense in depth, three layers:
//   1. The /admin route gate (requireAdmin) — clean UX.
//   2. This action-level role check — clean errors.
//   3. The in-function admin guard + grants (migration 0015) — the real wall.
// Never swap these rpc calls to a service-role client: that would make layer 2
// the only real check, and the trust layer doesn't lean on app code.
//
// approve also sends the "You're in." welcome email (best-effort, same as the
// CLI path in scripts/approve-application.ts — review and email stay in step
// whichever path George approves from). Decline / needs-info emails don't
// exist yet anywhere; when they're added, add them to both paths.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendMemberWelcome } from "@/lib/applications/emails";

export type ReviewActionState = { error: string | null };

// Map the Postgres raise/permission errors to copy a human can act on.
// The raw messages leak ids and SQL-speak; these don't.
function readableError(message: string): string {
  if (/permission denied/i.test(message)) {
    return "The review functions aren't enabled for the console yet — run migration 0015 first.";
  }
  if (/not authorized/i.test(message)) {
    return "Your account isn't authorized to review applications.";
  }
  if (/is already a member/i.test(message)) {
    return "They're already a member — nothing to approve.";
  }
  if (/is not a member/i.test(message)) {
    return "That sponsor isn't a member, so they can't vouch for anyone.";
  }
  if (/not pending|not found/i.test(message)) {
    return "This application was already reviewed (or no longer exists). Refresh the queue.";
  }
  console.error("Unmapped review error:", message);
  return "Something went wrong reviewing this application. Try again in a moment.";
}

// Shared preamble: session + admin re-check, returns the application id.
async function adminAndId(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (account?.role !== "admin") {
    return { supabase, id: null as string | null };
  }

  const id = String(formData.get("id") ?? "").trim();
  return { supabase, id: id || null };
}

function refreshQueue(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/members");
}

export async function approveApplication(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review applications." };
  }

  // Optional sponsor override; omitted → the function defaults to the founder.
  const sponsorId = String(formData.get("sponsor_id") ?? "").trim();

  const { error } = await supabase.rpc("approve_application", {
    p_application_id: id,
    ...(sponsorId ? { p_sponsor_id: sponsorId } : {}),
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  // Welcome email, best-effort — mirrors scripts/approve-application.ts.
  // The admin read-all policy lets this query see the applicant's account.
  // Name the applicant FK: applications has two FKs to accounts now
  // (account_id + sponsor_id), so a bare accounts(...) embed is ambiguous.
  const { data: application } = await supabase
    .from("applications")
    .select("accounts!applications_account_id_fkey(email)")
    .eq("id", id)
    .single<{ accounts: { email: string } | null }>();
  if (application?.accounts?.email) {
    try {
      await sendMemberWelcome({ to: application.accounts.email });
    } catch (emailError) {
      // Approval already happened; a failed email must not look like a failed
      // review. Log and move on — same best-effort stance as Slice C.
      console.error("Welcome email failed after approval:", emailError);
    }
  }

  refreshQueue();
  return { error: null };
}

export async function declineApplication(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review applications." };
  }

  const note = String(formData.get("note") ?? "").trim();

  const { error } = await supabase.rpc("decline_application", {
    p_application_id: id,
    p_note: note || null,
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  refreshQueue();
  return { error: null };
}

export async function requestInfo(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review applications." };
  }

  const note = String(formData.get("note") ?? "").trim();

  const { error } = await supabase.rpc("request_more_info", {
    p_application_id: id,
    p_note: note || null,
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  refreshQueue();
  return { error: null };
}
