# Claude Code prompt — the invitation screen's navigation, its tab title, and the draft takedown

Three changes, one batch. All three were found on 2026-09-14/15 while walking the
live site before wave one. Read each section's reasoning before you code it; two of
the three are deliberate reversals of a default, not bug fixes.

---

## 1. The invitation screen must not offer product navigation

**What is wrong.** `app/(cl)/join/[token]/page.tsx` renders `<AppHeader active="none" />`
in all four of its branches. For a logged-out invitee — someone who has never seen
Manhattanite and arrived from a friend's email — that header offers **Browse**,
**Profile** and a filled **"Post a listing"** pill. All three lead to a login wall.
The filled pill is the heaviest element on the screen and it sits directly opposite
the screen's own primary action, "Claim your spot".

Below 600px it is worse: `MobileTabBar`, mounted in `app/(cl)/layout.tsx`, adds
**Browse · Post · Profile** along the bottom. So on a phone the invitation screen
carries six navigation targets, every one of them locked, around one form.

`MobileTabBar` already has the rule and the reasoning. Its `NAVLESS` set exists
because the landing page is "a public page addressed to someone who has never
signed in, and offering them Saved, Post and Profile is offering three doors that
are locked." `/join/[token]` is the same case and was missed.

**What to do.**

a) In `app/components/cl/MobileTabBar.tsx`, extend `NAVLESS` to cover
   `/join/[token]`. It is a dynamic segment, so a `Set` lookup will not match —
   change the test to cover both the exact landing path and any path starting
   `/join/`. Update the comment above `NAVLESS` to say why the invitation screen
   joins the landing there: same reason, second instance.

b) Give `AppHeader` a way to render as the wordmark alone — no nav links, no
   Admin link, no action pill. Add a prop (`bare`, defaulting to false) rather
   than building a second header component, so the bar, the hairline, the widths
   and the wordmark stay one thing. Document the prop in the file's header
   comment in the existing house style.

c) In `app/(cl)/join/[token]/page.tsx`, pass the bare header in the three
   branches addressed to someone who is **not yet a member**: the invalid/used
   invitation branch, the logged-in-but-not-a-member branch, and the logged-out
   branch. The **already-a-member** branch keeps the normal header — that person
   is in, and the screen already offers them "Browse listings" and "Invite
   someone" as real destinations.

---

## 2. The invitation screen's browser tab

**What is wrong.** `/join/[token]` has no metadata of its own, so it inherits the
root title from `app/layout.tsx`. The browser tab on the most important first
screen the product has reads *"Manhattanite — A better marketplace for Manhattan
residents"*. Nothing about being invited.

**What to do.** Add a `generateMetadata` to `app/(cl)/join/[token]/page.tsx`.

- It must not leak the inviter's name into the tab, the OG card or anything a
  crawler can reach. The 2026-08-26 rule ("nobody is named to a logged-out
  visitor") bends for the page body because the token is a one-time secret held
  by the invitee — it does **not** bend for metadata.
- So: a fixed string, no lookup. `"You've been invited · Manhattanite"`.
- Add `robots: { index: false, follow: false }`. A one-time invitation link has
  no business in a search index, and nothing currently stops it.

---

## 3. A member can take down a returned draft, but it is not the point of the screen

**George's decision, 2026-09-15:** *"They should have the option to take it down
but it shouldn't be front and centre."*

**What is wrong.** When a moderator returns a listing with feedback, it goes to
`status = 'draft'`. `ClPostForm` renders `ClRemoveListing` for a draft, so the
member sees a **"Take it down"** heading and a red button. Clicking through fails:
the 0017 trigger allows a member to move `pending → archived` and `published →
archived` and `draft → pending`, but **not** `draft → archived`. The member picks
a reason and gets the generic "Something went wrong."

This predates the outcome work — it has never worked.

**Two parts.**

### 3a. Database — migration `0032_member_archive_draft.sql`

In `enforce_listing_status_transition()`, widen the member take-down branch to
include `draft`:

```sql
if old.status in ('draft', 'pending', 'published') and new.status = 'archived' then
  return new;                                      -- take down own listing
end if;
```

Change nothing else. Do **not** touch the `→ published` refusal, the INSERT
branch, or the RLS policy. Follow the house pattern for migrations: a plain-English
header explaining what it does and why, and a "Verify with:" block at the foot with
the SQL that proves it — including the negative, that `draft → published` still
raises 42501.

Write it as `-- PROPOSED — NOT YET APPLIED` and tell George to run it in the
Supabase SQL editor. **Do not apply it yourself.** A migration's status is a fact
about the database, never a fact about a document.

### 3b. Interface — quieter for a draft

In `ClRemoveListing.tsx`:

- **No outcome survey on a draft.** A returned draft was never published, so it
  cannot have "found its person here". The existing `asks` flag already handles
  this for `pending` — widen it: `const asks = status === "published"`. Rewrite
  the comment above it, which currently explains the pending case only.

- **Not front and centre.** On a `draft`, the member's job on this screen is to
  fix what the moderator asked for and send it back. Taking it down is a real
  option and must stay reachable, but it should not compete with the save.
  For `status === 'draft'` only:
  - Drop the `Take it down` group label and the explanatory paragraph from the
    collapsed state.
  - Replace the red ghost button with a single quiet text control (`cl-quiet`,
    muted colour, not red) reading **"Take this listing down instead"**.
  - Once it is clicked, the confirm step stays exactly as destructive as it is
    now — full sentence saying what happens, red confirm, "Keep it" beside it.
    Quiet to open, plain to confirm.
  - Leave `pending`, `published` and `archived` untouched.

- Draft copy for the confirm step: the current sentence branches on `pending`
  only. A draft is not in the queue, so neither string is right. Add a third:
  it comes off the network, it stays in your records under Archived, and you
  cannot resubmit it — post a new one instead.

---

## Constraints and verification

- `ClRemoveListing` renders **its own `<form>` and must stay a sibling of the post
  form, never a child.** A nested form is silently dropped by the browser and the
  button re-associates with the outer form — that exact bug shipped for a
  fortnight. `scripts/test-edit-archive.ts` is the guard. Do not restructure it.
- Run `npm run audit:gates` against a **warm** dev server and `npm run audit:rls`.
  Baseline is 0 failures and 67/67. Do not delete or weaken an assertion to make
  something pass; retarget it and say so.
- Verify the invitation screen **in a real browser at both widths** — a desktop
  width and 375px — not off the diff. Confirm the tab title, confirm no nav links,
  no action pill, no bottom tab bar, and that the already-a-member branch still
  has its normal header.
- Verify the draft takedown by **driving the real form** as a member on a listing
  a moderator has returned, after George has run 0032. A route that renders is not
  a route that works, and seed data is not evidence that a write path works.
- Commit at the end, including `COMPANY/` and `WORK AREAS/` doc updates. Add a
  session-log entry at the TOP of `COMPANY/memory/session-log.md` and record the
  draft-takedown decision in `COMPANY/memory/decisions.md`.
