// Route-gate audit — the trust layer that lives ABOVE the database.
//
//   npm run dev            # in another terminal
//   npm run audit:gates
//
// WHY THIS EXISTS, AND WHY IT IS NOT audit-rls.ts. On 2026-08-18 the member
// profile page shipped a real trust hole: it ran its own listings query and
// never applied the six-row guest teaser cap, so a logged-out visitor could be
// shown listings whose own detail page answers with the members-only wall. The
// RLS audit passed 59/59 BEFORE AND AFTER that hole existed — because the hole
// was in application code, and audit-rls.ts attacks the database.
//
// So this attacks the ROUTES. Every gate is asserted where it actually runs:
// over HTTP, as each principal, reading what the page returns. The two audits
// are complements, and neither substitutes for the other.
//
// NEXT 16 DOES NOT ALWAYS ANSWER redirect()/notFound() WITH AN HTTP STATUS. A
// dynamic Server Component that has begun streaming encodes the outcome in the
// RSC payload and the document itself is 200. Asserting on res.status alone
// reports every one of those gates as a failure, which is the worst possible
// error for a trust check to make: it trains you to ignore the output. Both
// channels are read below.

import {
  up,
  down,
  gateIds,
  sessionCookie,
  type GateIds,
} from "./screen-fixtures";

const BASE = process.env.APP_ORIGIN ?? "http://localhost:3000";
const NONEXISTENT = "00000000-0000-4000-8000-000000000000";

type Expect = {
  redirect?: string;
  status?: number;
  contains?: string;
  notContains?: string;
};

let fails = 0;

async function hit(url: string, cookie: string | null) {
  const res = await fetch(`${BASE}${url}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const httpLocation = res.headers.get("location");
  const body = httpLocation ? "" : await res.text();

  // e.g. NEXT_REDIRECT;replace;/login;307;
  const payload = body.match(/NEXT_REDIRECT;[a-z]+;([^;\\"]+);/);
  const location = httpLocation ?? (payload ? payload[1] : null);

  const notFound =
    res.status === 404 ||
    (body.includes("NEXT_HTTP_ERROR_FALLBACK") && body.includes("not-found"));

  return { status: res.status, location, notFound, body };
}

async function check(
  label: string,
  url: string,
  cookie: string | null,
  expect: Expect
): Promise<void> {
  const r = await hit(url, cookie);

  let ok: boolean;
  if (expect.redirect) {
    ok = Boolean(r.location) && new URL(r.location!, BASE).pathname === expect.redirect;
  } else if (expect.status === 404) {
    ok = r.notFound;
  } else if (expect.status) {
    ok = r.status === expect.status && !r.notFound && !r.location;
  } else {
    ok = false;
  }
  if (ok && expect.contains) ok = r.body.includes(expect.contains);
  if (ok && expect.notContains) ok = !r.body.includes(expect.notContains);

  if (!ok) fails++;
  const got = r.location
    ? `redirect → ${new URL(r.location, BASE).pathname}`
    : r.notFound
      ? "not found"
      : String(r.status);
  const want = expect.redirect
    ? `redirect → ${expect.redirect}`
    : `${expect.status}${expect.contains ? ` +"${expect.contains.slice(0, 34)}"` : ""}${
        expect.notContains ? ` −"${expect.notContains.slice(0, 26)}"` : ""
      }`;
  console.log(
    `  ${ok ? "✓" : "✗ UNEXPECTED"} [${label}] ${url} — want ${want}, got ${got}`
  );
}

async function main() {
  console.log("\n── FIXTURES ──");
  await up();
  const ids: GateIds = await gateIds();
  const member = await sessionCookie("member");
  const tier1 = await sessionCookie("tier1");
  const M = `${member.name}=${member.value}`;
  const T = `${tier1.name}=${tier1.value}`;
  console.log("  fixtures up, sessions minted");

  const { published, pending, otherPublished, otherUnpublished } = ids;
  if (!published || !pending) throw new Error("fixture listings missing");

  console.log("\n── GUEST ──");
  await check("guest", "/listings/mine", null, { redirect: "/login" });
  await check("guest", "/listings/new", null, { redirect: "/login" });
  await check("guest", `/listings/${published}/edit`, null, { redirect: "/login" });
  await check("guest", `/listings/${published}/contact`, null, { redirect: "/login" });
  await check("guest", "/profile", null, { redirect: "/login" });
  await check("guest", "/profile/edit", null, { redirect: "/profile" });

  if (otherUnpublished) {
    // A guest on a listing outside the teaser gets the WALL, not a 404 — Slice
    // 1's deliberate change from the editorial redirect("/signup"). The
    // permission outcome is identical; what is asserted here is that no field of
    // the listing reaches the page, and that both doors stay INSIDE the design
    // system, which is the seam Slice 2 closed.
    await check("guest", `/listings/${otherUnpublished}`, null, {
      status: 200,
      contains: "Members only",
    });
    await check("guest", `/listings/${otherUnpublished}`, null, {
      status: 200,
      contains: 'href="/apply"',
    });
  }

  console.log("\n── TIER 1 (account, not a member) ──");
  await check("t1", "/listings/new", T, { status: 200, contains: "Members post" });
  await check("t1", "/listings/mine", T, { status: 200, contains: "Members post" });
  await check("t1", `/listings/${published}/edit`, T, {
    status: 200,
    contains: "Members only",
  });
  await check("t1", `/listings/${published}/contact`, T, {
    status: 200,
    // Verbatim voice-and-copy.md gate, and NO compose box behind it.
    contains: "you need a member account",
    notContains: "Introduce yourself",
  });
  await check("t1", "/apply", T, { status: 200, contains: "Request access" });

  console.log("\n── MEMBER ──");
  await check("m", "/listings/mine", M, { status: 200, contains: "What you" });
  await check("m", "/listings/new", M, { status: 200, contains: "Category" });
  await check("m", `/listings/${published}/edit`, M, {
    status: 200,
    contains: "Edit your listing",
  });
  await check("m", `/listings/${pending}/edit`, M, {
    status: 200,
    contains: "Edit your listing",
  });
  await check("m", `/listings/${published}/contact`, M, {
    status: 200,
    contains: "Introduce yourself",
  });

  console.log("\n── MEMBER, SOMEONE ELSE'S LISTING ──");
  if (otherPublished) {
    // Readable anyway, so the friendlier landing is the listing itself.
    await check("m", `/listings/${otherPublished}/edit`, M, {
      redirect: `/listings/${otherPublished}`,
    });
  }
  if (otherUnpublished) {
    // THE ONE THAT MATTERS: someone else's unpublished id and an id that never
    // existed must be indistinguishable, and neither may leak a field.
    await check("m", `/listings/${otherUnpublished}/edit`, M, {
      status: 404,
      notContains: "Edit your listing",
    });
  }
  await check("m", `/listings/${NONEXISTENT}/edit`, M, {
    status: 404,
    notContains: "Edit your listing",
  });

  console.log("\n── CLEANUP (scoped to +slice2) ──");
  await down();

  console.log("\n════════════════════════════════════════════");
  console.log(`Gate failures: ${fails}`);
  console.log("════════════════════════════════════════════");
  if (fails > 0) process.exit(1);
  console.log("RESULT: ✓ every gate held.\n");
}

main().catch(async (e) => {
  console.error(e);
  // Never leave fixtures behind on a crash.
  try {
    await down();
  } catch {
    /* best effort */
  }
  process.exit(1);
});
