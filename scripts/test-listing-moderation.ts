// Listing Moderation prod test harness — Listing Moderation slice.
//
//   npm run test:listing-moderation
//
// Runs against PROD Supabase AFTER migration 0017 is applied. Stands up a
// synthetic admin and a synthetic member through real password sessions
// (anon key + signInWithPassword) — the same path the server actions take —
// and exercises the whole pre-moderation mechanic end-to-end. Service role is
// used only for setup, out-of-band verification reads, and cleanup. The
// founder is never written to.
//
// What it covers (mirrors the build plan §"Test harness"):
//   1.  Member posts → row is 'pending'; NOT on the public/anon browse; IS
//       visible to the owner (listings_read_own).
//   1b. Member cannot INSERT a listing born 'published' (the 0017 trigger's
//       INSERT arm — the API back door the plan's UPDATE-only trigger left
//       open).
//   2.  MEMBER CANNOT SELF-PUBLISH — a direct update to status='published' as
//       the member raises 42501. THE key security assertion of the slice.
//   3.  Admin approve_listing → 'published'; now on the public browse.
//   4.  Admin return_listing(note) on a fresh pending listing → 'draft' +
//       note; member still can't sneak draft → published; a content edit on
//       the draft passes (status unchanged); resubmit (draft → pending) works
//       and the note survives for the next review.
//   5.  Admin reject_listing(note) → 'archived' + note.
//   6.  A non-admin member cannot call any of the three functions.
//   7.  Member archive still works (regression with the new trigger):
//       published → archived AND pending → archived.
//   8.  Cleanup → 0 synthetic rows; the founder's listings come back
//       byte-identical to the opening snapshot.
//
// Synthetic users live on Gmail plus-aliases (same convention as the other
// harnesses) so any auth mail lands in one inbox, and the shared prefix makes
// pre-clean + final-count assertions exact.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "info@manhattanite.com";

const SYNTH_PREFIX = "george.gardner480+modtest";
const synthEmail = (label: string) => `${SYNTH_PREFIX}-${label}@googlemail.com`;
const SYNTH_PASSWORD = "Manhattanite-Test-Moderation-1!";

const ADMIN_NAME = "Quentin Marsh"; // synthetic admin (reviewer)
const M1_NAME = "Marcus Vaughn"; // synthetic member (poster)

const RETURN_NOTE = "Add photos and a firmer price before it goes up.";
const REJECT_NOTE = "Not the kind of listing the network carries.";

// ----- tiny test rig -------------------------------------------------------
let passed = 0;
let failed = 0;

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

function die(message: string): never {
  console.error(`\nFATAL: ${message}`);
  process.exit(1);
}

// ----- helpers -------------------------------------------------------------
async function createSynthUser(
  admin: SupabaseClient,
  label: string,
  fields: { name: string; is_member?: boolean; role?: string }
): Promise<{ id: string; email: string }> {
  const email = synthEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SYNTH_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) die(`Could not create synthetic user ${email}: ${error?.message}`);
  // Service role bypasses RLS + the protect-columns trigger (auth.uid() is
  // null) — the direct path to a named member/admin, same as the other
  // harnesses.
  const { error: updErr } = await admin
    .from("accounts")
    .update(fields)
    .eq("id", data.user.id);
  if (updErr) die(`Could not set up account ${email}: ${updErr.message}`);
  return { id: data.user.id, email };
}

// A signed-in client — anon key + password session, so every query below runs
// under that user's own RLS context (and auth.uid() inside the trigger/guards).
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

// The poster's insert, exactly as lib/listings/create.ts sends it.
async function postListing(
  client: SupabaseClient,
  authorId: string,
  title: string,
  status = "pending"
) {
  return client
    .from("listings")
    .insert({
      author_id: authorId,
      type: "furniture",
      title,
      description: "Synthetic listing for the moderation harness.",
      price_cents: 15000,
      details: { condition: "good" },
      images: [],
      status,
    })
    .select("id, status")
    .maybeSingle<{ id: string; status: string }>();
}

// The exact public browse query (/listings, anon or account).
async function publicBrowseIds(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from("listings")
    .select("id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<{ id: string }[]>();
  if (error) die(`Public browse query failed: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

async function readListing(
  admin: SupabaseClient,
  id: string
): Promise<{ status: string; moderation_note: string | null; title: string }> {
  const { data, error } = await admin
    .from("listings")
    .select("status, moderation_note, title")
    .eq("id", id)
    .single<{ status: string; moderation_note: string | null; title: string }>();
  if (error || !data) die(`Could not read listing ${id}: ${error?.message}`);
  return data;
}

// Delete every synthetic auth.user (by plus-alias prefix). Cascades through
// accounts → listings. Used both as pre-clean and final cleanup.
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

  // Founder snapshot — the closing assertion wants this byte-identical.
  const { data: founder, error: founderErr } = await admin
    .from("accounts")
    .select("id, name, is_member, sponsor_id, role")
    .eq("email", FOUNDER_EMAIL)
    .single<{ id: string; name: string | null; is_member: boolean; sponsor_id: string | null; role: string }>();
  if (founderErr || !founder) die(`Could not read founder (${FOUNDER_EMAIL}): ${founderErr?.message}`);
  console.log(`Founder: ${founder.name} (${founder.id})`);

  type FounderListing = {
    id: string;
    title: string;
    status: string;
    moderation_note: string | null;
    author_name: string | null;
    sponsor_names: string[];
  };
  const { data: founderBefore, error: snapErr } = await admin
    .from("listings")
    .select("id, title, status, moderation_note, author_name, sponsor_names")
    .eq("author_id", founder.id)
    .order("id")
    .returns<FounderListing[]>();
  if (snapErr || !founderBefore) die(`Could not snapshot founder listings: ${snapErr?.message}`);
  console.log(`Snapshot: ${founderBefore.length} founder listing(s) recorded.`);

  console.log("Pre-clean: removing any leftover synthetic users…");
  const preCleaned = await purgeSynthetic(admin);
  if (preCleaned > 0) console.log(`  removed ${preCleaned} leftover synthetic user(s)`);

  try {
    // ----- setup: a synthetic admin + a synthetic member -----
    console.log("\nSetup — synthetic admin + member:");
    const a1 = await createSynthUser(admin, "admin", {
      name: ADMIN_NAME,
      role: "admin",
    });
    const m1 = await createSynthUser(admin, "m1", {
      name: M1_NAME,
      is_member: true,
    });
    const adminClient = await signIn(url, anonKey, a1.email);
    const m1Client = await signIn(url, anonKey, m1.email);
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log(`  admin ${a1.id}, member ${m1.id}`);

    // ----- Test 1: member posts → pending, hidden from the network, visible to owner -----
    console.log("\nTest 1 — post lands in review:");
    const { data: l1, error: postErr } = await postListing(
      m1Client,
      m1.id,
      "Moderation test listing one"
    );
    checkTrue("member insert with status='pending' succeeds", !postErr && !!l1,
      postErr?.message);
    if (!l1) die("Cannot continue without listing 1.");
    check("row is 'pending'", l1.status, "pending");

    const anonIds = await publicBrowseIds(anonClient);
    checkTrue("pending listing absent from public browse", !anonIds.includes(l1.id));

    const { data: ownRead } = await m1Client
      .from("listings")
      .select("id, status")
      .eq("id", l1.id)
      .maybeSingle<{ id: string; status: string }>();
    checkTrue("owner sees their own pending listing (listings_read_own)",
      ownRead?.status === "pending", JSON.stringify(ownRead));

    // ----- Test 1b: member cannot INSERT a listing born published -----
    console.log("\nTest 1b — no publishing through the front door (INSERT):");
    const { data: bornLive, error: bornLiveErr } = await postListing(
      m1Client,
      m1.id,
      "Born-published smuggle attempt",
      "published"
    );
    checkTrue("insert with status='published' raises (trigger INSERT arm)",
      !!bornLiveErr && !bornLive,
      bornLiveErr ? `code=${bornLiveErr.code}` : "insert went through!");
    checkTrue("…with errcode 42501", bornLiveErr?.code === "42501",
      `code=${bornLiveErr?.code} message=${bornLiveErr?.message}`);

    // ----- Test 2: THE KEY ASSERTION — member cannot self-publish -----
    console.log("\nTest 2 — member CANNOT self-publish (UPDATE):");
    const { error: selfPubErr } = await m1Client
      .from("listings")
      .update({ status: "published" })
      .eq("id", l1.id)
      .eq("author_id", m1.id);
    checkTrue("update to status='published' raises", !!selfPubErr,
      "the update went through — the trust wall is down");
    checkTrue("…with errcode 42501 (the 0017 trigger)", selfPubErr?.code === "42501",
      `code=${selfPubErr?.code} message=${selfPubErr?.message}`);

    const afterSelfPub = await readListing(admin, l1.id);
    check("status still 'pending' after the attempt", afterSelfPub.status, "pending");

    // ----- Test 3: admin approves → published & public -----
    console.log("\nTest 3 — admin approve_listing:");
    const { error: approveErr } = await adminClient.rpc("approve_listing", {
      p_listing_id: l1.id,
    });
    checkTrue("approve_listing succeeds for the admin", !approveErr, approveErr?.message);
    const afterApprove = await readListing(admin, l1.id);
    check("status = 'published'", afterApprove.status, "published");

    const anonIdsAfter = await publicBrowseIds(anonClient);
    checkTrue("approved listing now on public browse", anonIdsAfter.includes(l1.id));

    // ----- Test 4: return with note → draft → edit → resubmit -----
    console.log("\nTest 4 — return_listing → member fixes → resubmit:");
    const { data: l2, error: post2Err } = await postListing(
      m1Client,
      m1.id,
      "Moderation test listing two"
    );
    if (post2Err || !l2) die(`Could not post listing 2: ${post2Err?.message}`);

    const { error: returnErr } = await adminClient.rpc("return_listing", {
      p_listing_id: l2.id,
      p_note: RETURN_NOTE,
    });
    checkTrue("return_listing succeeds for the admin", !returnErr, returnErr?.message);
    let l2Row = await readListing(admin, l2.id);
    check("status = 'draft'", l2Row.status, "draft");
    check("moderation_note set", l2Row.moderation_note, RETURN_NOTE);

    // The member still can't shortcut the queue from draft.
    const { error: draftPubErr } = await m1Client
      .from("listings")
      .update({ status: "published" })
      .eq("id", l2.id);
    checkTrue("draft → published as member raises 42501", draftPubErr?.code === "42501",
      `code=${draftPubErr?.code}`);

    // Content edit on the returned draft (status unchanged) — the Edit flow.
    const { error: draftEditErr } = await m1Client
      .from("listings")
      .update({ title: "Moderation test listing two (revised)" })
      .eq("id", l2.id)
      .eq("author_id", m1.id);
    checkTrue("content edit on the draft passes (same → same)", !draftEditErr,
      draftEditErr?.message);

    // Resubmit, exactly as lib/listings/resubmit.ts sends it.
    const { error: resubmitErr } = await m1Client
      .from("listings")
      .update({ status: "pending" })
      .eq("id", l2.id)
      .eq("author_id", m1.id)
      .eq("status", "draft");
    checkTrue("resubmit (draft → pending) passes", !resubmitErr, resubmitErr?.message);
    l2Row = await readListing(admin, l2.id);
    check("status back to 'pending'", l2Row.status, "pending");
    check("note survives the resubmit (context for the reviewer)",
      l2Row.moderation_note, RETURN_NOTE);

    // ----- Test 5: reject with note → archived -----
    console.log("\nTest 5 — admin reject_listing:");
    const { error: rejectErr } = await adminClient.rpc("reject_listing", {
      p_listing_id: l2.id,
      p_note: REJECT_NOTE,
    });
    checkTrue("reject_listing succeeds for the admin", !rejectErr, rejectErr?.message);
    l2Row = await readListing(admin, l2.id);
    check("status = 'archived'", l2Row.status, "archived");
    check("moderation_note carries the reason", l2Row.moderation_note, REJECT_NOTE);

    // ----- Test 6: non-admin cannot call the moderation functions -----
    console.log("\nTest 6 — the admin guard on all three functions:");
    const calls: [string, Record<string, unknown>][] = [
      ["approve_listing", { p_listing_id: l1.id }],
      ["return_listing", { p_listing_id: l1.id, p_note: "nope" }],
      ["reject_listing", { p_listing_id: l1.id, p_note: "nope" }],
    ];
    for (const [fn, args] of calls) {
      const { error: guardErr } = await m1Client.rpc(fn, args);
      checkTrue(`${fn} refused for a non-admin member`,
        !!guardErr && /not authorized/i.test(guardErr.message),
        guardErr?.message ?? "call succeeded!");
    }
    const l1Guarded = await readListing(admin, l1.id);
    check("listing untouched by the refused calls", l1Guarded.status, "published");

    // ----- Test 7: member archive still works (trigger regression) -----
    console.log("\nTest 7 — member Remove still works:");
    // published → archived (the existing Remove flow on a live listing)
    const { error: arch1Err } = await m1Client
      .from("listings")
      .update({ status: "archived" })
      .eq("id", l1.id)
      .eq("author_id", m1.id);
    checkTrue("owner archives a published listing", !arch1Err, arch1Err?.message);
    check("status = 'archived'", (await readListing(admin, l1.id)).status, "archived");

    // pending → archived (pulling a listing out of review)
    const { data: l3, error: post3Err } = await postListing(
      m1Client,
      m1.id,
      "Moderation test listing three"
    );
    if (post3Err || !l3) die(`Could not post listing 3: ${post3Err?.message}`);
    const { error: arch3Err } = await m1Client
      .from("listings")
      .update({ status: "archived" })
      .eq("id", l3.id)
      .eq("author_id", m1.id);
    checkTrue("owner archives a pending listing (out of review)", !arch3Err,
      arch3Err?.message);
    check("status = 'archived'", (await readListing(admin, l3.id)).status, "archived");
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

    const { data: f2 } = await admin
      .from("accounts")
      .select("id, name, is_member, sponsor_id, role")
      .eq("email", FOUNDER_EMAIL)
      .single<{ id: string; name: string | null; is_member: boolean; sponsor_id: string | null; role: string }>();
    check("founder account unchanged", f2, founder);

    const { data: founderAfter } = await admin
      .from("listings")
      .select("id, title, status, moderation_note, author_name, sponsor_names")
      .eq("author_id", founder.id)
      .order("id")
      .returns<FounderListing[]>();
    checkTrue("founder listings unchanged (snapshot match)",
      JSON.stringify(founderAfter) === JSON.stringify(founderBefore),
      `before=${JSON.stringify(founderBefore)} after=${JSON.stringify(founderAfter)}`);
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
