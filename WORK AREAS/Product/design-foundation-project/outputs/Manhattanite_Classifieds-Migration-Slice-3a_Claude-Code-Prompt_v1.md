# Classifieds migration Slice 3a — the bylines decision, then the screens people still see

**Date:** 2026-08-26
**Written by:** Cowork, for a Claude Code session
**Follows:** Slice 2 (shipped same day, `787484c`). Scope enumerated from the repo in `design-foundation-project/memory.md` under the Slice 3 note — read that first rather than re-deriving it.

Two things in this prompt. Step 1 is small and unblocks the merge. Steps 2 onward are the remaining screens a normal person can reach.

---

## Step 1 — nobody is named to a logged-out visitor

**George's decision, 26 Aug: hide member names from logged-out visitors everywhere. Browse changes to match the landing, not the other way round.**

This settles the tension `app/(cl)/page.tsx` has been carrying in a comment since 18 August. The landing already anonymises. Browse, search, saved, listing detail and the member profile all still name people to the same guest, one click away.

### What the rule is

A logged-out visitor sees **no member name and no sponsor name, anywhere**. Signed in — account holder or member — nothing changes; the full byline stays exactly as it is. The vouching mechanic is intact for everyone who is actually in the building.

### Where it has to be enforced, and where it must not be

`author_name` and `sponsor_names` are denormalised onto every listing (0006) and published rows are anonymously readable (0010). **The database will keep handing over the names, and that is correct — do not touch an RLS policy for this.** Like the six-row teaser cap, this is an application rule.

Which means it is exactly the class of bug that produced Slice 1's trust hole: `audit:rls` will pass 59/59 whether you get this right or wrong.

**Put it in the shared read, once.** `defaultMeta()` in `lib/cl/listings-read.ts` is where the named byline is assembled for browse, search and saved. The landing's page-local `anonymousMeta()` becomes the shared guest branch rather than a special case — this should end up as a simplification, with one function deleted, not a flag threaded through five pages.

Then the two screens that need more than a different string:

- **`/listings/[id]`** — `listerName` and the sponsor inset both render names to a guest today. Anonymise both. The contact affordances are already member-gated and don't change.
- **`/members/[id]`** — the entire page is a named member. Anonymised it says nothing, so for a guest it becomes the members-only wall (`ClGate`). Check nothing links a guest there once it does. Side effect worth having: member pages stop being indexable.

### Prove it, don't assert it

Add assertions to `scripts/audit-gates.ts`: **for every guest-reachable route, the response body must not contain any member name.** The four seed members and the founder row give you real strings to search for. A guest fetching browse, search, a listing, a member id and the landing must come back clean.

That assertion is the whole point of this step. Without it, the next person to add a screen re-opens the hole.

---

## Step 2 onward — Slice 3a

Twelve `(ed)` routes remain. This slice takes the eight a normal person can reach and leaves the four admin screens for 3b, since you are the only one who sees those.

### 2a. `/reset-request` and `/reset-password` — do these first

Claude Code's own Slice 3 note already identified `/reset-request` as the priority, and it is right: **it is the only editorial screen a normal user can still reach from inside the Classifieds system**, from two places — the sign-in failure path, and the Password row on `/profile`. Every other remaining `(ed)` route needs a direct link or a token to reach.

`ClAccess` already carries the auth card grammar. These are the same shape with one field.

### 2b. `/thank-you`

Every applicant lands here, and it is the last thing they see before waiting on you. Short, warm, and honest about the timeline — `trust-and-moderation.md` sets the response target at under 48 hours and a 72-hour maximum. Do not promise faster than the SLA you actually keep.

### 2c. `/terms` and `/privacy`

**These need designing, not porting.** The Classifieds kit has no long-form prose treatment — nothing in it sets a measure, a heading scale for a document, or a "this is a working draft" notice. Build that treatment once here, because it is also what a future `/standards` page will use.

Two content jobs while you are in there:

1. **Fix the analytics claim.** `/privacy` says the site keeps "basic, privacy-respecting analytics" and "lightweight analytics to understand how the site is used." **It runs none.** Plausible is planned but not shipped, so soften the copy to match reality now and restore it when analytics actually land. A privacy policy that overclaims is worse than a thin one, and this page is about to be read by a lawyer.
2. **Leave the working-draft notice in place.** It is honest and it stays until counsel has actually reviewed the pages.

### 2d. `/invite`, `/join/[token]`, `/sponsor-request/[token]`

The growth loop. Migrating `/invite` also unblocks something specific: the **"I have an invite →" CTA that `voice-and-copy.md` pairs with the contact gate** and that has been commented out under the dead-link rule since Slice 2. Restore it once the route is in the system.

`/join/[token]` and `/sponsor-request/[token]` are reached by token from an email, so they are the two screens most likely to be someone's first-ever sight of Manhattanite. Treat them that way.

### 2e. One small thing, or admin becomes unreachable

`/admin` is linked from exactly one place in the app: `AccountMenu.tsx`, which renders inside `SiteNav`, which is mounted only in `app/(ed)/layout.tsx`. After this slice the only `(ed)` routes left are the four admin pages — so the sole link into the admin console will render only on pages you cannot reach without already being there.

Add an admin entry point to `AppHeader`, shown only when the viewer's `role` is `admin`. Small, and it has to exist before `(ed)` retires anyway. Everything else about the admin screens waits for 3b.

---

## When to merge

**After this slice, merge 1, 2 and 3a to `main` together.**

At that point every screen a normal person can reach is in the Classifieds system, and only the four admin screens are editorial — and you are the only person who sees those. That is a defensible line to ship on, and it stops the branch growing past the point where a revert is comfortable.

Do not merge before Step 1 is done and its audit assertions pass. The naming inconsistency going live on an indexed page is the one thing here that is hard to walk back.

---

## Verification

1. `npm run build` clean.
2. `audit:rls` 59/59. `audit:gates` — 21 existing assertions plus the new name-leak ones, all green.
3. Guest walk: landing, browse, a listing, search, a member id. **No member name anywhere.** Check the rendered HTML, not just the page.
4. Signed in as a member: bylines are back and unchanged.
5. `/reset-request` reached from both entry points — the sign-in failure and the profile Password row — stays inside the system.
6. 390px and desktop. Screenshots into `outputs/classifieds-migration-screens/`, continuing from 34.

---

## Don't

- Don't change an RLS policy. This is an application rule, deliberately.
- Don't thread a `isGuest` flag through five pages. One shared function.
- Don't promise an application response faster than the 48-hour target.
- Don't restore the analytics copy until analytics exist.
- Don't migrate the admin screens. That is 3b.

---

## Before you finish

1. Commit `COMPANY/` and `WORK AREAS/` docs.
2. Log the slice across the four memory files, and add the byline decision to `decisions.md` — it reverses a held-open question and changes what a logged-out visitor sees.
3. Update the stale bullet in `COMPANY/legal-and-policy.md` that says Manhattanite is "not making listings public to non-account-holders." It has been untrue since the 9 June D1 decision. After this slice the accurate line is: listings are public, member names are not.
4. Push the branch.
