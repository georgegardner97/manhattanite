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
// THE SECOND RULE IT HOLDS, ADDED 2026-08-26: a logged-out visitor sees no
// member name and no sponsor name, anywhere. That is a founder decision, it is
// enforced in application code (cardMeta in lib/cl/listings-read.ts), and it is
// invisible to the RLS audit for exactly the same reason the teaser cap is —
// the database is entitled to return those names and does. So every
// guest-reachable route is fetched here and its BODY is searched for the real
// names in the database. Without this, the next screen someone adds re-opens
// the hole and nothing fails.
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
  guestReachable,
  memberNames,
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

  // The marker is the status code Next encodes beside the fallback, not the
  // words "not-found". THIS COST TWO FALSE FAILURES ON THE FIRST PRODUCTION
  // RUN, 2026-08-27: the audit was written against `npm run dev`, whose bundle
  // happens to carry the hyphenated module path, and a production build hashes
  // it away — the payload there spells the slot `notFound` and the outcome
  // `NEXT_HTTP_ERROR_FALLBACK;404`. Both builds emit the latter, so match that
  // and nothing else. The `;404` matters: a fallback is also how other HTTP
  // errors travel, and "some error happened" is not the assertion.
  const notFound =
    res.status === 404 || /NEXT_HTTP_ERROR_FALLBACK;404\b/.test(body);

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

// The names as a reader would see them. React escapes apostrophes and
// ampersands into entities on the way out, and the RSC payload carries its own
// copy of every string — both are searched, because both are "the page".
function decodeEntities(body: string): string {
  return body
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** What a person actually reads: script and style contents dropped, tags
 *  replaced by a space so neighbouring text can't be glued into a false match,
 *  entities decoded, whitespace collapsed. */
function visibleText(body: string): string {
  return decodeEntities(
    body
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
}

/**
 * Fetch a route AS A GUEST and fail if a member is named in what comes back.
 *
 * TWO CHANNELS, AND THE REASON IS A MEMBER CALLED MAX. Matching every name
 * against the raw document is the strictest thing to do and it fails on its
 * first run — the price filter's placeholder is "Max", and the seed network has
 * a member of that name. Chrome and people share short words, so the check is
 * split by what a collision is plausible in:
 *
 *   VISIBLE TEXT — every name, including single first names. This is where a
 *   leak actually shows up: a byline, a heading, a sponsor line. Tags are
 *   stripped, so a placeholder or an aria-label cannot trip it.
 *
 *   THE WHOLE RESPONSE, RSC payload included — full names only ("George
 *   Gardner"), which no interface label is going to collide with. This is the
 *   channel that catches a name serialized into a Client Component's props but
 *   never rendered: invisible on screen, one View Source away.
 *
 * What that trades: a single first name hidden in an attribute or a client prop
 * and never displayed would pass. Worth knowing, and worth less than a check
 * that cries wolf on "max-width" every run — a trust check nobody trusts is
 * already broken.
 *
 * Case-sensitive and word-bounded throughout, so "Max" never matches `max-w-`.
 */
async function checkNoNames(
  label: string,
  url: string,
  names: string[]
): Promise<void> {
  const res = await fetch(`${BASE}${url}`, { redirect: "manual", headers: {} });
  const raw = await res.text();
  const text = visibleText(raw);
  const decodedRaw = decodeEntities(raw);

  const hit = (haystack: string, name: string) =>
    new RegExp(`\\b${escapeRegExp(name)}\\b`).test(haystack);

  const found = [
    ...names.filter((name) => hit(text, name)).map((n) => `${n} (on screen)`),
    ...names
      .filter((name) => /\s/.test(name) && hit(decodedRaw, name))
      .map((n) => `${n} (in the payload)`),
  ];

  const ok = found.length === 0;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "✓" : "✗ NAME LEAK"} [guest] ${url} — ${
      ok ? "no member name in the response" : `found ${[...new Set(found)].join(", ")}`
    }`
  );
}

/**
 * IS THIS CONTROL NESTED INSIDE A <form>?
 *
 * Added 2026-08-27, for a bug that had been live since the Classifieds merge:
 * "Take this listing down" → "Yes, take it down" saved the edit and never
 * archived anything. ClRemoveListing brings its own <form> and was rendered as
 * the last CHILD of the post form's <form>. A <form> inside a <form> is invalid
 * HTML, the browser drops the inner one, and the submit button re-associates
 * with the outer form — so the button posted updateListing.
 *
 * WHY THE ASSERTION IS HERE AND NOT IN test-edit-archive.ts. That harness drives
 * archiveListing straight against the database and passed the whole time the
 * button was dead: it tested the action beneath the control, which was never the
 * broken half. This bug only exists in RENDERED MARKUP, so it can only be caught
 * by fetching the real page as the real principal — which is what this file
 * already does.
 *
 * BOTH FILES CARRIED A COMMENT SAYING THE COMPONENT MUST BE A SIBLING. Both
 * comments were right and the code did the opposite for a fortnight. A comment
 * is documentation, not enforcement. This is the enforcement.
 *
 * The check is structural, not cosmetic: count unclosed <form> tags between the
 * top of the document and the control. Zero means the control is a sibling; one
 * or more means it is nested and the button is wired to the wrong action. Script
 * blocks are stripped first so the RSC flight payload — which carries the same
 * strings as JSON — cannot answer for the markup.
 */
async function checkNotInForm(
  label: string,
  url: string,
  cookie: string,
  marker: string
): Promise<void> {
  const res = await fetch(`${BASE}${url}`, {
    redirect: "manual",
    headers: { cookie },
  });
  const markup = (await res.text()).replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  const at = markup.indexOf(marker);
  if (at === -1) {
    fails++;
    console.log(
      `  ✗ NESTED FORM [${label}] ${url} — "${marker}" is not on the page at all`
    );
    return;
  }

  const before = markup.slice(0, at);
  const depth =
    (before.match(/<form\b/gi) ?? []).length -
    (before.match(/<\/form>/gi) ?? []).length;

  const ok = depth === 0;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "✓" : "✗ NESTED FORM"} [${label}] ${url} — "${marker}" ${
      ok
        ? "is outside every <form> (its own form survives)"
        : `is ${depth} <form> deep, so its submit posts the OUTER form`
    }`
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

  console.log("\n── GUEST: NOBODY IS NAMED ──");
  const names = await memberNames();
  const reachable = await guestReachable();
  console.log(`  ${names.length} real names to look for, longest first`);

  // Every route a logged-out visitor can actually open. The listing and the
  // member id are taken from the live rows, not invented: the newest published
  // listing is inside the teaser by definition, so it is the one a guest can
  // read — and its author is the member page that must answer with the wall.
  await checkNoNames("landing", "/", names);
  await checkNoNames("browse", "/listings", names);
  await checkNoNames("browse filtered", "/listings?type=apartment", names);
  await checkNoNames("saved", "/saved", names);
  if (reachable.searchTerm) {
    // /search retired into Browse on 2026-08-27 — the box is on /listings now
    // and the route is a 308 to here. The assertion is unchanged in substance:
    // a guest's SEARCH results must name nobody, exactly like a guest's browse.
    await checkNoNames(
      "browse searched",
      `/listings?q=${encodeURIComponent(reachable.searchTerm)}`,
      names
    );
  }
  if (reachable.listingId) {
    await checkNoNames("listing detail", `/listings/${reachable.listingId}`, names);
  }
  if (reachable.memberId) {
    // The member page is now the wall for a guest, so this asserts two things at
    // once: no name, and — below — that it is the wall they are looking at.
    await checkNoNames("member profile", `/members/${reachable.memberId}`, names);
    await check("guest", `/members/${reachable.memberId}`, null, {
      status: 200,
      contains: "Members only",
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

  // The other half of the rule, and the reason it is asserted at all: hiding
  // names from guests must not quietly turn into hiding them from everybody.
  if (reachable.namedMemberId && reachable.namedMemberName) {
    await check("m", `/members/${reachable.namedMemberId}`, M, {
      status: 200,
      contains: reachable.namedMemberName,
    });
  }

  // THE ADMIN SURFACE HAD NO GATE ASSERTIONS AT ALL UNTIL SLICE 3B. Every
  // /admin route is guarded by requireAdmin (no session → /login, signed in but
  // not an admin → notFound, because a 404 leaks less than a redirect that
  // confirms there is something here), and RLS guards the tables underneath.
  // Neither was ever attacked over HTTP as the wrong principal.
  //
  // That matters more now than it did with three read-only screens: the console
  // has two WRITE paths (0028), and /admin/listings puts every listing at every
  // status on one page — the pending and archived rows a member must never see.
  // A 404 that still ships the data in the body is not a gate.
  console.log("\n── ADMIN SURFACE: 404 FOR EVERYONE ELSE ──");
  const ADMIN_ROUTES = [
    "/admin",
    "/admin/listings",
    `/admin/listings/${published}/edit`,
    "/admin/moderation",
    "/admin/applications",
    "/admin/members",
  ];
  for (const route of ADMIN_ROUTES) {
    // A guest is sent to sign in — there is nothing to hide from someone with
    // no session, and bouncing them is friendlier than a 404.
    await check("guest", route, null, { redirect: "/login" });
    // A member and a Tier-1 account get the not-found shell, and crucially none
    // of the console's own furniture: no heading, no verbs, no rows.
    for (const [label, cookie] of [["m", M], ["t1", T]] as const) {
      await check(label, route, cookie, {
        status: 404,
        notContains: "All listings",
      });
      await check(label, route, cookie, {
        status: 404,
        notContains: "Take down",
      });
    }
  }
  // The dashboard leaks a different thing — the counts — so it is asserted on
  // its own heading rather than the directory's.
  await check("m", "/admin", M, {
    status: 404,
    notContains: "The state of the network",
  });

  console.log("\n── MEMBER: THE TAKEDOWN BUTTON IS ITS OWN FORM ──");
  // Published and pending both, because the two render different copy from the
  // same component and only one of them was ever looked at.
  await checkNotInForm("m", `/listings/${published}/edit`, M, "Take this listing down");
  await checkNotInForm("m", `/listings/${pending}/edit`, M, "Take this listing down");

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
