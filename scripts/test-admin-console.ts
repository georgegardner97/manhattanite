// Admin Console prod test harness — Admin Console slice.
//
//   npm run test:admin-console
//
// Runs against PROD Supabase (service-role key from .env.local). Built to run
// BOTH before and after migration 0015 is applied, and to tell the difference
// itself (it probes with a NON-admin caller — the only reliable discriminator).
//
// IMPORTANT context this harness discovered (2026-06-11, pre-0015):
//   prod has DRIFTED from the repo. The three review functions
//   (approve/decline/request_more_info) are executable by `authenticated`, not
//   service_role-only as migrations 0008/0009 imply — the `revoke ... from
//   public` evidently never took in prod. With no admin guard yet, that means:
//     - decline_application / request_more_info SUCCEED for any signed-in user
//       (a live gap: any member could sabotage the review queue).
//     - approve_application runs but the protect_account_columns trigger (0001)
//       blocks the is_member write → 'is_member is protected'. So a non-admin
//       still cannot actually grant membership.
//   Migration 0015 closes the gap: it re-revokes from public AND adds the
//   in-function admin guard, so post-0015 every non-admin call raises
//   'not authorized' before any work happens.
//
// So pre-0015 this harness asserts the invariant that always holds (a non-admin
// can never flip is_member), documents the gap, and DEFERS the formal
// "all three blocked" security assertion. Post-0015 it runs that assertion in
// full. Re-run after George applies 0015 → all green, nothing deferred.
//
// Conventions mirror scripts/test-multi-sponsor.ts: Gmail plus-alias
// synthetics, shared prefix for exact pre-clean/final-count, try/finally
// cleanup, founder snapshot. The founder is NEVER written to — the role='admin'
// flip is 0015's job (George, SQL editor), never this harness's.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "info@manhattanite.com";
const FOUNDER_ID = "85ce5315-2c38-4dc6-b3f3-48f224f26dba";

const SYNTH_PREFIX = "george.gardner480+actest";
const synthEmail = (label: string) => `${SYNTH_PREFIX}-${label}@googlemail.com`;
const SYNTH_PASSWORD = "Manhattanite-Test-AdminConsole-1!";

const NIL_UUID = "00000000-0000-0000-0000-000000000000"; // exists nowhere

// ----- tiny test rig -------------------------------------------------------
let passed = 0;
let failed = 0;
let deferred = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${e}`);
    console.log(`      actual:   ${a}`);
  }
}

function checkTrue(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function defer(label: string, why: string): void {
  deferred++;
  console.log(`  ○ ${label} — DEFERRED (${why})`);
}

function flag(message: string): void {
  console.log(`  ⚑ FINDING: ${message}`);
}

function die(message: string): never {
  console.error(`\nFATAL: ${message}`);
  process.exit(1);
}

// ----- helpers -------------------------------------------------------------
async function createSynthUser(
  admin: SupabaseClient,
  label: string,
  fields: { name: string; role?: "admin" }
): Promise<{ id: string; email: string }> {
  const email = synthEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SYNTH_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) die(`Could not create synthetic user ${email}: ${error?.message}`);
  const { error: updErr } = await admin
    .from("accounts")
    .update({ name: fields.name, ...(fields.role ? { role: fields.role } : {}) })
    .eq("id", data.user.id);
  if (updErr) die(`Could not set up account ${email}: ${updErr.message}`);
  return { id: data.user.id, email };
}

async function insertPendingApplication(
  admin: SupabaseClient,
  accountId: string,
  about: string
): Promise<string> {
  const { data, error } = await admin
    .from("applications")
    .insert({
      account_id: accountId,
      status: "pending",
      occupation: "QA bot",
      about,
      sponsor_reference: "Nobody — synthetic",
      neighborhood: "Test Quarter",
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) die(`Could not insert application: ${error?.message}`);
  return data.id;
}

async function signIn(
  url: string,
  anonKey: string,
  email: string
): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: SYNTH_PASSWORD,
  });
  if (error) die(`Could not sign in as ${email}: ${error.message}`);
  return client;
}

async function statusOf(admin: SupabaseClient, appId: string): Promise<string | null> {
  const { data } = await admin
    .from("applications")
    .select("status")
    .eq("id", appId)
    .single<{ status: string }>();
  return data?.status ?? null;
}

async function isMember(admin: SupabaseClient, accountId: string): Promise<boolean | null> {
  const { data } = await admin
    .from("accounts")
    .select("is_member")
    .eq("id", accountId)
    .single<{ is_member: boolean }>();
  return data?.is_member ?? null;
}

async function purgeSynthetic(admin: SupabaseClient): Promise<number> {
  let removed = 0;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) die(`Could not list users for cleanup: ${error.message}`);
    const synthetic = data.users.filter((u) => u.email?.startsWith(SYNTH_PREFIX));
    for (const u of synthetic) {
      const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
      if (delErr) die(`Could not delete synthetic user ${u.email}: ${delErr.message}`);
      removed++;
    }
    if (data.users.length < 200) break;
  }
  return removed;
}

// ----- main ----------------------------------------------------------------
async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) die("Missing NEXT_PUBLIC_SUPABASE_URL — check .env.local.");
  if (!serviceKey) die("Missing SUPABASE_SERVICE_ROLE_KEY — check .env.local.");
  if (!anonKey) die("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local.");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  type FounderRow = {
    id: string; name: string | null; role: string;
    is_member: boolean; sponsor_id: string | null;
  };
  const { data: founder, error: founderErr } = await admin
    .from("accounts")
    .select("id, name, role, is_member, sponsor_id")
    .eq("email", FOUNDER_EMAIL)
    .single<FounderRow>();
  if (founderErr || !founder) die(`Could not read founder: ${founderErr?.message}`);
  console.log(`Founder: ${founder.name} (role=${founder.role})`);
  if (founder.role !== "admin") {
    console.log(
      "  NOTE: founder is role!='admin' — that's the 0015 SQL-editor step. This\n" +
      "  harness uses a SYNTHETIC admin and never writes to the founder."
    );
  }

  console.log("Pre-clean: removing any leftover synthetic users…");
  const preCleaned = await purgeSynthetic(admin);
  if (preCleaned > 0) console.log(`  removed ${preCleaned} leftover synthetic user(s)`);

  try {
    // ----- setup -----
    console.log("\nSetup — synthetic admin + three applicants:");
    const a1 = await createSynthUser(admin, "a1", { name: "Avery Admin", role: "admin" });
    const p1 = await createSynthUser(admin, "p1", { name: "Pat Applicant" });
    const p2 = await createSynthUser(admin, "p2", { name: "Quinn Applicant" });
    const p3 = await createSynthUser(admin, "p3", { name: "Riley Applicant" });
    const app1 = await insertPendingApplication(admin, p1.id, "Synthetic #1 — admin-approve target.");
    const app2 = await insertPendingApplication(admin, p2.id, "Synthetic #2 — service-role target.");
    const app3 = await insertPendingApplication(admin, p3.id, "Synthetic #3 — non-admin attack target.");
    console.log("  admin + 3 pending applications in place");

    const adminClient = await signIn(url, anonKey, a1.email);
    const attacker = await signIn(url, anonKey, p3.email); // non-admin

    // ----- Test 1: admin reads (queue + counts) — BEFORE any mutation -----
    console.log("\nTest 1 — admin reads (queue + dashboard counts):");
    const { data: queue, error: queueErr } = await adminClient
      .from("applications")
      .select("id, status, occupation, about, sponsor_reference, neighborhood, created_at, accounts!applications_account_id_fkey(name, email)")
      .in("status", ["pending", "needs_info"])
      .order("created_at", { ascending: true });
    checkTrue("admin can read the review queue (0007 policy live in prod)",
      !queueErr && Array.isArray(queue), queueErr?.message);
    checkTrue("queue contains all three synthetic applications",
      [app1, app2, app3].every((id) => (queue ?? []).some((q) => q.id === id)),
      `queue ids: ${(queue ?? []).map((q) => q.id).join(", ")}`);
    const embedded = (queue ?? []).find((q) => q.id === app1) as
      | { accounts: { name: string | null } | null } | undefined;
    check("applicant name embedded via accounts (0002 admin read-all)",
      embedded?.accounts?.name, "Pat Applicant");

    // counts as the admin vs service-role ground truth
    const truth = {
      accounts: (await admin.from("accounts").select("id", { count: "exact", head: true })).count ?? 0,
      members: (await admin.from("accounts").select("id", { count: "exact", head: true }).eq("is_member", true)).count ?? 0,
      listingsAll: (await admin.from("listings").select("id", { count: "exact", head: true })).count ?? 0,
      listingsPublished: (await admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "published")).count ?? 0,
      pending: (await admin.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending")).count ?? 0,
    };
    const seen = {
      accounts: (await adminClient.from("accounts").select("id", { count: "exact", head: true })).count ?? 0,
      members: (await adminClient.from("accounts").select("id", { count: "exact", head: true }).eq("is_member", true)).count ?? 0,
      listings: (await adminClient.from("listings").select("id", { count: "exact", head: true })).count ?? 0,
      pending: (await adminClient.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending")).count ?? 0,
    };
    check("accounts count matches ground truth", seen.accounts, truth.accounts);
    check("members count matches ground truth", seen.members, truth.members);
    check("pending count matches ground truth", seen.pending, truth.pending);
    checkTrue("counts are sane (accounts ≥ members ≥ 1, listings ≥ 0, pending ≥ 3)",
      seen.accounts >= seen.members && seen.members >= 1 &&
      seen.listings >= 0 && seen.pending >= 3,
      JSON.stringify(seen));

    // ----- probe migration state with the NON-admin (no side effects) -----
    const { error: probeErr } = await attacker.rpc("decline_application", {
      p_application_id: NIL_UUID,
      p_note: null,
    });
    let migrationApplied: boolean;
    if (probeErr && /not authorized/i.test(probeErr.message)) {
      migrationApplied = true;
      console.log("\nProbe: 0015 IS live (non-admin hits the guard).");
    } else if (probeErr && /permission denied/i.test(probeErr.message)) {
      migrationApplied = false;
      console.log("\nProbe: 0015 not applied; `authenticated` lacks execute (repo-intended pre-state).");
    } else if (probeErr && /not found|not pending/i.test(probeErr.message)) {
      migrationApplied = false;
      console.log("\nProbe: 0015 not applied; `authenticated` CAN execute (the prod drift this slice fixes).");
    } else {
      die(`Probe gave an unexpected result: ${probeErr?.message ?? "rpc succeeded on a nil uuid (!)"}`);
    }

    // ----- Test 2: the KEY security assertion — non-admin cannot review -----
    console.log("\nTest 2 — non-admin blocked from the review functions:");

    // Invariant that holds in EVERY state: a non-admin can never grant
    // membership. Pre-0015 the protect_account_columns trigger blocks it;
    // post-0015 the guard blocks it first. Either way, no membership flip.
    const { error: naApprove } = await attacker.rpc("approve_application", {
      p_application_id: app3,
    });
    checkTrue("non-admin approve is rejected (some error raised)", !!naApprove, "approve returned no error");
    check("non-admin approve did NOT make the applicant a member", await isMember(admin, p3.id), false);
    check("non-admin approve did NOT approve the application", await statusOf(admin, app3), "pending");

    if (migrationApplied) {
      // Full security assertion: all three raise 'not authorized', no effect.
      checkTrue("approve raises 'not authorized' (0015 guard)",
        /not authorized/i.test(naApprove?.message ?? ""), naApprove?.message);

      const { error: naDecline } = await attacker.rpc("decline_application", {
        p_application_id: app3, p_note: null,
      });
      checkTrue("decline raises 'not authorized'",
        !!naDecline && /not authorized/i.test(naDecline.message),
        naDecline?.message ?? "decline SUCCEEDED — wall open");

      const { error: naInfo } = await attacker.rpc("request_more_info", {
        p_application_id: app3, p_note: null,
      });
      checkTrue("request_more_info raises 'not authorized'",
        !!naInfo && /not authorized/i.test(naInfo.message),
        naInfo?.message ?? "request_more_info SUCCEEDED — wall open");

      check("application untouched by the non-admin", await statusOf(admin, app3), "pending");
    } else {
      // Document the live gap, then defer the formal assertion to post-0015.
      flag(
        "prod allows `authenticated` to execute the review functions — " +
        "approve is stopped only by the column trigger; decline/request_more_info have NO guard."
      );
      const { error: naDecline } = await attacker.rpc("decline_application", {
        p_application_id: app3, p_note: "non-admin probe",
      });
      const declinedStatus = await statusOf(admin, app3);
      if (!naDecline && declinedStatus === "declined") {
        flag("CONFIRMED: a non-admin just DECLINED a pending application. 0015 closes this.");
      }
      defer("non-admin gets 'not authorized' on all three", "0015 not applied — re-run after the SQL step");
      // reset app3 so nothing downstream trips over it (defensive; not reused)
      await admin.from("applications").update({ status: "pending", reviewed_at: null }).eq("id", app3);
    }

    // ----- Test 3: admin approves via rpc (the console's real path) -----
    console.log("\nTest 3 — authenticated admin approves (the /admin path):");
    if (!migrationApplied) {
      defer("admin rpc approve succeeds + flips membership + writes sponsorship",
        "0015 not applied (admin isn't granted/guarded execute yet)");
    } else {
      const { error: adminApproveErr } = await adminClient.rpc("approve_application", {
        p_application_id: app1,
      });
      checkTrue("admin rpc approve succeeded", !adminApproveErr, adminApproveErr?.message);
      check("applicant is now a member", await isMember(admin, p1.id), true);

      const { data: p1Acct } = await admin
        .from("accounts").select("sponsor_id").eq("id", p1.id)
        .single<{ sponsor_id: string | null }>();
      check("sponsor defaulted to the founder", p1Acct?.sponsor_id, FOUNDER_ID);

      const { data: sponsorship } = await admin
        .from("sponsorships").select("sponsor_id, is_primary").eq("member_id", p1.id)
        .single<{ sponsor_id: string; is_primary: boolean }>();
      check("primary sponsorship row written",
        { sponsor: sponsorship?.sponsor_id, primary: sponsorship?.is_primary },
        { sponsor: FOUNDER_ID, primary: true });

      check("application flipped to approved", await statusOf(admin, app1), "approved");
    }

    // ----- Test 4: service-role/seed path still approves -----
    console.log("\nTest 4 — service-role approval path (the CLI's shape):");
    const { error: svcErr } = await admin.rpc("approve_application", {
      p_application_id: app2,
    });
    checkTrue("service-role rpc approve succeeded", !svcErr, svcErr?.message);
    check("seed-path applicant is now a member", await isMember(admin, p2.id), true);
    const { data: p2Acct } = await admin
      .from("accounts").select("sponsor_id").eq("id", p2.id)
      .single<{ sponsor_id: string | null }>();
    check("seed-path sponsor defaulted to the founder", p2Acct?.sponsor_id, FOUNDER_ID);
  } finally {
    // ----- Test 5: cleanup -----
    console.log("\nTest 5 — cleanup:");
    const removed = await purgeSynthetic(admin);
    console.log(`  removed ${removed} synthetic user(s)`);

    const { count, error: countErr } = await admin
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .like("email", `${SYNTH_PREFIX}%`);
    if (countErr) die(`Could not count synthetic accounts: ${countErr.message}`);
    checkTrue("0 synthetic accounts remain", count === 0, `count=${count}`);

    const { data: founderAfter } = await admin
      .from("accounts")
      .select("id, name, role, is_member, sponsor_id")
      .eq("email", FOUNDER_EMAIL)
      .single<FounderRow>();
    checkTrue("founder untouched (snapshot match)",
      JSON.stringify(founderAfter) === JSON.stringify(founder),
      `before=${JSON.stringify(founder)} after=${JSON.stringify(founderAfter)}`);
  }

  // ----- summary -----
  console.log(`\n${"─".repeat(48)}`);
  console.log(`Passed: ${passed}   Failed: ${failed}   Deferred: ${deferred}`);
  if (failed > 0) {
    console.log("RESULT: ✗ FAILURES — see above.");
    process.exit(1);
  }
  console.log(
    deferred > 0
      ? "RESULT: ✓ green, with deferrals. Apply 0015, then re-run for the full security assertion."
      : "RESULT: ✓ all green. Non-admin fully walled off, founder untouched, 0 synthetic rows."
  );
}

main().catch((error: unknown) => {
  die(error instanceof Error ? error.message : String(error));
});
