// Example-listings prod seeder — 10 apartments + 7 furniture, with photos.
//
//   npm run seed:examples              # seed (idempotent — safe to re-run)
//   npm run seed:examples -- --unseed  # remove everything this script created
//
// Runs against PROD Supabase (service-role key from .env.local). Content comes
// from the two seed docs in WORK AREAS/Product/mvp-build-project/outputs/:
//   - Manhattanite_Seed-Listings_v1.md (apartments A1–A12; 10 used here)
//   - Manhattanite_Seed-Listings-Furniture-Matched_v1.md (FM1–FM7, written to
//     match the photos in seed-images/furniture/)
// Photos are pre-resized web-size JPEGs in seed-images/ (gitignored).
//
// What it does:
//   1. Ensures 4 example members exist — Anna, Max, Lila, Sam — on Gmail
//      plus-aliases. Created via the REAL approval path: auth user → accounts
//      name/neighborhood → pending application (occupation/about live on
//      applications, not accounts) → approve_application(founder) — which
//      flips is_member and writes the primary sponsorship in one transaction.
//   2. Uploads each listing's photos to the listing-images bucket at
//      {author_id}/{uuid}.jpg (service role bypasses the bucket RLS).
//   3. Inserts the 17 rows: status 'published' (service role passes the 0017
//      pre-moderation trigger — auth.uid() is null), is_example = true. The
//      0012 BEFORE INSERT trigger fills author_name + sponsor_names, so member
//      listings render "Listed by Anna · vouched for by George Gardner".
//
// Idempotency: members are matched by email, listings by (author, title,
// is_example) — re-running skips what already exists. Caveat: if a run dies
// between image upload and row insert, the next run re-uploads fresh uuids and
// the earlier objects are orphaned until an unseed sweep.
//
// Unseed removes: every is_example listing's storage objects (exact paths from
// the rows — never a whole folder, so the founder's real photos are safe),
// every is_example listing row (including founder-authored ones), and the 4
// seed auth users (cascade clears their accounts/applications/sponsorships).
// The founder's real account and listings are untouched — asserted both ways.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const FOUNDER_EMAIL = "info@manhattanite.com";
const BUCKET = "listing-images";
const IMAGE_ROOT = path.join(process.cwd(), "seed-images");

// Same plus-alias convention as scripts/test-multi-sponsor.ts, distinct prefix
// so seed members and test members can never collide.
const SEED_PREFIX = "george.gardner480+seed";
const seedEmail = (label: string) => `${SEED_PREFIX}-${label}@googlemail.com`;
// They never log in; the password just has to satisfy auth requirements.
const SEED_PASSWORD = `Seed-${randomUUID()}`;

// ----- the 4 example members ------------------------------------------------
type MemberSpec = {
  label: string; // email alias + LISTINGS author key
  name: string; // members are first-name only (seed doc convention)
  neighborhood: string;
  occupation: string; // lives on the application row
  about: string;
};

const MEMBERS: MemberSpec[] = [
  {
    label: "anna",
    name: "Anna",
    neighborhood: "West Village",
    occupation: "Gallery director",
    about: "Example member created for seed listings.",
  },
  {
    label: "max",
    name: "Max",
    neighborhood: "Tribeca",
    occupation: "Architect",
    about: "Example member created for seed listings.",
  },
  {
    label: "lila",
    name: "Lila",
    neighborhood: "Upper East Side",
    occupation: "Magazine editor",
    about: "Example member created for seed listings.",
  },
  {
    label: "sam",
    name: "Sam",
    neighborhood: "Harlem",
    occupation: "Photographer",
    about: "Example member created for seed listings.",
  },
];

// ----- the 17 listings --------------------------------------------------------
// author: a member label, or "george" for the founder.
// images: paths relative to seed-images/, in display order (images[0] = cover).
type ListingSpec = {
  key: string; // doc reference (A1…, FM1…) for logs
  author: string;
  type: "apartment" | "furniture";
  title: string;
  description: string;
  priceCents: number;
  details: Record<string, unknown>;
  images: string[];
};

const LISTINGS: ListingSpec[] = [
  // ----- apartments (10 of A1–A12; A7 + A10 left out) -----
  {
    key: "A1",
    author: "anna",
    type: "apartment",
    title: "Two-bedroom · West Village",
    description:
      "Floor-through in a brownstone on Bank Street. Original wood floors, two working fireplaces, exposed brick in the kitchen. South-facing rear bedroom. Available July 1, twelve-month lease, no broker fee.",
    priceCents: 540000,
    details: {
      neighborhood: "West Village",
      beds: 2,
      available_from: "July 1",
      tags: ["brownstone", "no fee", "prewar", "fireplace"],
    },
    images: [
      "apartments/chalo-gallardo-l7fgkpJGMBQ-unsplash.jpg", // corner building, cover
      "apartments/jason-briscoe-AQl-J19ocWE-unsplash.jpg", // kitchen, 2nd
    ],
  },
  {
    key: "A2",
    author: "george",
    type: "apartment",
    title: "Studio · Soho",
    description:
      "Cast-iron building on Greene. High ceilings, two big windows, a galley kitchen, a sleeping nook that fits a queen. Available August 15. Doorman, elevator. Pet-friendly under 25 lb.",
    priceCents: 380000,
    details: {
      neighborhood: "Soho",
      beds: "Studio",
      available_from: "August 15",
      tags: ["loft", "doorman", "pet-friendly"],
    },
    images: ["apartments/christian-lendl-rf7gT-R9zaE-unsplash.jpg"],
  },
  {
    key: "A3",
    author: "lila",
    type: "apartment",
    title: "One-bedroom · Upper East Side",
    description:
      "Prewar one-bedroom on East 78th, two blocks from the park. Original moldings, dishwasher, separate dining alcove. Sixth floor, elevator, laundry in basement. Available June 15.",
    priceCents: 420000,
    details: {
      neighborhood: "Upper East Side",
      beds: 1,
      available_from: "June 15",
      tags: ["prewar", "near park", "elevator"],
    },
    images: ["apartments/chandler-hilken-5_ULZxXaGyQ-unsplash.jpg"],
  },
  {
    key: "A4",
    author: "sam",
    type: "apartment",
    title: "Bedroom in three-bedroom share · Harlem",
    description:
      "A room in a renovated brownstone on West 121st. Two other tenants, both grad students. Shared kitchen, two bathrooms, small back garden. Available July 1. Looking for someone tidy, employed, and not loud after 11.",
    priceCents: 175000,
    details: {
      neighborhood: "Harlem",
      beds: "1 of 3 (share)",
      available_from: "July 1",
      tags: ["roommate", "brownstone", "Harlem"],
    },
    images: ["apartments/ronny-rondon-mMlpDj0yZn4-unsplash.jpg"],
  },
  {
    key: "A5",
    author: "george",
    type: "apartment",
    title: "Studio · East Village",
    description:
      "Fifth-floor walk-up on East 9th, between First and A. One window, one closet, one new kitchen. The bathtub is in the kitchen. Available immediately. No broker fee.",
    priceCents: 240000,
    details: {
      neighborhood: "East Village",
      beds: "Studio",
      available_from: "Immediately",
      tags: ["walk-up", "no fee", "East Village"],
    },
    images: ["apartments/devin-santiago-6NVQV0p0eC0-unsplash.jpg"],
  },
  {
    key: "A6",
    author: "george",
    type: "apartment",
    title: "Two-bedroom loft · Tribeca",
    description:
      "Eleven hundred square feet on Franklin Street. North-facing windows, polished concrete floors, open kitchen with a Wolf range. Twelve-foot ceilings, washer-dryer in unit. Available September 1.",
    priceCents: 920000,
    details: {
      neighborhood: "Tribeca",
      beds: 2,
      available_from: "September 1",
      tags: ["loft", "doorman", "washer-dryer"],
    },
    images: [
      "apartments/roberto-nickson-rEJxpBskj3Q-unsplash.jpg", // double-height living room, cover
      "apartments/rafael-hoyos-weht-8PKGjZ2GzuQ-unsplash.jpg", // kitchen, 2nd
      "apartments/aranprime-KbytCpI1i5I-unsplash.jpg", // lounge, 3rd
    ],
  },
  {
    key: "A8",
    author: "george",
    type: "apartment",
    title: "Sublet, one-bedroom · Upper West Side",
    description:
      "Three-month sublet, June through August. Prewar one-bedroom on West 84th, half a block from Central Park. Fully furnished. Cat lives there too — happy stays, happy goes home in September.",
    priceCents: 360000,
    details: {
      neighborhood: "Upper West Side",
      beds: 1,
      available_from: "June 1",
      tags: ["sublet", "furnished", "near park", "cat"],
    },
    images: ["apartments/minh-pham-OtXADkUh3-I-unsplash.jpg"],
  },
  {
    key: "A9",
    author: "george",
    type: "apartment",
    title: "One-bedroom · Lower East Side",
    description:
      "Fourth-floor walk-up on Orchard. Tenement-converted, exposed brick, small but laid out well. Tub in the bathroom (not the kitchen). Available June 1, one-year lease.",
    priceCents: 310000,
    details: {
      neighborhood: "Lower East Side",
      beds: 1,
      available_from: "June 1",
      tags: ["walk-up", "LES", "exposed brick"],
    },
    images: ["apartments/patrick-perkins-3wylDrjxH-E-unsplash.jpg"],
  },
  {
    key: "A11",
    author: "max",
    type: "apartment",
    title: "Bedroom in three-bedroom · Hudson Square",
    description:
      "Renovated apartment on Vandam, third floor with elevator. Two roommates (a writer and a producer, both in their thirties). The room is the largest of the three, faces south, fits a queen plus a desk. Available July 1.",
    priceCents: 195000,
    details: {
      neighborhood: "Hudson Square",
      beds: "1 of 3 (share)",
      available_from: "July 1",
      tags: ["roommate", "Hudson Square", "elevator"],
    },
    images: ["apartments/kara-eads-L7EwHkq1B2s-unsplash.jpg"],
  },
  {
    key: "A12",
    author: "anna",
    type: "apartment",
    title: "One-bedroom · Yorkville",
    description:
      "Prewar one-bedroom on East 88th, sixth floor with elevator. Carl Schurz Park view from the bedroom. Renovated kitchen, original tile bathroom. Available August 1.",
    priceCents: 340000,
    details: {
      neighborhood: "Yorkville",
      beds: 1,
      available_from: "August 1",
      tags: ["prewar", "park view", "Yorkville"],
    },
    images: ["apartments/pierre-jeanneret-QL_DdWFUsFc-unsplash.jpg"],
  },

  // ----- furniture (FM1–FM7, matched to seed-images/furniture/) -----
  {
    key: "FM1",
    author: "anna",
    type: "furniture",
    title: "Swivel lounge chair, oak base",
    description:
      "A low lounge chair in oatmeal, on a solid oak swivel base — the kind you actually sink into, not just look at. Light pilling on the seat, photographed honestly. From a Tribeca apartment, owner redecorating. Pickup Tribeca.",
    priceCents: 48000,
    details: {
      category: "lounge chair",
      condition: "good",
      neighborhood: "Tribeca",
      tags: ["lounge chair", "oak", "swivel"],
    },
    images: ["furniture/scopic-ltd-NLlWwR4d3qU-unsplash.jpg"],
  },
  {
    key: "FM2",
    author: "max",
    type: "furniture",
    title: "Terracotta two-seater sofa",
    description:
      // Doc has British "colour"; American spelling is the product convention.
      "A compact two-seater in rust linen with tapered oak legs. Two years old, no pets, no stains — the color reads warmer in person than on a screen. Fits through a standard doorway. Pickup East Village, two people to move.",
    priceCents: 95000,
    details: {
      category: "sofa",
      condition: "excellent",
      neighborhood: "East Village",
      tags: ["sofa", "linen", "two-seater"],
    },
    images: ["furniture/inside-weather-dbH_vy7vICE-unsplash.jpg"],
  },
  {
    key: "FM3",
    author: "lila",
    type: "furniture",
    title: "Mustard accent armchair",
    description:
      "A mid-century-style armchair in mustard with black tapered legs — a warm note for an otherwise quiet room. One small mark on the inside of the arm, otherwise clean. Pickup Chelsea.",
    priceCents: 32000,
    details: {
      category: "armchair",
      condition: "good",
      neighborhood: "Chelsea",
      tags: ["armchair", "mid-century", "mustard"],
    },
    images: ["furniture/kam-idris-_HqHX3LBN18-unsplash.jpg"],
  },
  {
    key: "FM4",
    author: "george",
    type: "furniture",
    title: "Ceramic pineapple table lamp",
    description:
      "A white ceramic table lamp with a natural linen shade — a little wit for a side table or a nightstand. Rewired last year, takes a standard bulb. Pickup Murray Hill.",
    priceCents: 6000,
    details: {
      category: "lighting",
      condition: "good",
      neighborhood: "Murray Hill",
      tags: ["lamp", "ceramic", "table lamp"],
    },
    images: ["furniture/i-m__prakhar-kont-AgU9-qsNc1Y-unsplash.jpg"],
  },
  {
    key: "FM5",
    author: "george",
    type: "furniture",
    title: "Molded shell armchairs, black — pair",
    description:
      "Black molded armchairs on black dowel bases — the Eames silhouette, a good reproduction, not the originals. Solid, comfortable, and they wipe clean. Selling the pair. Pickup Soho.",
    priceCents: 26000,
    details: {
      category: "armchair",
      condition: "good",
      neighborhood: "Soho",
      tags: ["armchair", "Eames-style", "pair"],
    },
    images: ["furniture/andres-jasso-ssbgw3cKdXg-unsplash.jpg"],
  },
  {
    key: "FM6",
    author: "sam",
    type: "furniture",
    title: "Reclaimed-wood coffee table",
    description:
      "Forty-eight inches of reclaimed pine on grey steel hairpin legs. The kind of honest wood that takes a ring or two and looks better for it. Pickup Lower East Side.",
    priceCents: 22000,
    details: {
      category: "coffee table",
      condition: "good",
      neighborhood: "Lower East Side",
      tags: ["coffee table", "reclaimed wood", "hairpin"],
    },
    images: ["furniture/lui-peng-8NxTrV6i4WQ-unsplash.jpg"],
  },
  {
    key: "FM7",
    author: "anna",
    type: "furniture",
    title: "Whitewashed bar stools — pair",
    description:
      "Two solid-wood bar stools, whitewashed, with a thirty-inch seat and a hand-hole to carry them. Sturdy and simple. Selling the pair. Pickup Tribeca.",
    priceCents: 13000,
    details: {
      category: "bar stool",
      condition: "good",
      neighborhood: "Tribeca",
      tags: ["bar stool", "wood", "pair"],
    },
    images: ["furniture/ruslan-bardash-4kTbAMRAHtQ-unsplash.jpg"],
  },
];

// ----- helpers ---------------------------------------------------------------
function die(message: string): never {
  console.error(`\nFATAL: ${message}`);
  process.exit(1);
}

type Account = { id: string; email: string; name: string | null; is_member: boolean };

async function getAccountByEmail(
  admin: SupabaseClient,
  email: string
): Promise<Account | null> {
  const { data, error } = await admin
    .from("accounts")
    .select("id, email, name, is_member")
    .eq("email", email)
    .maybeSingle<Account>();
  if (error) die(`Could not look up account ${email}: ${error.message}`);
  return data;
}

// Create-or-find one example member through the real approval path.
async function ensureMember(
  admin: SupabaseClient,
  spec: MemberSpec,
  founderId: string
): Promise<Account> {
  const email = seedEmail(spec.label);
  let account = await getAccountByEmail(admin, email);

  if (!account) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) die(`Could not create ${email}: ${error?.message}`);
    // The on_auth_user_created trigger has inserted the accounts row.
    account = await getAccountByEmail(admin, email);
    if (!account) die(`accounts row missing after createUser for ${email}`);
    console.log(`  created auth user ${email}`);
  }

  // Name + neighborhood live on accounts. Service role passes the
  // protect_account_columns trigger (auth.uid() is null).
  const { error: updErr } = await admin
    .from("accounts")
    .update({ name: spec.name, neighborhood: spec.neighborhood })
    .eq("id", account.id);
  if (updErr) die(`Could not set profile for ${email}: ${updErr.message}`);

  if (!account.is_member) {
    // Occupation/about live on the application; approval flips is_member and
    // writes the primary sponsorship (founder) in one transaction.
    const { data: app, error: appErr } = await admin
      .from("applications")
      .insert({
        account_id: account.id,
        status: "pending",
        occupation: spec.occupation,
        about: spec.about,
        neighborhood: spec.neighborhood,
      })
      .select("id")
      .single<{ id: string }>();
    if (appErr || !app) die(`Could not create application for ${email}: ${appErr?.message}`);

    const { error: approveErr } = await admin.rpc("approve_application", {
      p_application_id: app.id,
      p_sponsor_id: founderId,
    });
    if (approveErr) die(`approve_application failed for ${email}: ${approveErr.message}`);
    console.log(`  approved ${spec.name} (sponsor: founder)`);
  }

  return { ...account, name: spec.name, is_member: true };
}

async function uploadImage(
  admin: SupabaseClient,
  authorId: string,
  relPath: string
): Promise<string> {
  const file = readFileSync(path.join(IMAGE_ROOT, relPath));
  if (file.byteLength > 5 * 1024 * 1024) {
    die(`${relPath} is over the 5 MB bucket limit — re-run the resize step.`);
  }
  const storagePath = `${authorId}/${randomUUID()}.jpg`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: "image/jpeg", upsert: false });
  if (error) die(`Upload failed for ${relPath}: ${error.message}`);
  return storagePath;
}

// ----- unseed ------------------------------------------------------------------
async function unseed(admin: SupabaseClient): Promise<void> {
  console.log("Unseed: removing example listings, images, and seed members…");

  // 1. Exact storage paths from the example rows — never a whole folder.
  const { data: rows, error } = await admin
    .from("listings")
    .select("id, images")
    .eq("is_example", true)
    .returns<{ id: string; images: { path: string }[] }[]>();
  if (error) die(`Could not read example listings: ${error.message}`);

  const paths = (rows ?? []).flatMap((r) => (r.images ?? []).map((i) => i.path));
  if (paths.length > 0) {
    const { error: rmErr } = await admin.storage.from(BUCKET).remove(paths);
    if (rmErr) die(`Storage cleanup failed: ${rmErr.message}`);
  }
  console.log(`  removed ${paths.length} storage object(s)`);

  // 2. Example listing rows (covers founder-authored examples too).
  const { error: delErr } = await admin.from("listings").delete().eq("is_example", true);
  if (delErr) die(`Could not delete example listings: ${delErr.message}`);
  console.log(`  deleted ${rows?.length ?? 0} example listing(s)`);

  // 3. Seed auth users — cascade clears accounts/applications/sponsorships.
  let removed = 0;
  for (const spec of MEMBERS) {
    const account = await getAccountByEmail(admin, seedEmail(spec.label));
    if (!account) continue;
    const { error: userErr } = await admin.auth.admin.deleteUser(account.id);
    if (userErr) die(`Could not delete seed user ${account.email}: ${userErr.message}`);
    removed++;
  }
  console.log(`  deleted ${removed} seed member(s)`);
}

// ----- main --------------------------------------------------------------------
async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) die("Missing NEXT_PUBLIC_SUPABASE_URL — check .env.local.");
  if (!serviceKey) die("Missing SUPABASE_SERVICE_ROLE_KEY — check .env.local.");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (process.argv.includes("--unseed")) {
    await unseed(admin);
    console.log("Unseed complete.");
    return;
  }

  // Founder lookup + before-snapshot of his REAL listings.
  const founder = await getAccountByEmail(admin, FOUNDER_EMAIL);
  if (!founder) die(`Founder (${FOUNDER_EMAIL}) not found.`);
  if (!founder.is_member) die("Founder is not a member — aborting.");
  console.log(`Founder: ${founder.name} (${founder.id})`);

  const { data: realBefore, error: snapErr } = await admin
    .from("listings")
    .select("id, status, images")
    .eq("author_id", founder.id)
    .eq("is_example", false)
    .order("id");
  if (snapErr) die(`Could not snapshot founder listings: ${snapErr.message}`);
  console.log(`Founder has ${realBefore?.length ?? 0} real listing(s) before seeding.`);

  // 1. Members.
  console.log("\nMembers:");
  const authorByLabel = new Map<string, Account>([["george", founder]]);
  for (const spec of MEMBERS) {
    authorByLabel.set(spec.label, await ensureMember(admin, spec, founder.id));
    console.log(`  ✓ ${spec.name} ready`);
  }

  // 2 + 3. Listings, skipping any that already exist (idempotent re-run).
  const { data: existing, error: existErr } = await admin
    .from("listings")
    .select("title, author_id")
    .eq("is_example", true)
    .returns<{ title: string; author_id: string }[]>();
  if (existErr) die(`Could not read existing examples: ${existErr.message}`);
  const existingKeys = new Set((existing ?? []).map((l) => `${l.author_id}:${l.title}`));

  console.log("\nListings:");
  let inserted = 0;
  let skipped = 0;
  for (const spec of LISTINGS) {
    const author = authorByLabel.get(spec.author);
    if (!author) die(`Unknown author label ${spec.author} (${spec.key})`);

    if (existingKeys.has(`${author.id}:${spec.title}`)) {
      skipped++;
      console.log(`  – ${spec.key} already seeded, skipping`);
      continue;
    }

    const imagePaths: { path: string }[] = [];
    for (const rel of spec.images) {
      imagePaths.push({ path: await uploadImage(admin, author.id, rel) });
    }

    const { error: insErr } = await admin.from("listings").insert({
      author_id: author.id,
      type: spec.type,
      title: spec.title,
      description: spec.description,
      price_cents: spec.priceCents,
      details: spec.details,
      images: imagePaths,
      status: "published",
      is_example: true,
    });
    if (insErr) die(`Insert failed for ${spec.key}: ${insErr.message}`);
    inserted++;
    console.log(`  ✓ ${spec.key} "${spec.title}" — ${spec.images.length} photo(s), by ${author.name}`);
  }

  // 4. Verify.
  console.log("\nVerify:");
  const { data: examples, error: verErr } = await admin
    .from("listings")
    .select("id, type, status, images, author_name, sponsor_names")
    .eq("is_example", true)
    .returns<
      { id: string; type: string; status: string; images: { path: string }[]; author_name: string | null; sponsor_names: string[] }[]
    >();
  if (verErr || !examples) die(`Verify read failed: ${verErr?.message}`);

  const apartments = examples.filter((l) => l.type === "apartment").length;
  const furniture = examples.filter((l) => l.type === "furniture").length;
  const unpublished = examples.filter((l) => l.status !== "published").length;
  const withoutImages = examples.filter((l) => (l.images ?? []).length === 0).length;
  const withoutByline = examples.filter((l) => !l.author_name).length;

  const { data: realAfter } = await admin
    .from("listings")
    .select("id, status, images")
    .eq("author_id", founder.id)
    .eq("is_example", false)
    .order("id");
  const founderUntouched = JSON.stringify(realAfter) === JSON.stringify(realBefore);

  console.log(`  example listings: ${examples.length} (${apartments} apartment / ${furniture} furniture)`);
  console.log(`  inserted ${inserted}, skipped ${skipped}`);
  console.log(`  unpublished: ${unpublished}, without images: ${withoutImages}, without byline: ${withoutByline}`);
  console.log(`  founder's real listings untouched: ${founderUntouched ? "yes" : "NO — INVESTIGATE"}`);

  const ok =
    examples.length === LISTINGS.length &&
    apartments === 10 &&
    furniture === 7 &&
    unpublished === 0 &&
    withoutImages === 0 &&
    withoutByline === 0 &&
    founderUntouched;
  if (!ok) die("Verification failed — see counts above.");
  console.log("\nRESULT: ✓ seed complete and verified.");
}

main().catch((error: unknown) => {
  die(error instanceof Error ? error.message : String(error));
});
