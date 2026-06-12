// Edit & Remove prod test harness — Edit & Remove slice.
//
//   npm run test:edit-archive
//
// Runs against PROD Supabase. No migration ships with this slice — it
// exercises the EXISTING RLS policies (0003: listings_write_member_own_update)
// through real member sessions (anon key + signInWithPassword), which is the
// same path the server actions take. Service role is used only for setup,
// out-of-band verification reads, and cleanup.
//
// What it covers:
//   1. Owner edit    — m1 updates the slice's exact write set (type, title,
//                      description, price_cents, details, images) on their own
//                      listing → fields change; author_name + sponsor_names are
//                      byte-identical to the pre-edit snapshot; status stays
//                      'published'.
//   2. Ownership     — m2 (a different member) CANNOT update or archive m1's
//                      listing. RLS filters the row out: 0 rows affected, no
//                      error, data unchanged (asserted via service role).
//   3. Owner archive — m1 sets status='archived' (no RETURNING — archived rows
//                      aren't SELECT-visible) → status flips; the listing drops
//                      out of the published-browse query; the owner can no
//                      longer read it (which is why /listings/mine omits
//                      archived rows).
//   4. Cleanup       — delete synthetic users → cascade clears accounts,
//                      listings, sponsorships. 0 synthetic rows remain; the
//                      founder's account + listings byline columns come back
//                      byte-identical to the opening snapshot.
//
// Synthetic members live on Gmail plus-aliases (same convention as
// test-multi-sponsor.ts) so any auth mail lands in one inbox, and the shared
// prefix makes pre-clean + final-count assertions exact. The founder is never
// written to.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "info@manhattanite.com";

const SYNTH_PREFIX = "george.gardner480+eatest";
const synthEmail = (label: string) => `${SYNTH_PREFIX}-${label}@googlemail.com`;
const SYNTH_PASSWORD = "Manhattanite-Test-EditArchive-1!";

const M1_NAME = "Marcus Vaughn"; // listing author
const M2_NAME = "Sarah Klein"; // m1's sponsor + the would-be intruder

// ----- tiny test rig -------------------------------------------------------
let passed = 0;
let failed = 0;

// Sort object keys recursively so JSONB round-trips (which reorder keys)
// compare by value, not by key order.
function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => [k, canon(val)])
    );
  }
  return v;
}

function check(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(canon(actual));
  const e = JSON.stringify(canon(expected));
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
async function createSynthMember(
  admin: SupabaseClient,
  label: string,
  name: string
): Promise<{ id: string; email: string }> {
  const email = synthEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SYNTH_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) die(`Could not create synthetic user ${email}: ${error?.message}`);
  // Service role bypasses RLS — direct "member with a name" path, same as
  // test-multi-sponsor.ts.
  const { error: updErr } = await admin
    .from("accounts")
    .update({ name, is_member: true })
    .eq("id", data.user.id);
  if (updErr) die(`Could not set member ${email}: ${updErr.message}`);
  return { id: data.user.id, email };
}

// A signed-in member client — anon key + password session, so every query in
// the tests below runs under the member's own RLS context.
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

// Delete every synthetic auth.user (by plus-alias prefix). Cascades through
// accounts → listings + sponsorships. Used both as pre-clean and final cleanup.
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

  // Founder snapshot — account + listings byline/status columns. The closing
  // assertion wants these byte-identical.
  const { data: founder, error: founderErr } = await admin
    .from("accounts")
    .select("id, name, is_member, sponsor_id")
    .eq("email", FOUNDER_EMAIL)
    .single<{ id: string; name: string | null; is_member: boolean; sponsor_id: string | null }>();
  if (founderErr || !founder) die(`Could not read founder (${FOUNDER_EMAIL}): ${founderErr?.message}`);
  console.log(`Founder: ${founder.name} (${founder.id})`);

  type FounderListing = {
    id: string;
    title: string;
    status: string;
    author_name: string | null;
    sponsor_names: string[];
  };
  const { data: founderBefore, error: snapErr } = await admin
    .from("listings")
    .select("id, title, status, author_name, sponsor_names")
    .eq("author_id", founder.id)
    .order("id")
    .returns<FounderListing[]>();
  if (snapErr || !founderBefore) die(`Could not snapshot founder listings: ${snapErr?.message}`);
  console.log(`Snapshot: ${founderBefore.length} founder listing(s) recorded.`);

  console.log("Pre-clean: removing any leftover synthetic users…");
  const preCleaned = await purgeSynthetic(admin);
  if (preCleaned > 0) console.log(`  removed ${preCleaned} leftover synthetic user(s)`);

  try {
    // ----- setup: two members, m2 sponsors m1, m1 posts a listing -----
    console.log("\nSetup — synthetic members + listing:");
    const m1 = await createSynthMember(admin, "m1", M1_NAME);
    const m2 = await createSynthMember(admin, "m2", M2_NAME);

    // Give m1 a real sponsor so sponsor_names is non-empty — that makes the
    // "byline untouched by an edit" assertion mean something.
    const { error: sponErr } = await admin.rpc("add_sponsor", {
      p_member_id: m1.id,
      p_sponsor_id: m2.id,
    });
    if (sponErr) die(`add_sponsor(m1, m2) failed: ${sponErr.message}`);

    const { data: listing, error: listErr } = await admin
      .from("listings")
      .insert({
        author_id: m1.id,
        type: "furniture",
        title: "Edit-archive test listing (original)",
        description: "Synthetic listing for the edit & remove slice test.",
        price_cents: 10000,
        details: { condition: "good" },
        images: [],
        status: "published",
      })
      .select("id, author_name, sponsor_names")
      .single<{ id: string; author_name: string | null; sponsor_names: string[] }>();
    if (listErr || !listing) die(`Could not insert listing: ${listErr?.message}`);
    const listingId = listing.id;

    // Pre-edit byline snapshot (the thing an edit must never change).
    const bylineBefore = {
      author_name: listing.author_name,
      sponsor_names: listing.sponsor_names,
    };
    checkTrue(
      "setup: sponsor_names non-empty (assertion has teeth)",
      listing.sponsor_names.length > 0,
      JSON.stringify(listing.sponsor_names)
    );

    const m1Client = await signIn(url, anonKey, m1.email);
    const m2Client = await signIn(url, anonKey, m2.email);

    // ----- Test 1: owner edits own listing (the slice's exact write set) -----
    console.log("\nTest 1 — owner edit (write set only; byline untouched):");
    const newImages = [{ path: `${m1.id}/test-image.jpg` }];
    const { data: updated, error: updErr } = await m1Client
      .from("listings")
      .update({
        type: "furniture",
        title: "Edit-archive test listing (updated)",
        description: "Updated description — the edit slice at work.",
        price_cents: 22500,
        details: { condition: "like new", brand: "Test Brand" },
        images: newImages,
      })
      .eq("id", listingId)
      .eq("author_id", m1.id)
      .select("id")
      .returns<{ id: string }[]>();
    checkTrue("owner update affected 1 row", !updErr && updated?.length === 1,
      updErr?.message ?? `rows=${updated?.length}`);

    const { data: afterEdit, error: afterErr } = await admin
      .from("listings")
      .select("title, description, price_cents, details, images, status, author_name, sponsor_names")
      .eq("id", listingId)
      .single<{
        title: string; description: string; price_cents: number;
        details: Record<string, unknown>; images: unknown; status: string;
        author_name: string | null; sponsor_names: string[];
      }>();
    if (afterErr || !afterEdit) die(`Could not re-read listing: ${afterErr?.message}`);

    check("title changed", afterEdit.title, "Edit-archive test listing (updated)");
    check("price changed", afterEdit.price_cents, 22500);
    check("details replaced", afterEdit.details, { condition: "like new", brand: "Test Brand" });
    check("images changed", afterEdit.images, newImages);
    check("status still 'published'", afterEdit.status, "published");
    check("author_name UNCHANGED", afterEdit.author_name, bylineBefore.author_name);
    check("sponsor_names UNCHANGED", afterEdit.sponsor_names, bylineBefore.sponsor_names);

    // ----- Test 2: a second member cannot update or archive m1's listing -----
    console.log("\nTest 2 — ownership (RLS filters the row out):");
    const { data: intruderUpd, error: intruderUpdErr } = await m2Client
      .from("listings")
      .update({ title: "Hijacked title" })
      .eq("id", listingId)
      .select("id")
      .returns<{ id: string }[]>();
    checkTrue("m2 update affected 0 rows (no error, just filtered)",
      !intruderUpdErr && intruderUpd?.length === 0,
      intruderUpdErr?.message ?? `rows=${intruderUpd?.length}`);

    const { error: intruderArchErr } = await m2Client
      .from("listings")
      .update({ status: "archived" })
      .eq("id", listingId);
    checkTrue("m2 archive attempt returned no error (filtered, not failed)", !intruderArchErr,
      intruderArchErr?.message);

    const { data: afterIntruder } = await admin
      .from("listings")
      .select("title, status")
      .eq("id", listingId)
      .single<{ title: string; status: string }>();
    check("title untouched by m2", afterIntruder?.title, "Edit-archive test listing (updated)");
    check("status untouched by m2", afterIntruder?.status, "published");

    // ----- Test 3: owner archives (soft delete) -----
    console.log("\nTest 3 — owner archive (soft delete):");
    // Mirrors lib/listings/archive.ts exactly (no .select()). Pre-0016 this
    // failed: with no SELECT policy for the owner's own non-published rows, the
    // archive's row-visibility check after flipping status='archived' had
    // nothing to satisfy. Migration 0016 (listings_read_own) is the fix.
    const { error: archErr } = await m1Client
      .from("listings")
      .update({ status: "archived" })
      .eq("id", listingId)
      .eq("author_id", m1.id);
    checkTrue("owner archive returned no error (0016 read-own unblocks it)",
      !archErr, archErr?.message);

    const { data: afterArchive } = await admin
      .from("listings")
      .select("status")
      .eq("id", listingId)
      .single<{ status: string }>();
    check("status = 'archived' (row preserved, not deleted)", afterArchive?.status, "archived");

    // The exact published-browse query (/listings) no longer returns it.
    const { data: browseRows } = await m2Client
      .from("listings")
      .select("id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<{ id: string }[]>();
    checkTrue("archived listing absent from published browse",
      !(browseRows ?? []).some((r) => r.id === listingId));

    // Owner CAN now read their own archived row (migration 0016,
    // listings_read_own). That's both what unblocks the archive and what makes
    // a future unarchive UI possible; /listings/mine still filters to
    // status='published', so archived listings stay off the member's list today.
    const { data: ownerRead } = await m1Client
      .from("listings")
      .select("id, status")
      .eq("id", listingId)
      .maybeSingle<{ id: string; status: string }>();
    checkTrue("owner can read own archived row (0016 read-own policy)",
      ownerRead?.status === "archived",
      `ownerRead=${JSON.stringify(ownerRead)}`);
  } finally {
    // ----- Test 4: cleanup -----
    console.log("\nTest 4 — cleanup:");
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
      .select("id, name, is_member, sponsor_id")
      .eq("email", FOUNDER_EMAIL)
      .single<{ id: string; name: string | null; is_member: boolean; sponsor_id: string | null }>();
    check("founder account unchanged",
      f2,
      { id: founder.id, name: founder.name, is_member: founder.is_member, sponsor_id: founder.sponsor_id });

    const { data: founderAfter } = await admin
      .from("listings")
      .select("id, title, status, author_name, sponsor_names")
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
