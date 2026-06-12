// One-off prod probe for the Listing Moderation slice (0017).
// Read-only in effect: the only insert attempted uses an invalid status so the
// check constraint rejects it (nothing is written); a second insert with
// status='pending' is deleted immediately if it lands.
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: founder } = await admin
    .from("accounts")
    .select("id")
    .eq("email", "info@manhattanite.com")
    .single<{ id: string }>();
  if (!founder) throw new Error("no founder");

  // 1. Bogus status → the error message names the check constraint.
  const { error: bogusErr } = await admin.from("listings").insert({
    author_id: founder.id,
    type: "furniture",
    title: "probe",
    description: "probe",
    price_cents: 0,
    details: {},
    images: [],
    status: "zz-bogus-probe",
  });
  console.log("1) bogus-status insert error:", JSON.stringify(bogusErr));

  // 2. status='pending' → does prod already allow it?
  const { data: pendingRow, error: pendingErr } = await admin
    .from("listings")
    .insert({
      author_id: founder.id,
      type: "furniture",
      title: "probe-pending",
      description: "probe",
      price_cents: 0,
      details: {},
      images: [],
      status: "pending",
    })
    .select("id")
    .single<{ id: string }>();
  console.log("2) pending insert:", pendingErr ? JSON.stringify(pendingErr) : "ALLOWED");
  if (pendingRow) {
    await admin.from("listings").delete().eq("id", pendingRow.id);
    console.log("   (probe row deleted)");
  }

  // 3. moderation_note column present?
  const { error: colErr } = await admin
    .from("listings")
    .select("moderation_note")
    .limit(1);
  console.log("3) moderation_note column:", colErr ? `MISSING (${colErr.message})` : "EXISTS");

  // 4. approve_listing function present?
  const { error: fnErr } = await admin.rpc("approve_listing", {
    p_listing_id: "00000000-0000-0000-0000-000000000000",
  });
  console.log("4) approve_listing rpc:", JSON.stringify(fnErr?.message ?? "exists"));

  // 5. sponsor_name column still there? (0013 written but maybe unapplied)
  const { error: snErr } = await admin
    .from("listings")
    .select("sponsor_name")
    .limit(1);
  console.log("5) legacy sponsor_name column:", snErr ? "GONE (0013 applied)" : "STILL PRESENT (0013 not applied)");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
