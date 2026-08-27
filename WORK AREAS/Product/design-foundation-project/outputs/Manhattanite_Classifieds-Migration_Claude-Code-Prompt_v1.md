# Classifieds migration — Claude Code prompt v1

**Date:** 2026-08-18
**Written by:** Cowork, for a Claude Code session
**Decision behind it:** George, 18 Aug — "This is the design direction now." The Classifieds system stops being a preview and becomes the site.

---

## What this is

On 17–18 Aug the Claude Design project ("Manhattanite Classifieds.dc.html" + "Manhattanite Landing v3.dc.html") was built at `/design` against the real listings table. Eleven of twelve screens plus the landing. It works, and it works on real rows.

It changes nothing a visitor sees. Everything lives under `/design/*`, and outside that folder the branch touches five files: `NavGate.tsx` (hides the old nav on `/design`), `Wordmark.tsx` (an optional prop, existing callers unchanged), `package.json`, a test script, and an unapplied migration.

This document is the plan for making it the actual site.

**Read before starting:** `CLAUDE.md`, `AGENTS.md` (Next 16 breaking changes), `COMPANY/mvp-spec.md`, `COMPANY/tech-architecture.md`, `app/design/page.tsx` (the honest record of what was built and what was cut).

---

## Four things George settles before you write code

Do not start Slice 1 until these are answered. Three of them change what you build.

### 1. The landing names nobody. Browse names everyone.

The Classifieds landing anonymises bylines. Browse shows "Listed by Anna, vouched by George" to the same logged-out visitor, on the same six listings. One of the two is wrong about how public a member's name is, and after this migration the landing is `/` and is the page Google indexes.

**Recommendation: name people on the landing.** Anonymising it protects nothing when the teaser six are already named one click away, and named sponsorship is the trust mechanic. Showing it on the front page is the argument the page is trying to make.

### 2. Two serifs in one system

The wordmark is Instrument Serif (Concept D, locked 21 Jul, with the period as part of the mark). The Classifieds system sets Newsreader. In the preview these sat side by side and that was flagged as worth a look.

**Recommendation: keep Instrument Serif for the mark alone.** The favicon and OG card are already cut in it, and re-cutting the mark reopens a locked decision. But George should see it on a real screen before it ships.

### 3. Saved and Search are not in v1

`mvp-spec.md` puts search filters and favourites out of v1. Both are built. Both are cheap: Saved lives in the browser and touches no table, Search is a pure narrowing of the same gated read and cannot surface a row browse would not already show.

If they don't ship, the "Saved" link comes out of the header nav, `/search` is dropped, and the header is down to two items.

**Recommendation: ship both, and update `mvp-spec.md` to say so.** They exist, they add no data exposure, and cutting them makes the header thinner than the design.

### 4. Migration 0026

`supabase/migrations/0026_member_profile.sql` is written, unapplied, and nothing calls it. The member profile screen is assembled from public bylines only and works without it.

**Recommendation: leave it unapplied.** Don't apply a migration nothing calls.

---

## Slice 0 — fix local auth first (5 minutes, not optional)

`.env.local` carries Cloudflare's always-passes TEST Turnstile key while Supabase validates against the real secret, so every local sign-in dies at the captcha. This is why the last build shipped with `/design/post`, `/design/settings` and the forgot-password reveal **never rendered by anyone**.

Put the real public site key in `.env.local` and confirm you can sign in locally as the founder. If you cannot, stop and say so. Migrating member-only screens you cannot see is how a broken screen reaches production.

---

## The shape: three slices

One big-bang migration is the risky version. Fourteen live routes have no Classifieds design at all, so some period of two systems is unavoidable. Route groups make that clean instead of messy.

| Slice | Covers | After it, a visitor sees |
|---|---|---|
| **1** | Plumbing, landing, browse, listing detail, member profile, search, saved | The whole logged-out experience, coherent |
| **2** | Post, profile/settings, my listings, edit, contact | The whole member experience |
| **3** | Admin ×4, invite/join, sponsor request, resets, thank-you, terms, privacy — then retire the editorial system | Everything |

Slices 2 and 3 include screens the design file never drew. Those need designing, not porting, and each must obey the rule that governed the preview: **no dead controls.** If the product can't do it, cut it and say why.

Slice 1 is specified in full below. Slices 2 and 3 get their own prompts.

---

## Slice 1 — the foundation and the public face

### Step 1. Route groups

Route groups change the layout tree without changing a single URL. Three layouts:

**`app/layout.tsx`** keeps only `<html>`, `<body>`, `metadata`, `viewport`, and the `globals.css` import. Tailwind's base layer has to stay global, so `globals.css` does not move. Strip `SiteNav` and `NavGate` out of it.

**`app/(cl)/layout.tsx`** — new. Newsreader + Instrument Sans via `next/font`, the `.cl-root` wrapper, `classifieds.css`, `AppHeader`, `MobileTabBar`. Lift this from `app/design/layout.tsx` and drop two things: the preview strip, and `robots: { index: false }`.

**`app/(ed)/layout.tsx`** — new. Inter + Instrument Serif, `NavGate` + `SiteNav`. This is what the not-yet-migrated routes keep running on.

Why this works without leaking: every `cl-` token resolves under `.cl-root`, and `.cl-root` sets background, colour and font-family on its own subtree only. Editorial pages never mount it. The two systems stay as separate as they are today, but by layout rather than by URL prefix.

### Step 2. Move the components out of the preview

`app/design/*.tsx` → `app/components/cl/`. Keep every filename. `app/design/classifieds.css` → `app/styles/classifieds.css`. Update imports.

Keep every explanatory comment. Those comments are the record of which design decisions were overruled by the product and why, and they are the most valuable thing in the slice.

### Step 3. Repoint the routes

Into `app/(cl)/`:

- `page.tsx` ← `app/design/landing/page.tsx` (replaces the dark editorial landing)
- `listings/page.tsx` ← `app/design/browse/page.tsx`
- `listings/[id]/page.tsx` ← `app/design/listings/[id]/page.tsx`
- `members/[id]/page.tsx` ← `app/design/members/[id]/page.tsx` (new public route)
- `search/page.tsx` and `saved/page.tsx` ← if decision 3 says ship

Everything else moves into `app/(ed)/` untouched.

The old `app/page.tsx` and `app/listings/page.tsx` are replaced, not edited. Keep the current landing as `app/(ed)/_retired/landing.tsx.bak` or leave it in git history — your call, but don't leave two live landings.

### Step 4. Every internal link

The preview pointed at itself. Rewrite all of them:

```
/design/browse            → /listings
/design/listings/[id]     → /listings/[id]
/design/post              → /listings/new
/design/settings          → /profile
/design/access            → /login
/design/access#request    → /apply
/design/saved             → /saved
/design/search            → /search
```

Grep for `/design` when you're done. Zero hits outside comments.

`ClGate` currently offers "Sign in" and "Request access". On the real site, check the four-state logic in `app/design/access/page.tsx` still holds when the two cards become two routes.

### Step 5. Metadata and the landing

The `(cl)` layout must not carry `noindex`. Root metadata (title, description, OG, Twitter, `metadataBase`) stays in `app/layout.tsx` and still applies.

The landing keeps the founder's 17 Aug direction: sign-in is the primary action and opens a working form in place, request access sits in a band at the foot. That was flagged and accepted as the lower-converting arrangement, and it is not up for revision in this slice.

---

## Rollback and branching

Cut a new branch from `design/classifieds-preview`, call it `design/classifieds-live`. `main` stays deployable throughout. Test on the Vercel preview before anything merges.

Rollback is no longer `rm -rf app/design`. It is `git revert` of the merge, so the merge must be one clean commit and `main` must be green before it.

---

## Verification

Do not report this done until all of it passes.

1. `npm run build` clean.
2. **The RLS audit — 59/59, zero unexpected ALLOWs.** The harness is `scripts/audit-rls.ts` and it has no npm script yet; add one (`"audit:rls": "node --env-file=.env.local --import tsx scripts/audit-rls.ts"`) rather than running it by hand, so the next slice can't skip it. It attacks prod with a `+rlsaudit` sub-prefix — **never the bare `george.gardner480+` prefix**, which the four seed members live under and which owns half the published catalogue. The trust layer is the moat: a design migration that moves one cell is a failed migration.
3. Guest walk: landing → browse shows exactly six listings → a seventh listing id shows the wall, not the row → member names render per decision 1.
4. Tier-1 walk: can browse, cannot contact, cannot post, sees the interaction gate with its real copy.
5. Member walk: can post into review, cannot self-publish, can contact.
6. 390px and desktop on every migrated screen. The header nav folds to the tab bar under 600px.
7. Screenshot each migrated screen into `WORK AREAS/Product/design-foundation-project/outputs/classifieds-migration-screens/`.

---

## Don't

- Don't weaken the Tier 1 / Tier 2 wall for ergonomics. It is the product.
- Don't touch an RLS policy in a design slice.
- Don't apply migration 0026.
- Don't delete the editorial components. Slices 2 and 3 still run on them.
- Don't rename the `other` listing type enum. The URL is the contract.
- Don't draw a control the product can't do. Cut it and write down why.

---

## Before you finish the session

1. Commit `COMPANY/` and `WORK AREAS/` doc changes. The 20 Jul doc-revert incident happened because uncommitted doc changes met a git operation.
2. Log the slice in `WORK AREAS/Product/design-foundation-project/memory.md`, `WORK AREAS/Product/mvp-build-project/memory.md`, `COMPANY/memory/session-log.md`, and `COMPANY/memory/decisions.md` (the 18 Aug direction decision belongs in the decisions log — it overturns the "input to the designer's brief, not the thing to ship" read from the day before).
3. **Push `main`.** It is two commits ahead of `origin/main` (`dbfeaf7`, `06d7b60` — the Week 12 RLS audit and the August strategy docs). Production has been running 22 July code. Both commits are docs and scripts only, so the live site is functionally current, but a month of documentation exists on one laptop.
