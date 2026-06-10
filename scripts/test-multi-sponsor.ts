// Multi-Sponsor prod test harness — Build Plan §5.
//
//   npm run test:multi-sponsor
//
// Runs against PROD Supabase (service-role key from .env.local) AFTER migration
// 0012 is applied. Stands up synthetic members on Gmail plus-aliases, exercises
// the full multi-sponsor mechanic end-to-end, asserts the hybrid-at-2 byline at
// each step, then deletes the synthetic auth.users so the cascade clears every
// synthetic row. The founder must end UNTOUCHED.
//
// What it covers (mirrors §5):
//   1. 1 sponsor   — approve a synthetic applicant (founder default) → post →
//                    "Listed by [m1] · sponsored by George Gardner".
//   2. 2 sponsors  — add_sponsor(m1, m2) → "... George Gardner & [m2]".
//   3. 3 sponsors  — add_sponsor(m1, m3) → "... George Gardner, [m2] + 1 more".
//   4. Rename      — rename m2 → that name updates in m1's byline.
//   5. Remove      — delete a sponsorship → byline count drops.
//   6. Order       — primary (founder) always first.
//   7. Anon render — anon-key read of sponsor_names still works (0010 policy).
//   8. Cleanup     — delete synthetic users → 0 synthetic rows, founder intact.
//
// It imports the REAL byline renderer (lib/listings/byline.ts) so the assertions
// test exactly what the pages render — not a re-implementation.
//
// Privileged access: the service-role key bypasses RLS (so it can insert the
// synthetic listing, read every member's row, and delete sponsorships directly)
// and is granted execute on approve_application (0009) + add_sponsor (0012).
// Same key handling as scripts/approve-application.ts — read from .env.local,
// never committed.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { renderByline } from "../lib/listings/byline";

const FOUNDER_EMAIL = "info@manhattanite.com";

// Synthetic members live on Gmail plus-aliases off the operator's address, so
// real mail (if any auth email fired) lands in one inbox. The shared prefix
// makes pre-clean + final-count assertions exact.
const SYNTH_PREFIX = "george.gardner480+mstest";
const synthEmail = (label: string) => `${SYNTH_PREFIX}-${label}@googlemail.com`;
const SYNTH_PASSWORD = "Manhattanite-Test-0012!";

// Names chosen so each byline string is unambiguous.
const M1_NAME = "Marcus Vaughn"; // the applicant / listing author
const M2_NAME = "Sarah Klein"; // second sponsor
const M2_RENAME = "Sarah Klein-Mercer"; // rename target (test 4)
const M3_NAME = "Daniel Okafor"; // third sponsor

// ----- tiny test rig -------------------------------------------------------
let passed = 0;
let failed = 0;

function check(label: string, actual: string, expected: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      actual:   ${JSON.stringify(actual)}`);
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

function die(message: string): never {
  console.error(`\nFATAL: ${message}`);
  process.exit(1);
}

// ----- helpers -------------------------------------------------------------
type ListingRow = { author_name: string | null; sponsor_names: string[] };

async function readByline(
  admin: SupabaseClient,
  listingId: string
): Promise<{ row: ListingRow; byline: string }> {
  const { data, error } = await admin
    .from("listings")
    .select("author_name, sponsor_names")
    .eq("id", listingId)
    .single<ListingRow>();
  if (error || !data) die(`Could not read listing ${listingId}: ${error?.message}`);
  return { row: data, byline: renderByline(data.author_name, data.sponsor_names) };
}

async function setMember(
  admin: SupabaseClient,
  id: string,
  name: string
): Promise<void> {
  // Service role bypasses RLS + the protect_account_columns trigger (auth.uid()
  // is null), so this is the direct "make them a member with a name" path.
  const { error } = await admin
    .from("accounts")
    .update({ name, is_member: true })
    .eq("id", id);
  if (error) die(`Could not set member ${id}: ${error.message}`);
}

async function createSynthAccount(
  admin: SupabaseClient,
  label: string
): Promise<{ id: string; email: string }> {
  const email = synthEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SYNTH_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) die(`Could not create synthetic user ${email}: ${error?.message}`);
  return { id: data.user.id, email };
}

// Delete every synthetic auth.user (by plus-alias prefix). Cascades through
// accounts → listings + sponsorships. Used both as a pre-clean and final cleanup.
async function purgeSynthetic(admin: SupabaseClient): Promise<number> {
  let removed = 0;
  // listUsers is paginated; one page (default) is plenty for a test run, but
  // loop defensively in case prior runs left many.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) die(`Could not list users for cleanup: ${error.message}`);
    const synthetic = data.users.filter((u) => u.email?.startsWith(SYNTH_PREFIX));
    for (const u of synthetic) {
      const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
      if (delErr) die(`Could not delete synthetic user ${u.email}: ${delErr.message}`);
      removed++;
    }
    if (data.users.length < 200) break; // last page
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

  // Founder snapshot (for the "untouched" assertion at the end) + name/id.
  const { data: founder, error: founderErr } = await admin
    .from("accounts")
    .select("id, name, is_member, sponsor_id")
    .eq("email", FOUNDER_EMAIL)
    .single<{ id: string; name: string | null; is_member: boolean; sponsor_id: string | null }>();
  if (founderErr || !founder) die(`Could not read founder (${FOUNDER_EMAIL}): ${founderErr?.message}`);
  const founderName = founder.name ?? die("Founder has no name — byline expectations would break.");

  console.log(`Founder: ${founderName} (${founder.id})`);
  console.log("Pre-clean: removing any leftover synthetic users…");
  const preCleaned = await purgeSynthetic(admin);
  if (preCleaned > 0) console.log(`  removed ${preCleaned} leftover synthetic user(s)`);

  let listingId: string | null = null;

  try {
    // ----- Test 1: one sponsor (founder default) -----
    console.log("\nTest 1 — 1 sponsor (founder default):");
    const m1 = await createSynthAccount(admin, "m1");
    // Set the author's name BEFORE posting so author_name populates.
    const { error: nameErr } = await admin
      .from("accounts")
      .update({ name: M1_NAME })
      .eq("id", m1.id);
    if (nameErr) die(`Could not set m1 name: ${nameErr.message}`);

    // Real approval path: a pending application → approve_application (default
    // sponsor = founder) → is_member + primary sponsorship row.
    const { data: app, error: appErr } = await admin
      .from("applications")
      .insert({ account_id: m1.id, status: "pending", occupation: "QA bot", about: "synthetic" })
      .select("id")
      .single<{ id: string }>();
    if (appErr || !app) die(`Could not create application: ${appErr?.message}`);

    const { error: approveErr } = await admin.rpc("approve_application", {
      p_application_id: app.id,
    });
    if (approveErr) die(`approve_application failed: ${approveErr.message}`);

    // Post a listing as m1 (service role bypasses the insert RLS; the BEFORE
    // INSERT trigger fills author_name + sponsor_names).
    const { data: listing, error: listErr } = await admin
      .from("listings")
      .insert({
        author_id: m1.id,
        type: "furniture",
        title: "Multi-sponsor test listing",
        description: "Synthetic listing for the 0012 byline test.",
        price_cents: 12300,
        details: {},
        images: [],
        status: "published",
      })
      .select("id")
      .single<{ id: string }>();
    if (listErr || !listing) die(`Could not insert listing: ${listErr?.message}`);
    listingId = listing.id;

    let { row, byline } = await readByline(admin, listingId);
    check("byline (1 sponsor)", byline, `Listed by ${M1_NAME} · sponsored by ${founderName}`);
    checkTrue("primary (founder) renders first", row.sponsor_names[0] === founderName,
      `sponsor_names=${JSON.stringify(row.sponsor_names)}`);

    // ----- Test 2: two sponsors -----
    console.log("\nTest 2 — 2 sponsors:");
    const m2 = await createSynthAccount(admin, "m2");
    await setMember(admin, m2.id, M2_NAME);
    const { error: add2Err } = await admin.rpc("add_sponsor", {
      p_member_id: m1.id,
      p_sponsor_id: m2.id,
    });
    if (add2Err) die(`add_sponsor(m1,m2) failed: ${add2Err.message}`);

    ({ row, byline } = await readByline(admin, listingId));
    check("byline (2 sponsors)", byline,
      `Listed by ${M1_NAME} · sponsored by ${founderName} & ${M2_NAME}`);
    checkTrue("primary still first", row.sponsor_names[0] === founderName,
      `sponsor_names=${JSON.stringify(row.sponsor_names)}`);

    // ----- Test 3: three sponsors -----
    console.log("\nTest 3 — 3 sponsors:");
    const m3 = await createSynthAccount(admin, "m3");
    await setMember(admin, m3.id, M3_NAME);
    const { error: add3Err } = await admin.rpc("add_sponsor", {
      p_member_id: m1.id,
      p_sponsor_id: m3.id,
    });
    if (add3Err) die(`add_sponsor(m1,m3) failed: ${add3Err.message}`);

    ({ row, byline } = await readByline(admin, listingId));
    check("byline (3 sponsors)", byline,
      `Listed by ${M1_NAME} · sponsored by ${founderName}, ${M2_NAME} + 1 more`);
    checkTrue("primary still first", row.sponsor_names[0] === founderName,
      `sponsor_names=${JSON.stringify(row.sponsor_names)}`);

    // ----- Test 4: rename propagation (rename a SYNTHETIC sponsor, never founder) -----
    console.log("\nTest 4 — rename propagation:");
    const { error: renameErr } = await admin
      .from("accounts")
      .update({ name: M2_RENAME })
      .eq("id", m2.id);
    if (renameErr) die(`Could not rename m2: ${renameErr.message}`);

    ({ byline } = await readByline(admin, listingId));
    check("byline reflects renamed sponsor", byline,
      `Listed by ${M1_NAME} · sponsored by ${founderName}, ${M2_RENAME} + 1 more`);

    // ----- Test 5: remove a sponsor -----
    console.log("\nTest 5 — remove a sponsor:");
    const { error: delErr } = await admin
      .from("sponsorships")
      .delete()
      .eq("member_id", m1.id)
      .eq("sponsor_id", m3.id);
    if (delErr) die(`Could not delete sponsorship(m1,m3): ${delErr.message}`);

    ({ row, byline } = await readByline(admin, listingId));
    check("byline after removal (back to 2)", byline,
      `Listed by ${M1_NAME} · sponsored by ${founderName} & ${M2_RENAME}`);
    checkTrue("count dropped to 2", row.sponsor_names.length === 2,
      `sponsor_names=${JSON.stringify(row.sponsor_names)}`);

    // ----- Test 7: anon render (0010 policy + new array column) -----
    console.log("\nTest 7 — anon render of sponsor_names:");
    const anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: anonRow, error: anonErr } = await anon
      .from("listings")
      .select("sponsor_names")
      .eq("id", listingId)
      .single<{ sponsor_names: string[] }>();
    checkTrue("anon can read the published listing", !anonErr && !!anonRow, anonErr?.message);
    checkTrue("anon sponsor_names is an array of 2",
      Array.isArray(anonRow?.sponsor_names) && anonRow?.sponsor_names.length === 2,
      `got ${JSON.stringify(anonRow?.sponsor_names)}`);
  } finally {
    // ----- Test 8: cleanup -----
    console.log("\nTest 8 — cleanup:");
    const removed = await purgeSynthetic(admin);
    console.log(`  removed ${removed} synthetic user(s)`);

    const { count, error: countErr } = await admin
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .like("email", `${SYNTH_PREFIX}%`);
    if (countErr) die(`Could not count synthetic accounts: ${countErr.message}`);
    checkTrue("0 synthetic accounts remain", count === 0, `count=${count}`);

    // Founder untouched: still a member, no real sponsor, placeholder intact.
    const { data: f2 } = await admin
      .from("accounts")
      .select("is_member, sponsor_id, name")
      .eq("email", FOUNDER_EMAIL)
      .single<{ is_member: boolean; sponsor_id: string | null; name: string | null }>();
    checkTrue("founder still is_member", f2?.is_member === true);
    checkTrue("founder has no real sponsor", f2?.sponsor_id === null,
      `sponsor_id=${f2?.sponsor_id}`);
    checkTrue("founder name unchanged", f2?.name === founderName, `name=${f2?.name}`);

    const { data: fl } = await admin
      .from("listings")
      .select("sponsor_names")
      .eq("author_id", founder.id)
      .returns<{ sponsor_names: string[] }[]>();
    checkTrue("founder listings keep 'John Robinson' placeholder",
      (fl ?? []).length > 0 && (fl ?? []).every((l) => l.sponsor_names.includes("John Robinson")),
      `got ${JSON.stringify(fl)}`);
  }

  // ----- summary -----
  console.log(`\n${"─".repeat(48)}`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  if (failed > 0) {
    console.log("RESULT: ✗ FAILURES — see above.");
    process.exit(1);
  }
  console.log("RESULT: ✓ all green. Founder untouched, 0 synthetic rows.");
}

main().catch((error: unknown) => {
  die(error instanceof Error ? error.message : String(error));
});
