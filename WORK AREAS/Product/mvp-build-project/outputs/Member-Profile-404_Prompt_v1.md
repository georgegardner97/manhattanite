# Claude Code handoff — untangle and ship the member-profile 404 fix

Paste everything below the line into Claude Code, run from `~/Developer/manhattanite`.

---

You are working in `~/Developer/manhattanite` on branch `main`. Read `CLAUDE.md` first.

## Context

Earlier today the `/members/[id]` 404 was fixed: `app/(cl)/members/[id]/page.tsx` was rewritten to read
identity from `get_member_profile()` instead of deriving it from listing bylines, and
`supabase/migrations/0026_member_profile.sql` was rewritten to add `sponsor_names` to that function's
return. **Migration 0026 is already APPLIED to production** — verified in the SQL editor, it returns
Emma Kanne with `sponsor_names = ["George Gardner"]`. Do not re-run it. The decision behind it is
CLAUDE.md note 17.

While that work was in the tree, a separate session committed broadly and swept it up:

- `dce06bf` "Cards: no Example tag, and the meta line is a byline plus a date" — contains the card
  work AND the whole `app/(cl)/members/[id]/page.tsx` profile rewrite.
- `788fc0b` "Docs: the Example tag's deadline, and why the meta line was split" — contains the card
  docs AND CLAUDE.md note 17.
- `supabase/migrations/0026_member_profile.sql` is still uncommitted.

So the profile fix is spread across two commits whose messages describe something else, and it cannot
be reverted as a unit. **Neither commit is pushed** (`origin/main` is at `50ac0ec`, local is 2 ahead),
so history can be rewritten safely — nothing is shared yet.

## Task

### 1. Clear the stale lock

There is a zero-byte `.git/index.lock` blocking git writes. Delete it. Confirm no git process is
actually running first (`ps aux | grep -i git`); if one is, stop and tell George rather than deleting.

### 2. Re-split the two unpushed commits into three clean ones

Nothing is pushed, so:

```
git reset --soft 50ac0ec
```

The working tree is untouched by this — every change stays exactly where it is, just unstaged.
Then commit in three groups, in this order:

**Commit 1 — the card work** (reuse the original message, `dce06bf`):
```
app/(cl)/listings/[id]/page.tsx
app/components/cl/ClLandingCard.tsx
app/components/cl/ClListingCard.tsx
app/components/cl/ClListingRow.tsx
lib/cl/listings-read.ts
```
Message: `Cards: no Example tag, and the meta line is a byline plus a date`

**Commit 2 — the profile fix, on its own so it reverts cleanly**:
```
app/(cl)/members/[id]/page.tsx
supabase/migrations/0026_member_profile.sql
```
Message:
```
A member has a profile because they are a member, not because they posted

/members/[id] was built entirely from the denormalized listing byline, so a
member with no published listing had no name the page could read and it
answered 404. That is most new members, and it is exactly the person you are
most likely to look up: George hit it clicking through from his own vouching
list to Emma Kanne.

Identity now comes from get_member_profile() (0026, rewritten to return
sponsor_names) and is read independently of listings, which may legitimately be
empty. notFound() now means one thing: this id is not an approved member.

0026 is applied to prod. The page still degrades to the old listings-derived
name if the function is missing, so the ordering stays safe.
```

**Commit 3 — the docs**:
```
CLAUDE.md
COMPANY/memory/session-log.md
WORK AREAS/Product/mvp-build-project/memory.md
```
Message: `Docs: the Example tag's deadline, the meta line split, and the member-profile fix`

Note: `CLAUDE.md` carries notes 15/16 (cards) and note 17 (profile) in one file, so it cannot be
split by path. Leaving it whole in the docs commit is fine — say so rather than trying to be clever
with `git add -p`.

### 3. Verify before pushing

- `git log --oneline -4` — three new commits on top of `50ac0ec`, in that order.
- `git diff 50ac0ec..HEAD --stat` — identical to what the two old commits plus the migration
  contained. Nothing gained, nothing lost.
- `npx tsc --noEmit` — clean.
- `npx eslint "app/(cl)/members/[id]/page.tsx"` — clean.
- `npm run dev`, sign in, go to `/profile`, click through the vouching list to Emma Kanne. Expect:
  her name, "East Village", "Vouched for by George Gardner", a Member since stat of 2026, and
  "Nothing posted yet." where the listings grid would be. **No 404.** Also open a member who DOES
  have listings and confirm the grid still renders.

If the dev check fails, stop and report — do not push.

### 4. Push

`git push origin main`. Then tell George it is deployed and what to watch.

## Rules

- Do not force-push. If `git push` is rejected, stop and report.
- Do not re-run migration 0026, and do not touch any other migration. `0029` is written and NOT
  applied; leave it that way.
- Do not amend or rewrite anything at or below `50ac0ec` — that is pushed history.
- `ABOUT ME/` is gitignored and must stay uncommitted.
