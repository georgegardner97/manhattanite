# Manhattanite — RLS / Trust-Gate Audit v2

**Date:** 2026-08-13 (Week 12 hardening session)
**Scope:** Migrations 0001–0025 — the full surface: `accounts`, `listings`, `applications`, `listing_contacts`, `sponsorships`, `invites`, `sponsorship_requests`, storage buckets `listing-images` + `avatars`.
**Method:** Attacked the **API, not the UI**. Every cell below is a real `supabase-js` call using the anon key or a synthetic user's authenticated JWT, hitting PostgREST + Supabase Storage directly against **prod**. Harness: [`scripts/audit-rls.ts`](../../../../scripts/audit-rls.ts) — 59 cells, self-cleaning.
**Supersedes:** v1 (2026-06-12), which predated migrations 0011–0025 and only structurally diffed `pg_policy`. v2 is behavioral: it proves what the policies *do*, principal by principal.

---

## Verdict

**The trust gate holds at the database layer. 59/59 cells matched expectation. Zero unexpected ALLOWs. No launch-blocking RLS finding.**

Every attack — anon reading member tables, a Tier-1 account escalating itself to member, a member self-publishing or tampering with another member's rows, cross-user storage deletes, reading a listing that's still in moderation — was correctly denied by Postgres, not merely by React. The one trust-critical rule (**a member can never publish their own listing**) is enforced by the 0017 trigger on both the INSERT and UPDATE doors, verified live.

**Two Part-2 gaps are the real output of this session** (not RLS, but launch-relevant) — see [Part 2](#part-2--observability--deliverability):

1. **Sentry is not wired at all** (no SDK, no DSN usage, no events). There is currently **no server-error observability** in production.
2. **Plausible / any web analytics is not deployed** — no script on any route class. There is currently **no product analytics**, and the `/privacy` page's copy claiming "privacy-respecting analytics" is inaccurate until one ships.

Neither blocks the *trust* layer; both are things you'd want live before or shortly after launch, and both were assumed present by the Week-12 brief.

---

## Two operational notes that shaped this run (read these)

**1. The `george.gardner480+` prefix is NOT safe to bulk-purge.** Four permanent **seed members** live under it — `+seed-anna`, `+seed-max`, `+seed-lila`, `+seed-sam` (Anna / Max / Lila / Sam) — and they **own 10 of the 20 published listings** plus their storage folders. They are what makes the marketplace look populated. The "full cleanup: delete synthetic accounts" ritual in the brief, taken literally against the bare prefix, would have wiped most of the live catalog. This harness uses a unique sub-prefix **`george.gardner480+rlsaudit`** and cleans only that, exactly as the June moderation harness used `+modtest`. **Every future prod harness must keep its own sub-prefix.** Seed-member count and published-listing count are asserted unchanged at the end of every run.

**2. `signInWithPassword` is now Cloudflare-Turnstile-gated at the Auth API.** The direct password path (used by every June harness — multi-sponsor, edit-archive, admin-console, listing-moderation) now fails with `captcha protection: request disallowed`. Spam protection was turned on after those harnesses were written. This audit mints sessions the other way — `admin.generateLink` (service-role, no captcha) → `verifyOtp` on the anon client — which yields a genuine `role=authenticated` user JWT with the identical RLS context. **The June harnesses will need the same one-line change to `signIn` before they can run against prod again.**

---

## Part 1 — the RLS matrix (prod, 2026-08-13)

Legend: **ALLOW** = call succeeded / row(s) returned. **DENY** = 0 rows, or a policy/trigger error. "exp" is the required outcome; every row's actual matched exp.

### Principal: ANON (logged-out, anon key)

| Object | Operation | Expected | Actual | Evidence |
|---|---|---|---|---|
| `listings` (published) | select | ALLOW | ✅ ALLOW | 5 rows (teaser, 0010) |
| `accounts` | select | DENY | ✅ DENY | 0 rows |
| `applications` | select | DENY | ✅ DENY | 0 rows |
| `listing_contacts` | select | DENY | ✅ DENY | 0 rows |
| `sponsorships` | select | DENY | ✅ DENY | 0 rows |
| `invites` | select | DENY | ✅ DENY | 0 rows |
| `sponsorship_requests` | select | DENY | ✅ DENY | 0 rows |
| `listings` (a *pending* row) | select | DENY | ✅ DENY | 0 rows |
| `listings` (an *archived* row) | select | DENY | ✅ DENY | 0 rows |
| `listings` | insert | DENY | ✅ DENY | 42501 RLS violation |
| `listings` (someone else's) | update | DENY | ✅ DENY | 0 rows affected |
| `listings` (someone else's) | delete | DENY | ✅ DENY | 0 rows affected |

### Principal: TIER-1 ACCOUNT (synthetic, `is_member=false`)

| Object | Operation | Expected | Actual | Evidence |
|---|---|---|---|---|
| `listings` (published) | select | ALLOW | ✅ ALLOW | 5 rows |
| `accounts` (own row) | select | ALLOW | ✅ ALLOW | 1 row |
| `accounts` (own: name/neighborhood/bio) | update | ALLOW | ✅ ALLOW | 1 row affected |
| `accounts` (own: **is_member**) | escalate | DENY | ✅ DENY | trigger: *is_member is protected* |
| `accounts` (own: **role**) | escalate | DENY | ✅ DENY | trigger: *role is protected* |
| `accounts` (own: **sponsor_id**) | escalate | DENY | ✅ DENY | trigger: *sponsor_id is protected* |
| `accounts` (another's row) | select | DENY | ✅ DENY | 0 rows |
| `applications` (own, not member) | insert | ALLOW | ✅ ALLOW | 1 row (0007) |
| `applications` (own) | select | ALLOW | ✅ ALLOW | 1 row |
| `applications` (others') | select | DENY | ✅ DENY | 0 rows |
| `listings` | insert | DENY | ✅ DENY | 42501 RLS violation |
| `listing_contacts` | insert | DENY | ✅ DENY | 42501 RLS violation |
| `invites` | insert | DENY | ✅ DENY | 42501 RLS violation |
| `sponsorship_requests` | insert | DENY | ✅ DENY | 42501 RLS violation |
| `approve_application()` | rpc | DENY | ✅ DENY | 42501 *not authorized* (0009/0015) |

The Tier-1 → Tier-2 wall is intact: an account can browse, edit its own profile (safe columns only), and apply — and can do **nothing** a member can do, including the three privilege-escalation columns and the admin RPC.

### Principal: MEMBER (synthetic, `is_member=true`)

| Object | Operation | Expected | Actual | Evidence |
|---|---|---|---|---|
| `listings` (own pending) | select | ALLOW | ✅ ALLOW | 1 row (0016 read-own) |
| `listings` (own: content edit) | update | ALLOW | ✅ ALLOW | 1 row affected |
| `listings` (born `published`) | insert | DENY | ✅ DENY | 42501 *new listings start in review* (0017 INSERT arm) |
| `listings` (own: **self-publish**) | update→published | DENY | ✅ DENY | 42501 *members cannot make that status change* |
| `listings` (another member's) | update | DENY | ✅ DENY | 0 rows affected |
| `listings` (another member's) | delete | DENY | ✅ DENY | 0 rows affected |
| `accounts` (own: **role**) | escalate | DENY | ✅ DENY | trigger: *role is protected* |
| `log_listing_contact()` (other's listing) | rpc | ALLOW | ✅ ALLOW | 1 row (lister email returned, 0011) |
| `invites` (own) | insert | ALLOW | ✅ ALLOW | 1 row (0020) |
| `get_my_connections()` | rpc | ALLOW | ✅ ALLOW | ok (0024) |
| `listing_contacts` (any) | select | DENY | ✅ DENY | 0 rows (function-only table) |
| `invites` (another member's) | select | DENY | ✅ DENY | 0 rows (read-own) |
| `accounts` (all) | select | DENY | ✅ DENY | 0 rows (no admin read) |
| `applications` (all) | select | DENY | ✅ DENY | 0 rows (no admin read) |

A member can do exactly its job — post (into review), edit/take down its own listings, contact other members, invite, see its own trust web — and cannot touch another member's rows, read the locked tables, or self-publish.

### The moderation wall (cross-principal visibility of a pending listing)

A member's freshly inserted listing (`status='pending'`) was probed from every angle:

| Principal | Object | Expected | Actual |
|---|---|---|---|
| anon | the pending listing, by id | DENY | ✅ DENY (0 rows) |
| tier-1 | the pending listing, by id | DENY | ✅ DENY (0 rows) |
| other member | the pending listing, by id | DENY | ✅ DENY (0 rows) |
| anon | pending listing present in public browse? | DENY | ✅ absent |
| anon | same listing **after** admin `approve_listing` | ALLOW | ✅ ALLOW (1 row) |

Pre-moderation is real at the data layer: nothing a member posts is visible to anyone but the member (and admin) until an admin approves it.

### Storage (`listing-images`, private bucket)

| Principal | Operation | Expected | Actual | Evidence |
|---|---|---|---|---|
| member | upload into **own** folder | ALLOW | ✅ ALLOW | ok (0005) |
| member | upload into **another user's** folder | DENY | ✅ DENY | RLS violation |
| anon | direct (unsigned) object URL | DENY | ✅ DENY | HTTP 400 |
| anon | signed URL | ALLOW | ✅ ALLOW | HTTP 200 (0018 anon read + signed URL) |
| member | delete **another user's** file | DENY | ✅ DENY | 0 removed |
| member | delete **own** file | ALLOW | ✅ ALLOW | 1 removed |

The bucket stays private: pixels are only reachable through a short-lived signed URL, cross-user writes and deletes are refused, and a raw object URL with no signature is a 400. Confirmed visually too — the logged-out `/listings` teaser renders seed images (anon signed-URL path works end to end).

### Admin (positive controls — the reads members were denied)

| Object | Operation | Expected | Actual |
|---|---|---|---|
| `accounts` (all) | select | ALLOW | ✅ ALLOW (10 rows) |
| `applications` (all) | select | ALLOW | ✅ ALLOW (6 rows) |
| `listings` (incl. pending) | select | ALLOW | ✅ ALLOW (no error) |

---

## Part 2 — observability + deliverability

### 1. Sentry — ❌ NOT WIRED (launch-relevant)

- No `@sentry/*` dependency in `package.json`; no `instrumentation.ts`; **zero** `sentry` references anywhere in `app/`, `lib/`, or config.
- View-source of prod (`/`, `/listings`, `/terms`, `/login`, `/apply`) shows **no Sentry loader**.
- Consequence: even if a `SENTRY_DSN` env var exists in Vercel, nothing captures or forwards events — there is no error observability in production. The Week-12 step "trigger an error, confirm it arrives in Sentry" is **not verifiable because the SDK isn't installed.**
- **Action for George:** decide whether Sentry ships pre-launch. If yes, it's a small slice (`@sentry/nextjs` + wizard + DSN in Vercel). Logged as an open item, not fixed in-session (out of the audit's scope, and needs a deploy).

### 2. Plausible / web analytics — ❌ NOT DEPLOYED (launch-relevant)

- No `plausible` / analytics / Vercel-Insights / GTM reference in code; **no analytics script on any prod route class** (checked `/`, `/listings`, `/terms`, `/login`, `/apply`).
- So there's no live pageview to confirm and no domain to check yet — nothing is installed.
- Minor knock-on: `app/privacy/page.tsx` tells visitors the site uses "basic, privacy-respecting analytics." That claim is currently **untrue**; either ship Plausible or soften the copy. Flag for the copy/legal pass.
- **Action for George:** if Plausible is the intended tool, add the script to `app/layout.tsx` with `data-domain="manhattanite.com"` (non-www) and verify a pageview. Small slice; needs a deploy.

### 3. Resend deliverability — ✅ AUTH FOUNDATION HEALTHY; live inbox eyeball pending

DNS for `manhattanite.com`, checked via `dig`:

| Record | Value | Reading |
|---|---|---|
| DKIM (`resend._domainkey`) | public key present | ✅ Resend DKIM installed |
| Return-Path (`send.manhattanite.com`) | SPF `include:…_spfm.send.…`, MX → `feedback-smtp.us-east-1.amazonses.com` | ✅ Resend/SES subdomain delegated |
| DMARC (`_dmarc`) | `v=DMARC1; p=reject; adkim=r; aspf=r` | ✅ strict policy, **relaxed** alignment |
| Root SPF | `v=spf1 include:secureserver.net -all` | GoDaddy only — *not* Resend (see note) |

**Why this passes DMARC despite the GoDaddy root SPF:** DMARC needs *either* aligned SPF *or* aligned DKIM. Resend signs with `d=manhattanite.com` (DKIM) and uses a `send.manhattanite.com` Return-Path; under relaxed alignment both align to the org domain `manhattanite.com`, so mail authenticates and DMARC passes. This is the standard, correct Resend + strict-DMARC setup.

**Code path is intact:** `sendListingContact` in `lib/applications/emails.ts` sets `from: applications@manhattanite.com`, **`replyTo: senderEmail`** (reply reaches the member directly, per spec), and `renderListingContact` renders the sender's **neighborhood** in the byline. Apply-flow senders use the same `APPLICATIONS_FROM`.

**What still needs George (one item):** the true end-to-end "does it land in the inbox, not spam" test needs a logged-in prod **member** session to submit the contact form — and prod login is Turnstile-gated (I don't solve CAPTCHAs), so I can't drive it. DNS + code path predict clean inbox delivery; the placement eyeball is a 2-minute manual check for George (send one contact from a member account to a real inbox alias, confirm inbox + Reply-To + neighborhood line).

### 4. The 5-second extras

- **Favicon:** ✅ renders. Prod `/` serves three `<link rel="icon">` (16/32/64) via Next's `/icon` route; the "M." mark shows in the browser tab. (Closes the Phase 4A eyeball open since 21 Jul.)
- **Console errors:** ✅ none. Landing (`/`) and browse (`/listings`) both loaded with an empty error console.

---

## Cleanup + close

- Synthetic `+rlsaudit` users deleted; **0** remain. Their listings (cascade) and storage objects (Storage API `.remove`) removed.
- **Seed members intact:** 4 before / 4 after. **Published listings intact:** 20 before / 20 after.
- **Founder row byte-identical** to the opening snapshot (`is_member=true`, `sponsor_id=null`, `role=admin`).
- One pre-existing cosmetic item observed, not touched: an archived `QA TEST — ignore (auto-posted…)` listing sits in prod. Harmless (archived, invisible to the public), but worth deleting via service role in a spare minute.

## Bottom line

Week 12's must-hit — **prove the trust gate can't be bypassed** — is **done and green**. The RLS/trust layer is launch-ready. The two things this session surfaced (no Sentry, no Plausible) are observability gaps, not trust holes: decide whether either ships before launch. Deliverability's DNS + code are sound; only the manual inbox eyeball is outstanding.
