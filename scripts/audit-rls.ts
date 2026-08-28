// RLS / trust-gate audit harness — Week 12 hardening (2026-08-13).
//
//   node --env-file=.env.local --import tsx scripts/audit-rls.ts
//
// Attacks the API, not the UI: every cell is a real supabase-js call with the
// anon key or a synthetic user's password JWT, hitting PostgREST + storage
// directly. Three principals (anon, Tier-1 account, member), plus a synthetic
// second member and a synthetic admin for cross-user / positive-control cells.
//
// SAFETY — cleanup is scoped to a UNIQUE sub-prefix:
//   SYNTH_PREFIX = "george.gardner480+rlsaudit"
// The bare "george.gardner480+" prefix ALSO covers the permanent SEED MEMBERS
// (Anna, Max, Lila, Sam — the seed-* accounts that own 10 published listings).
// A blind purge of the bare prefix would delete most of the live marketplace.
// This harness only ever creates/deletes "+rlsaudit-*" rows. Seed members and
// the founder are read-only here and asserted untouched at the end.
//
// Storage cleanup uses the Storage API (.remove) — direct storage.objects
// table deletes are blocked in prod (error 42501).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "info@manhattanite.com";
const SEED_PREFIX = "george.gardner480+seed"; // permanent — must survive
const SYNTH_PREFIX = "george.gardner480+rlsaudit"; // this run — cleaned up
const synthEmail = (label: string) => `${SYNTH_PREFIX}-${label}@googlemail.com`;
const PW = "Manhattanite-RLS-Audit-2026-1!";

// 1x1 transparent PNG — a valid tiny image the bucket MIME/size limits accept.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// ---- results collection ---------------------------------------------------
type Expected = "ALLOW" | "DENY";
type Row = {
  principal: string;
  object: string;
  op: string;
  expected: Expected;
  actual: Expected;
  detail: string;
};
const rows: Row[] = [];
let unexpected = 0;

function rec(
  principal: string,
  object: string,
  op: string,
  expected: Expected,
  actual: Expected,
  detail = ""
): void {
  const ok = expected === actual;
  if (!ok) unexpected++;
  rows.push({ principal, object, op, expected, actual, detail });
  const mark = ok ? "✓" : "✗ UNEXPECTED";
  console.log(
    `  ${mark} [${principal}] ${object} · ${op} — exp ${expected}, got ${actual}${
      detail ? `  (${detail})` : ""
    }`
  );
}

function die(m: string): never {
  console.error(`\nFATAL: ${m}`);
  process.exit(1);
}

// A read is ALLOWed if it returns >=1 row with no error; DENYied if 0 rows / error.
function readVerdict(data: unknown[] | null, error: { message: string } | null): {
  actual: Expected;
  detail: string;
} {
  if (error) return { actual: "DENY", detail: `err: ${error.message}` };
  const n = data?.length ?? 0;
  return { actual: n > 0 ? "ALLOW" : "DENY", detail: `${n} row(s)` };
}

// A write is ALLOWed if no error AND >=1 row affected; else DENY.
function writeVerdict(
  count: number | null,
  error: { message: string; code?: string } | null
): { actual: Expected; detail: string } {
  if (error)
    return { actual: "DENY", detail: `err ${error.code ?? ""}: ${error.message}` };
  const n = count ?? 0;
  return { actual: n > 0 ? "ALLOW" : "DENY", detail: `${n} row(s) affected` };
}

async function createUser(
  admin: SupabaseClient,
  label: string,
  fields: { name: string; is_member?: boolean; role?: string; neighborhood?: string }
): Promise<{ id: string; email: string }> {
  const email = synthEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
  });
  if (error || !data.user) die(`create ${email}: ${error?.message}`);
  const { error: uErr } = await admin.from("accounts").update(fields).eq("id", data.user.id);
  if (uErr) die(`setup ${email}: ${uErr.message}`);
  return { id: data.user.id, email };
}

// Prod Supabase Auth now gates signInWithPassword behind Cloudflare Turnstile
// (spam-protection, enabled after the June harnesses were written), so the
// direct password path fails with "captcha protection: request disallowed".
// We instead mint a session the CAPTCHA can't see: admin.generateLink (a
// service-role call, no captcha) yields a one-time token_hash, and verifyOtp
// consumes it on the anon client to establish a real authenticated-user JWT
// (role=authenticated, sub=<uid>) — the identical RLS context a UI login gives.
async function signIn(admin: SupabaseClient, url: string, anonKey: string, email: string): Promise<SupabaseClient> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) die(`generateLink ${email}: ${error?.message ?? "no token_hash"}`);
  const c = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: vErr } = await c.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (vErr) die(`verifyOtp ${email}: ${vErr.message}`);
  return c;
}

// Purge ONLY this run's +rlsaudit users (cascades to their accounts/listings/
// applications/invites via FKs). Storage objects removed separately below.
async function purge(admin: SupabaseClient): Promise<number> {
  let removed = 0;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) die(`listUsers: ${error.message}`);
    for (const u of data.users) {
      if (u.email?.startsWith(SYNTH_PREFIX)) {
        const { error: dErr } = await admin.auth.admin.deleteUser(u.id);
        if (dErr) die(`deleteUser ${u.email}: ${dErr.message}`);
        removed++;
      }
    }
    if (data.users.length < 200) break;
  }
  return removed;
}

async function removeStorageFolder(admin: SupabaseClient, bucket: string, uid: string) {
  const { data } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
  if (data && data.length) {
    await admin.storage.from(bucket).remove(data.map((o) => `${uid}/${o.name}`));
  }
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) die("missing env (url/service/anon)");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ---- snapshots for the untouched-assertions ----
  const { data: founder } = await admin
    .from("accounts")
    .select("id, email, name, is_member, sponsor_id, role")
    .eq("email", FOUNDER_EMAIL)
    .single<{ id: string; email: string; name: string; is_member: boolean; sponsor_id: string | null; role: string }>();
  if (!founder) die("no founder");
  const { count: seedBefore } = await admin
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .like("email", `${SEED_PREFIX}%`);
  const { count: publishedBefore } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  console.log(
    `Founder ${founder.id} (role=${founder.role}). Seed members: ${seedBefore}. Published listings: ${publishedBefore}.`
  );

  console.log("Pre-clean (+rlsaudit only)…");
  await purge(admin);

  // A known archived listing id (for the "read archived" deny cells).
  const { data: archived } = await admin
    .from("listings")
    .select("id, title")
    .eq("status", "archived")
    .limit(1)
    .maybeSingle<{ id: string; title: string }>();

  let m1uid = "";
  let m2uid = "";
  try {
    // ---- principals ----
    console.log("\nSetup — principals:");
    const t1 = await createUser(admin, "t1", { name: "Tess One", neighborhood: "Chelsea" });
    const m1 = await createUser(admin, "m1", { name: "Mel Member", is_member: true });
    const m2 = await createUser(admin, "m2", { name: "Moe Second", is_member: true });
    const ad = await createUser(admin, "admin", { name: "Ada Admin", role: "admin", is_member: true });
    m1uid = m1.id;
    m2uid = m2.id;

    const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const t1c = await signIn(admin, url, anonKey, t1.email);
    const m1c = await signIn(admin, url, anonKey, m1.email);
    const m2c = await signIn(admin, url, anonKey, m2.email);
    const adc = await signIn(admin, url, anonKey, ad.email);
    console.log(`  t1=${t1.id} m1=${m1.id} m2=${m2.id} admin=${ad.id}`);

    // A published listing owned by M2, via the real moderation path (pending → admin approve).
    const { data: m2listing, error: m2lErr } = await m2c
      .from("listings")
      .insert({ author_id: m2.id, type: "furniture", title: "RLS audit — M2 sofa", description: "audit", price_cents: 12000, details: {}, images: [], status: "pending" })
      .select("id, status")
      .single<{ id: string; status: string }>();
    if (m2lErr || !m2listing) die(`m2 insert listing: ${m2lErr?.message}`);
    await adc.rpc("approve_listing", { p_listing_id: m2listing.id });
    // M1's own pending listing (stays pending — the moderation-wall subject).
    const { data: m1listing, error: m1lErr } = await m1c
      .from("listings")
      .insert({ author_id: m1.id, type: "furniture", title: "RLS audit — M1 pending", description: "audit", price_cents: 9000, details: {}, images: [], status: "pending" })
      .select("id, status")
      .single<{ id: string; status: string }>();
    if (m1lErr || !m1listing) die(`m1 insert listing: ${m1lErr?.message}`);

    // ======================= ANON =======================
    console.log("\n── ANON ──");
    {
      const { data, error } = await anon.from("listings").select("id").eq("status", "published").limit(5);
      const v = readVerdict(data, error);
      rec("anon", "listings (published)", "select", "ALLOW", v.actual, v.detail);
    }
    for (const tbl of ["accounts", "applications", "listing_contacts", "sponsorships", "invites", "sponsorship_requests"]) {
      const { data, error } = await anon.from(tbl).select("*").limit(5);
      const v = readVerdict(data, error);
      rec("anon", tbl, "select", "DENY", v.actual, v.detail);
    }
    {
      const { data, error } = await anon.from("listings").select("id").eq("id", m1listing.id);
      const v = readVerdict(data, error);
      rec("anon", "listings (a pending row)", "select", "DENY", v.actual, v.detail);
    }
    if (archived) {
      const { data, error } = await anon.from("listings").select("id").eq("id", archived.id);
      const v = readVerdict(data, error);
      rec("anon", "listings (an archived row)", "select", "DENY", v.actual, v.detail);
    }
    {
      const { error, count } = await anon
        .from("listings")
        .insert({ author_id: founder.id, type: "furniture", title: "anon insert", description: "x", price_cents: 1, details: {}, images: [], status: "pending" }, { count: "exact" });
      const v = writeVerdict(count, error);
      rec("anon", "listings", "insert", "DENY", v.actual, v.detail);
    }
    {
      const { error, count } = await anon.from("listings").update({ title: "hijack" }, { count: "exact" }).eq("id", m2listing.id);
      const v = writeVerdict(count, error);
      rec("anon", "listings (M2's)", "update", "DENY", v.actual, v.detail);
    }
    {
      const { error, count } = await anon.from("listings").delete({ count: "exact" }).eq("id", m2listing.id);
      const v = writeVerdict(count, error);
      rec("anon", "listings (M2's)", "delete", "DENY", v.actual, v.detail);
    }

    // ======================= TIER-1 ACCOUNT =======================
    console.log("\n── TIER-1 ACCOUNT ──");
    {
      const { data, error } = await t1c.from("listings").select("id").eq("status", "published").limit(5);
      rec("t1", "listings (published)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await t1c.from("accounts").select("id, name").eq("id", t1.id);
      rec("t1", "accounts (own row)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { error, count } = await t1c.from("accounts").update({ name: "Tess Edited", neighborhood: "SoHo", bio: "hi" }, { count: "exact" }).eq("id", t1.id);
      rec("t1", "accounts (own: name/nbhd/bio)", "update", "ALLOW", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // Escalation attempts on own row → protect_account_columns trigger.
    for (const [col, patch] of [["is_member", { is_member: true }], ["role", { role: "admin" }], ["sponsor_id", { sponsor_id: founder.id }]] as const) {
      const { error, count } = await t1c.from("accounts").update(patch, { count: "exact" }).eq("id", t1.id);
      rec("t1", `accounts (own: ${col})`, "update-escalate", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { data, error } = await t1c.from("accounts").select("id").eq("id", m1.id);
      rec("t1", "accounts (another's row)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    // Application: insert own when not member, then read own.
    {
      const { error, count } = await t1c.from("applications").insert({ account_id: t1.id, occupation: "auditor", about: "audit", neighborhood: "Chelsea" }, { count: "exact" });
      rec("t1", "applications (own, not member)", "insert", "ALLOW", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    let t1AppId = "";
    {
      const { data, error } = await t1c.from("applications").select("id").eq("account_id", t1.id);
      t1AppId = data?.[0]?.id ?? "";
      rec("t1", "applications (own)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await t1c.from("applications").select("id").neq("account_id", t1.id).limit(5);
      rec("t1", "applications (others')", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    // The wall — Tier-1 cannot act.
    {
      const { error, count } = await t1c.from("listings").insert({ author_id: t1.id, type: "furniture", title: "t1 insert", description: "x", price_cents: 1, details: {}, images: [], status: "pending" }, { count: "exact" });
      rec("t1", "listings", "insert", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error, count } = await t1c.from("listing_contacts").insert({ listing_id: m2listing.id, sender_id: t1.id, message: "hi" }, { count: "exact" });
      rec("t1", "listing_contacts", "insert", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error, count } = await t1c.from("invites").insert({ token: "t1-tok-" + t1.id, inviter_id: t1.id, invitee_email: "x@example.com" }, { count: "exact" });
      rec("t1", "invites", "insert", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error, count } = await t1c.from("sponsorship_requests").insert({ application_id: t1AppId, requester_id: t1.id, sponsor_id: founder.id, token: "t1-sr-" + t1.id }, { count: "exact" });
      rec("t1", "sponsorship_requests", "insert", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error } = await t1c.rpc("approve_application", { p_application_id: t1AppId });
      rec("t1", "approve_application()", "rpc", "DENY", error ? "DENY" : "ALLOW", error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "call succeeded!");
    }

    // ======================= MEMBER =======================
    console.log("\n── MEMBER ──");
    {
      const { data, error } = await m1c.from("listings").select("id").eq("id", m1listing.id);
      rec("m1", "listings (own pending)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { error, count } = await m1c.from("listings").update({ price_cents: 9500 }, { count: "exact" }).eq("id", m1listing.id).eq("author_id", m1.id);
      rec("m1", "listings (own: content edit)", "update", "ALLOW", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // THE moderation wall — member cannot self-publish (insert-born-published + update→published).
    {
      const { error, count } = await m1c.from("listings").insert({ author_id: m1.id, type: "furniture", title: "born live", description: "x", price_cents: 1, details: {}, images: [], status: "published" }, { count: "exact" });
      rec("m1", "listings (born published)", "insert", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error, count } = await m1c.from("listings").update({ status: "published" }, { count: "exact" }).eq("id", m1listing.id).eq("author_id", m1.id);
      rec("m1", "listings (own: self-publish)", "update→published", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // Cross-member tamper.
    {
      const { error, count } = await m1c.from("listings").update({ title: "stolen" }, { count: "exact" }).eq("id", m2listing.id);
      rec("m1", "listings (M2's)", "update", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    {
      const { error, count } = await m1c.from("listings").delete({ count: "exact" }).eq("id", m2listing.id);
      rec("m1", "listings (M2's)", "delete", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // Member escalation on own row.
    {
      const { error, count } = await m1c.from("accounts").update({ role: "admin" }, { count: "exact" }).eq("id", m1.id);
      rec("m1", "accounts (own: role)", "update-escalate", "DENY", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // Contact M2's published listing (member-only action) via the DEFINER fn.
    {
      const { data, error } = await m1c.rpc("log_listing_contact", { p_listing_id: m2listing.id, p_message: "Is this still available?" });
      const ok = !error && Array.isArray(data) && data.length > 0;
      rec("m1", "log_listing_contact() (M2's listing)", "rpc", "ALLOW", ok ? "ALLOW" : "DENY", error ? `err: ${error.message}` : `${(data as unknown[])?.length ?? 0} row(s)`);
    }
    // Create an invite.
    let m1InviteToken = "rlsaudit-inv-" + m1.id;
    {
      const { error, count } = await m1c.from("invites").insert({ token: m1InviteToken, inviter_id: m1.id, invitee_email: "friend@example.com", invitee_name: "Friend" }, { count: "exact" });
      rec("m1", "invites (own)", "insert", "ALLOW", ...Object.values(writeVerdict(count, error)) as [Expected, string]);
    }
    // See own connections.
    {
      const { error } = await m1c.rpc("get_my_connections");
      rec("m1", "get_my_connections()", "rpc", "ALLOW", error ? "DENY" : "ALLOW", error ? `err: ${error.message}` : "ok");
    }
    // Must fail: read M2's contacts / invites; admin-style reads.
    {
      const { data, error } = await m1c.from("listing_contacts").select("*").limit(5);
      rec("m1", "listing_contacts (any)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    // M2 creates an invite so there's a foreign invite for m1 to fail to read.
    await m2c.from("invites").insert({ token: "rlsaudit-inv-m2-" + m2.id, inviter_id: m2.id, invitee_email: "m2friend@example.com" });
    {
      const { data, error } = await m1c.from("invites").select("id").eq("inviter_id", m2.id);
      rec("m1", "invites (M2's)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await m1c.from("accounts").select("id").neq("id", m1.id).limit(5);
      rec("m1", "accounts (all — admin read)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await m1c.from("applications").select("id").limit(5);
      rec("m1", "applications (all — admin read)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }

    // ======================= MODERATION WALL (cross-principal visibility) =======================
    console.log("\n── MODERATION WALL — M1's pending listing hidden until approved ──");
    for (const [name, client] of [["anon", anon], ["t1", t1c], ["m2", m2c]] as const) {
      const { data, error } = await client.from("listings").select("id").eq("id", m1listing.id);
      rec(name, "listings (M1's pending)", "select", "DENY", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      // Anon browse should not contain it.
      const { data } = await anon.from("listings").select("id").eq("status", "published").limit(200);
      const present = (data ?? []).some((r) => r.id === m1listing.id);
      rec("anon", "public browse contains M1 pending?", "select", "DENY", present ? "ALLOW" : "DENY", present ? "LEAKED" : "absent");
    }
    {
      await adc.rpc("approve_listing", { p_listing_id: m1listing.id });
      const { data } = await anon.from("listings").select("id").eq("id", m1listing.id);
      rec("anon", "listings (M1's AFTER approve)", "select", "ALLOW", (data?.length ?? 0) > 0 ? "ALLOW" : "DENY", `${data?.length ?? 0} row(s)`);
    }

    // ============ 0028: THE TWO ADMIN WRITE DOORS ============
    // A NEW WRITE PATH WITH NO RLS ASSERTION IS AN UNTESTED WRITE PATH. Slice 3b
    // gave an admin the ability to edit and take down ANY listing, which is the
    // first time anything but the owner could write to somebody else's row. The
    // owner-only policy (listings_write_member_own_update) was deliberately NOT
    // loosened to achieve it — the policy is the wall, the two SECURITY DEFINER
    // functions are the door — so the thing to prove is that the door is the
    // only way through and that it is locked to everyone but an admin.
    console.log("\n── ADMIN WRITE DOORS (0028) ──");
    {
      // A member calling the correction function on ANOTHER member's listing.
      const { error } = await m1c.rpc("admin_update_listing", {
        p_listing_id: m2listing.id,
        p_type: "furniture",
        p_title: "hijacked by a member",
        p_description: "should never land",
        p_price_cents: 1,
        p_details: {},
        p_images: [],
      });
      rec("m1", "admin_update_listing() (M2s listing)", "rpc", "DENY", error ? "DENY" : "ALLOW",
        error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "call succeeded!");
    }
    {
      // And on their OWN — being the owner must not buy the admin door either,
      // or the guard is really an ownership check wearing an admin label.
      const { error } = await m1c.rpc("admin_archive_listing", {
        p_listing_id: m1listing.id,
        p_note: "member calling the admin take-down",
      });
      rec("m1", "admin_archive_listing() (own listing)", "rpc", "DENY", error ? "DENY" : "ALLOW",
        error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "call succeeded!");
    }
    {
      // Tier 1 is not a member at all — the weakest principal that can hold a
      // session, and the one most likely to be forgotten in a guard.
      const { error } = await t1c.rpc("admin_archive_listing", {
        p_listing_id: m2listing.id,
        p_note: "tier 1 calling the admin take-down",
      });
      rec("t1", "admin_archive_listing()", "rpc", "DENY", error ? "DENY" : "ALLOW",
        error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "call succeeded!");
    }
    {
      // The positive control. Every "must be refused" assertion needs one
      // beside it, or a function that refuses EVERYONE passes the whole set.
      const { error } = await adc.rpc("admin_update_listing", {
        p_listing_id: m2listing.id,
        p_type: "furniture",
        p_title: "corrected by the audit",
        p_description: "admin correction, positive control",
        p_price_cents: 12345,
        p_details: { condition: "good" },
        p_images: [],
      });
      rec("admin", "admin_update_listing() (M2s listing)", "rpc", "ALLOW", error ? "DENY" : "ALLOW",
        error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "ok");
    }
    {
      // A correction must NOT re-pend a live listing, and it must NOT rewrite
      // the byline. Both are read back out of band through the service role.
      const { data } = await admin.from("listings")
        .select("title, status, author_name, corrected_by, corrected_at")
        .eq("id", m2listing.id)
        .maybeSingle<{ title: string; status: string; author_name: string | null; corrected_by: string | null; corrected_at: string | null }>();
      const okTitle = data?.title === "corrected by the audit";
      const stamped = Boolean(data?.corrected_by) && Boolean(data?.corrected_at);
      rec("admin", "admin_update_listing: content written + stamped", "verify",
        "ALLOW", okTitle && stamped ? "ALLOW" : "DENY",
        `title=${data?.title} corrected_by=${data?.corrected_by ? "set" : "null"} corrected_at=${data?.corrected_at ? "set" : "null"}`);
      rec("admin", "admin_update_listing: status untouched", "verify",
        "ALLOW", data?.status === "published" ? "ALLOW" : "DENY",
        `status=${data?.status} (a correction must not pull a live listing off the site)`);
    }
    {
      const { error } = await adc.rpc("admin_archive_listing", {
        p_listing_id: m2listing.id,
        p_note: "taken down by the audit",
      });
      const { data } = await admin.from("listings").select("status, moderation_note").eq("id", m2listing.id).maybeSingle<{ status: string; moderation_note: string | null }>();
      rec("admin", "admin_archive_listing() (M2s listing)", "rpc", "ALLOW",
        !error && data?.status === "archived" ? "ALLOW" : "DENY",
        error ? `err ${error.message}` : `status=${data?.status} note=${data?.moderation_note ?? "(none)"}`);
    }
    {
      // The reason is the record, so an empty one is refused in the database
      // and not only in the form.
      const { error } = await adc.rpc("admin_archive_listing", {
        p_listing_id: m1listing.id,
        p_note: "   ",
      });
      rec("admin", "admin_archive_listing() (blank reason)", "rpc", "DENY", error ? "DENY" : "ALLOW",
        error ? `err ${(error as { code?: string }).code ?? ""}: ${error.message}` : "call succeeded!");
    }

    // ======================= STORAGE =======================
    console.log("\n── STORAGE (listing-images, private bucket) ──");
    const m1path = `${m1.id}/${crypto.randomUUID()}.png`;
    const m2path = `${m2.id}/${crypto.randomUUID()}.png`;
    {
      const { error } = await m1c.storage.from("listing-images").upload(m1path, PNG_1x1, { contentType: "image/png" });
      rec("m1", "storage listing-images (own folder)", "upload", "ALLOW", error ? "DENY" : "ALLOW", error?.message ?? "ok");
    }
    {
      const { error } = await m2c.storage.from("listing-images").upload(m2path, PNG_1x1, { contentType: "image/png" });
      if (error) console.log(`   (m2 upload setup failed: ${error.message})`);
    }
    // Member upload into ANOTHER user's folder must fail.
    {
      const foreign = `${m2.id}/${crypto.randomUUID()}.png`;
      const { error } = await m1c.storage.from("listing-images").upload(foreign, PNG_1x1, { contentType: "image/png" });
      rec("m1", "storage listing-images (M2's folder)", "upload", "DENY", error ? "DENY" : "ALLOW", error?.message ?? "UPLOADED!");
    }
    // Direct (unsigned) object URL with no JWT must fail.
    {
      const direct = `${url}/storage/v1/object/listing-images/${m1path}`;
      const res = await fetch(direct);
      rec("anon", "storage direct object URL (unsigned)", "GET", "DENY", res.ok ? "ALLOW" : "DENY", `HTTP ${res.status}`);
    }
    // Signed URL must work (anon can mint + fetch, per 0018).
    {
      const { data, error } = await anon.storage.from("listing-images").createSignedUrl(m1path, 60);
      let httpOk = false;
      if (data?.signedUrl) httpOk = (await fetch(data.signedUrl)).ok;
      rec("anon", "storage signed URL", "GET", "ALLOW", !error && httpOk ? "ALLOW" : "DENY", error?.message ?? `signed fetch ok=${httpOk}`);
    }
    // Cross-user delete must fail.
    {
      const { data, error } = await m1c.storage.from("listing-images").remove([m2path]);
      // Storage .remove returns data=[] (no error) when RLS blocks it — treat empty as DENY.
      const removedN = Array.isArray(data) ? data.length : 0;
      rec("m1", "storage listing-images (delete M2's file)", "delete", "DENY", error || removedN === 0 ? "DENY" : "ALLOW", error?.message ?? `removed ${removedN}`);
    }
    // Own delete should work (also cleans up m1's object).
    {
      const { data, error } = await m1c.storage.from("listing-images").remove([m1path]);
      const removedN = Array.isArray(data) ? data.length : 0;
      rec("m1", "storage listing-images (delete own file)", "delete", "ALLOW", !error && removedN > 0 ? "ALLOW" : "DENY", error?.message ?? `removed ${removedN}`);
    }

    // ======================= ADMIN positive controls =======================
    console.log("\n── ADMIN (positive controls) ──");
    {
      const { data, error } = await adc.from("accounts").select("id").limit(10);
      rec("admin", "accounts (all)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await adc.from("applications").select("id").limit(10);
      rec("admin", "applications (all)", "select", "ALLOW", ...Object.values(readVerdict(data, error)) as [Expected, string]);
    }
    {
      const { data, error } = await adc.from("listings").select("id").eq("status", "pending").limit(10);
      // May legitimately be 0 now (we approved ours); assert no-error authorization instead.
      rec("admin", "listings (incl pending)", "select", "ALLOW", error ? "DENY" : "ALLOW", error?.message ?? `${data?.length ?? 0} pending visible`);
    }
  } finally {
    // ======================= CLEANUP =======================
    console.log("\n── CLEANUP (scoped to +rlsaudit) ──");
    if (m1uid) { await removeStorageFolder(admin, "listing-images", m1uid); await removeStorageFolder(admin, "avatars", m1uid); }
    if (m2uid) { await removeStorageFolder(admin, "listing-images", m2uid); await removeStorageFolder(admin, "avatars", m2uid); }
    const removed = await purge(admin);
    console.log(`  removed ${removed} synthetic user(s)`);

    const { count: synthLeft } = await admin.from("accounts").select("id", { count: "exact", head: true }).like("email", `${SYNTH_PREFIX}%`);
    rec("cleanup", "accounts (+rlsaudit)", "count==0", "ALLOW", synthLeft === 0 ? "ALLOW" : "DENY", `count=${synthLeft}`);

    const { count: seedAfter } = await admin.from("accounts").select("id", { count: "exact", head: true }).like("email", `${SEED_PREFIX}%`);
    rec("cleanup", "seed members intact", "count unchanged", "ALLOW", seedAfter === seedBefore ? "ALLOW" : "DENY", `before=${seedBefore} after=${seedAfter}`);

    const { count: publishedAfter } = await admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "published");
    rec("cleanup", "published listings intact", "count unchanged", "ALLOW", publishedAfter === publishedBefore ? "ALLOW" : "DENY", `before=${publishedBefore} after=${publishedAfter}`);

    const { data: f2 } = await admin.from("accounts").select("id, email, name, is_member, sponsor_id, role").eq("email", FOUNDER_EMAIL).single();
    const same = JSON.stringify(f2) === JSON.stringify(founder);
    rec("cleanup", "founder row untouched", "snapshot match", "ALLOW", same ? "ALLOW" : "DENY", same ? "identical" : `now=${JSON.stringify(f2)}`);
  }

  // ---- summary + machine-readable dump ----
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Cells: ${rows.length}   Unexpected (LAUNCH-BLOCKERS): ${unexpected}`);
  console.log("═".repeat(60));
  console.log("JSON_RESULTS_START");
  console.log(JSON.stringify(rows, null, 0));
  console.log("JSON_RESULTS_END");
  if (unexpected > 0) { console.log("RESULT: ✗ UNEXPECTED ALLOWs — see rows above."); process.exit(2); }
  console.log("RESULT: ✓ every cell matched expectation.");
}

main().catch((e: unknown) => die(e instanceof Error ? e.stack ?? e.message : String(e)));
