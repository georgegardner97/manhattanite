// One-off probe: characterize the LIVE listings RLS policies in prod.
// Context: the edit-archive harness found a member CAN update their own
// listing's fields but CANNOT set status='archived' (WITH CHECK violation),
// which contradicts migration 0003. This probe narrows down what the prod
// update policy actually allows. Synthetic member only; auto-cleanup.
//
//   node --env-file=.env.local --import tsx scripts/probe-listing-policies.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SYNTH_PREFIX = "george.gardner480+eaprobe";
const EMAIL = `${SYNTH_PREFIX}-p1@googlemail.com`;
const PASSWORD = "Manhattanite-Test-Probe-1!";

function die(message: string): never {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

async function purge(admin: SupabaseClient): Promise<void> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) die(error.message);
  for (const u of data.users) {
    if (u.email?.startsWith(SYNTH_PREFIX)) await admin.auth.admin.deleteUser(u.id);
  }
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !serviceKey || !anonKey) die("missing env");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await purge(admin);

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (cErr || !created.user) die(cErr?.message ?? "no user");
  const uid = created.user.id;
  await admin.from("accounts").update({ name: "Probe Member", is_member: true }).eq("id", uid);

  const { data: listing, error: lErr } = await admin
    .from("listings")
    .insert({
      author_id: uid,
      type: "furniture",
      title: "Policy probe listing",
      description: "probe",
      price_cents: 100,
      details: {},
      images: [],
      status: "published",
    })
    .select("id")
    .single<{ id: string }>();
  if (lErr || !listing) die(lErr?.message ?? "no listing");

  const me = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: sErr } = await me.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (sErr) die(sErr.message);

  async function attempt(label: string, fn: () => PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await fn();
    console.log(`${label}: ${error ? `BLOCKED — ${error.message}` : "OK"}`);
    // restore status to published for the next attempt, in case it succeeded
    await admin.from("listings").update({ status: "published" }).eq("id", listing!.id);
  }

  try {
    await attempt("update title only            ", () =>
      me.from("listings").update({ title: "Policy probe listing 2" }).eq("id", listing.id));
    await attempt("update status -> archived    ", () =>
      me.from("listings").update({ status: "archived" }).eq("id", listing.id));
    await attempt("update status -> draft       ", () =>
      me.from("listings").update({ status: "draft" }).eq("id", listing.id));
    await attempt("update status -> published   ", () =>
      me.from("listings").update({ status: "published" }).eq("id", listing.id));
    await attempt("update title + status=archived", () =>
      me.from("listings").update({ title: "x", status: "archived" }).eq("id", listing.id));

    // DELETE probe (we never hard-delete in product code; this is diagnostic).
    const { error: dErr, count } = await me
      .from("listings")
      .delete({ count: "exact" })
      .eq("id", listing.id);
    console.log(`delete own row               : ${dErr ? `BLOCKED — ${dErr.message}` : `OK (count=${count})`}`);
  } finally {
    await purge(admin);
    console.log("cleanup done (synthetic probe user removed)");
  }
}

main().catch((e: unknown) => die(e instanceof Error ? e.message : String(e)));
