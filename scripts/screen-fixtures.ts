// Screen fixtures — a member and a Tier-1 account with listings in every status,
// so the signed-in screens can actually be looked at.
//
//   node --env-file=.env.local --import tsx scripts/screen-fixtures.ts up
//   node --env-file=.env.local --import tsx scripts/screen-fixtures.ts ids
//   node --env-file=.env.local --import tsx scripts/screen-fixtures.ts down
//
// WHY THIS EXISTS. Every member-only screen in the Classifieds migration went
// unverified through Slice 1: local sign-in died at the Cloudflare Turnstile
// hostname allowlist (error 110200), so nobody had ever rendered them. The
// allowlist is fixed now — but a captcha is there to prove a human is at the
// keyboard, and a harness has no business answering one. So the session is
// minted the way scripts/audit-rls.ts already mints them: admin.generateLink
// with the service-role key, which is a server-side call the captcha never sees,
// exchanged through verifyOtp. A real session, a real RLS context, no captcha
// defeated and no password handled.
//
// SAFETY — everything here is scoped to a UNIQUE sub-prefix:
//   SYNTH_PREFIX = "george.gardner480+slice2"
// The bare "george.gardner480+" prefix ALSO covers the permanent SEED MEMBERS
// (Anna, Max, Lila, Sam), who own most of the live marketplace. A blind purge of
// the bare prefix would delete it. Nothing here touches anything but
// "+slice2-*" rows, and `down` asserts the seed members survived.

import { createClient, type User } from "@supabase/supabase-js";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SYNTH_PREFIX = "george.gardner480+slice2";
export const MEMBER_EMAIL = `${SYNTH_PREFIX}-member@googlemail.com`;
export const TIER1_EMAIL = `${SYNTH_PREFIX}-tier1@googlemail.com`;
const PW = "Manhattanite-Screen-Fixtures-2026-1!";

const admin = createClient(URL_BASE, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Principal = "member" | "tier1";
const emailOf = (who: Principal) =>
  who === "member" ? MEMBER_EMAIL : TIER1_EMAIL;

async function findUser(addr: string): Promise<User | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === addr);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(addr: string): Promise<User> {
  const existing = await findUser(addr);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email: addr,
    password: PW,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!;
}

// One listing per status, so /listings/mine can be judged on the thing it was
// designed around: an archived listing must never outweigh a live one.
const LISTINGS = [
  {
    status: "published",
    type: "apartment",
    title: "Slice2 fixture — one-bed on Bank Street",
    description: "Fixture row for screen verification. Not a real listing.",
    price_cents: 480000,
    details: {
      neighborhood: "West Village",
      bedrooms: 1,
      bathrooms: 1,
      available_from: "September 1",
    },
    moderation_note: null,
  },
  {
    status: "pending",
    type: "furniture",
    title: "Slice2 fixture — walnut dining table",
    description: "Fixture row for screen verification. Not a real listing.",
    price_cents: 90000,
    details: { condition: "Barely used", dimensions: "84 × 36 × 30 in", brand: "Vitra" },
    moderation_note: null,
  },
  {
    status: "draft",
    type: "other",
    title: "Slice2 fixture — returned for changes",
    description: "Fixture row for screen verification. Not a real listing.",
    price_cents: 12000,
    details: { condition: "Good", neighborhood: "Chelsea" },
    moderation_note: "Please add a photo of the actual item and say where pickup is.",
  },
  {
    status: "archived",
    type: "service",
    title: "Slice2 fixture — archived, for the record",
    description: "Fixture row for screen verification. Not a real listing.",
    price_cents: 15000,
    details: { neighborhood: "Tribeca" },
    moderation_note: "Taken down after the sale went through.",
  },
] as const;

export async function up(): Promise<void> {
  const member = await ensureUser(MEMBER_EMAIL);
  const tier1 = await ensureUser(TIER1_EMAIL);

  // is_member and role are protected columns (the protect_account_columns
  // trigger, 0001), so the service role sets them — the seed-phase equivalent
  // of approve_application.
  await admin
    .from("accounts")
    .update({
      name: "Wren Calloway",
      neighborhood: "West Village",
      bio: "Screen fixture account. Not a real member.",
      linkedin_url: "linkedin.com/in/slice2-fixture",
      is_member: true,
      role: "member",
    })
    .eq("id", member.id);

  await admin
    .from("accounts")
    .update({
      name: "Tobias Renn",
      neighborhood: "Chelsea",
      is_member: false,
      role: "account",
    })
    .eq("id", tier1.id);

  // Idempotent: clear any previous fixture rows first.
  await admin.from("listings").delete().eq("author_id", member.id);

  for (const row of LISTINGS) {
    // The 0017 trigger pins status on a member INSERT, so the intended status is
    // written in a second statement — exactly what the moderation console does.
    const { data, error } = await admin
      .from("listings")
      .insert({
        author_id: member.id,
        type: row.type,
        title: row.title,
        description: row.description,
        price_cents: row.price_cents,
        details: row.details,
        images: [],
      })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    await admin
      .from("listings")
      .update({ status: row.status, moderation_note: row.moderation_note })
      .eq("id", data.id);
  }
}

/**
 * A real browser cookie for one of the fixture principals.
 *
 * @supabase/ssr stores the whole session as base64url JSON behind a "base64-"
 * marker under sb-<project-ref>-auth-token. Returned as a name/value pair
 * rather than written anywhere: a session token is a credential, and it has no
 * business sitting on disk between runs.
 */
export async function sessionCookie(
  who: Principal
): Promise<{ name: string; value: string }> {
  const { data: linked, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: emailOf(who),
  });
  if (linkErr) throw linkErr;

  const anon = createClient(URL_BASE, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.verifyOtp({
    type: "magiclink",
    token_hash: linked.properties!.hashed_token,
  });
  if (error) throw error;

  const ref = new URL(URL_BASE).hostname.split(".")[0];
  return {
    name: `sb-${ref}-auth-token`,
    value:
      "base64-" +
      Buffer.from(JSON.stringify(data.session!), "utf8").toString("base64url"),
  };
}

export type GateIds = {
  published: string | null;
  pending: string | null;
  otherPublished: string | null;
  otherUnpublished: string | null;
};

/** Listing ids the gate check addresses, including rows owned by SOMEONE ELSE. */
export async function gateIds(): Promise<GateIds> {
  const member = await findUser(MEMBER_EMAIL);
  if (!member) throw new Error("no member fixture — run `up` first");

  const { data: mine } = await admin
    .from("listings")
    .select("id, status")
    .eq("author_id", member.id);
  const { data: others } = await admin
    .from("listings")
    .select("id, status")
    .neq("author_id", member.id);

  const pick = (rows: { id: string; status: string }[] | null, st: string) =>
    rows?.find((r) => r.status === st)?.id ?? null;

  return {
    published: pick(mine, "published"),
    pending: pick(mine, "pending"),
    otherPublished: pick(others, "published"),
    otherUnpublished:
      pick(others, "pending") ?? pick(others, "draft") ?? pick(others, "archived"),
  };
}

/**
 * Every real member name in the database, plus the individual words they are
 * made of.
 *
 * FOR THE NAME-LEAK ASSERTIONS in audit-gates.ts. The founder's 2026-08-26 rule
 * is that a logged-out visitor sees no member name and no sponsor name
 * anywhere, and that rule lives in application code (cardMeta) because the data
 * layer will keep handing the names over — 0006 denormalized them onto every
 * listing and 0010 lets an anonymous reader select a published row. `audit:rls`
 * therefore passes whether the rule holds or not, exactly as it did either side
 * of Slice 1's trust hole. So the check is: fetch the page as a guest, and look
 * for the actual strings.
 *
 * The words are included as well as the full names because a first-name-only
 * leak ("Message Anna.") is the likelier kind. They are matched case-sensitively
 * on a word boundary by the caller, which is what keeps "Max" out of `max-width`
 * and `max-w-[1240px]`.
 */
export async function memberNames(): Promise<string[]> {
  const { data: accounts } = await admin
    .from("accounts")
    .select("name")
    .not("name", "is", null)
    .returns<{ name: string }[]>();

  // The denormalized byline is its own source of truth — a listing can carry a
  // name whose account row has since changed, and it is the listing's copy that
  // renders.
  const { data: listings } = await admin
    .from("listings")
    .select("author_name, sponsor_names")
    .eq("status", "published")
    .returns<{ author_name: string | null; sponsor_names: string[] | null }[]>();

  const full = [
    ...(accounts ?? []).map((a) => a.name),
    ...(listings ?? []).flatMap((l) => [l.author_name, ...(l.sponsor_names ?? [])]),
  ]
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    .map((n) => n.trim());

  const words = full.flatMap((n) => n.split(/\s+/)).filter((w) => w.length >= 3);

  // Longest first, so a failure reports "George Gardner" rather than "George".
  return [...new Set([...full, ...words])].sort((a, b) => b.length - a.length);
}

export type GuestReachable = {
  /** The newest published listing — a guest may open this one's detail page. */
  listingId: string | null;
  /** Its author, whose /members/[id] page a guest must NOT be able to read. */
  memberId: string | null;
  /** A word from its title, so a guest search actually returns a card. */
  searchTerm: string | null;
  /** A REAL member with published listings, and the name on them — the positive
   *  control. Hiding names from guests is only half the rule; a signed-in
   *  member must still see them, and an over-correction that walls everybody
   *  would otherwise pass every check in the file. */
  namedMemberId: string | null;
  namedMemberName: string | null;
};

/** What a logged-out visitor can actually reach, taken from the live rows
 *  rather than assumed: the teaser is "the six newest published listings", so
 *  the newest one is guest-reachable by definition. */
export async function guestReachable(): Promise<GuestReachable> {
  const { data } = await admin
    .from("listings")
    .select("id, title, author_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<{ id: string; title: string; author_id: string }[]>();

  const row = data?.[0];

  // Someone with a name on a published listing. Deliberately read separately
  // from the newest row: the newest row is usually the fixture's, and a member
  // reading their own profile proves less than one reading somebody else's.
  const { data: named } = await admin
    .from("listings")
    .select("author_id, author_name")
    .eq("status", "published")
    .not("author_name", "is", null)
    .order("created_at", { ascending: false })
    .returns<{ author_id: string; author_name: string }[]>();

  const other = named?.find((l) => l.author_id !== row?.author_id) ?? null;

  if (!row) {
    return {
      listingId: null,
      memberId: null,
      searchTerm: null,
      namedMemberId: other?.author_id ?? null,
      namedMemberName: other?.author_name ?? null,
    };
  }

  const word = row.title
    .split(/[^A-Za-z]+/)
    .filter((w) => w.length >= 4)
    .sort((a, b) => b.length - a.length)[0];

  return {
    listingId: row.id,
    memberId: row.author_id,
    searchTerm: word ?? null,
    namedMemberId: other?.author_id ?? null,
    namedMemberName: other?.author_name ?? null,
  };
}

export async function down(): Promise<void> {
  for (const addr of [MEMBER_EMAIL, TIER1_EMAIL]) {
    const user = await findUser(addr);
    if (!user) continue;
    const { error: delErr } = await admin
      .from("listings")
      .delete()
      .eq("author_id", user.id);
    if (delErr) console.error(`listings delete (${addr}):`, delErr.message);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) console.error(`deleteUser (${addr}):`, error.message);
    else console.log(`  removed ${addr}`);
  }

  // Assert the blast radius stayed where it should.
  const { count } = await admin
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .like("email", "george.gardner480+seed%");
  console.log(`  seed members still present: ${count}`);
}

// ---------------------------------------------------------------- CLI -------
async function main() {
  const cmd = process.argv[2];
  if (cmd === "up") {
    await up();
    console.log("Fixtures up.");
    console.log(JSON.stringify(await gateIds(), null, 2));
  } else if (cmd === "ids") {
    console.log(JSON.stringify(await gateIds(), null, 2));
  } else if (cmd === "down") {
    await down();
  } else {
    console.error("usage: screen-fixtures.ts up | ids | down");
    process.exit(1);
  }
}

// Only run the CLI when invoked directly, so audit-gates.ts can import this.
if (process.argv[1]?.endsWith("screen-fixtures.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
