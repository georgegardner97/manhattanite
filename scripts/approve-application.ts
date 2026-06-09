// Approve a membership application from the terminal — Phase 2 Slice C.
//
//   npm run approve -- <application-id> [sponsor-id]
//
// This replaces the raw `select public.approve_application(...)` call as the
// approval path during seed phase. Same transaction, but the welcome email now
// rides along automatically. Raw SQL stays available as a no-email fallback.
//
// Three steps, in order:
//   1. Call approve_application(app_id, sponsor_id) over a privileged
//      connection (service-role key — see below).
//   2. Read the now-approved account's email + name from public.accounts.
//   3. Send the "You're in." welcome email.
//
// Privileged connection: the approve_* functions are SECURITY DEFINER and
// migration 0008 revoked execute from public, so the anon key can't call them.
// We use the service-role key (bypasses RLS, granted execute in migration 0009)
// via supabase-js rpc(). The key is read from .env.local by the npm script
// (`node --env-file=.env.local`) and is NEVER committed.

import { createClient } from "@supabase/supabase-js";
import { sendMemberWelcome } from "../lib/applications/emails";

// Fail loudly and cleanly — one readable line, no stack trace — then exit.
function die(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main(): Promise<void> {
  const applicationId = process.argv[2];
  const sponsorId = process.argv[3]; // optional; null defaults to founder in SQL

  if (!applicationId) {
    die("Usage: npm run approve -- <application-id> [sponsor-id]");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL — check .env.local.");
  }
  if (!serviceKey) {
    die(
      "Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local (Supabase → Project Settings → API → service_role key)."
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ---- 1. Approve. ----
  const { error: approveError } = await supabase.rpc("approve_application", {
    p_application_id: applicationId,
    // Only pass sponsor when given; otherwise let the SQL default to founder.
    ...(sponsorId ? { p_sponsor_id: sponsorId } : {}),
  });

  if (approveError) {
    // Surface the Postgres raise exception text cleanly (already a member /
    // not pending / sponsor not a member / not found) — no stack trace.
    die(`Could not approve: ${approveError.message}`);
  }

  // ---- 2. Read the approved account's email + name. ----
  const { data: application, error: lookupError } = await supabase
    .from("applications")
    .select("account_id, accounts(email, name)")
    .eq("id", applicationId)
    .single<{
      account_id: string;
      accounts: { email: string; name: string | null } | null;
    }>();

  if (lookupError || !application?.accounts?.email) {
    die(
      `Approved, but couldn't read the account to send the welcome email: ${
        lookupError?.message ?? "account or email not found"
      }`
    );
  }

  const { email, name } = application.accounts;

  // ---- 3. Welcome email. ----
  await sendMemberWelcome({ to: email });

  console.log(`Approved ${name ?? "(no name)"} (${email}) — welcome email sent.`);
}

main().catch((error: unknown) => {
  die(error instanceof Error ? error.message : String(error));
});
