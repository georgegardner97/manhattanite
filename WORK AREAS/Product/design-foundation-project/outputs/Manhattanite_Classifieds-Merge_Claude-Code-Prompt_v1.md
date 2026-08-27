# Merge the Classifieds migration to main

**Date:** 2026-08-27
**Written by:** Cowork, for a Claude Code session

This ships the redesign. `main` has not moved in code terms since 22 July, so this deploy carries five weeks of accumulated change in one go. Verify before and after; do not rush the middle.

**What's merging:** slices 1, 2 and 3a on `design/classifieds-live` — 15 commits, roughly 201 files, +12,000 / −3,350. Every screen a normal person can reach becomes the Classifieds system. The four `/admin` screens stay editorial and are Slice 3b.

---

## Step 1 — fix the one regression this merge would otherwise ship

**`/admin` has no link anywhere in the new system.** It is reached today from `AccountMenu`, which renders inside `SiteNav`, which is mounted only in `app/(ed)/layout.tsx`. After the merge the only `(ed)` routes left are the admin pages themselves — so the sole link into the console renders only on pages you cannot reach without already being there.

The routes and their gates are fine. What breaks is the way in, and it breaks in production, for the one console George uses to approve members by hand.

Add an admin entry point to `app/components/cl/AppHeader.tsx`, rendered only when the viewer's `role` is `admin`. Keep it quiet — this is a tool, not a nav item. Commit it to `design/classifieds-live` **before** the merge, as its own commit, so the merge commit stays purely a merge.

If it turns out to need more than a small change, stop and say so rather than growing it. Bookmarking `/admin` is an acceptable fallback and 3b will do it properly.

---

## Step 2 — pre-flight

Do not merge if any of these is not true. Report and stop instead.

1. Working tree clean. There is one uncommitted doc — the Slice 3a prompt, edited by Cowork — commit it first (`Docs: admin entry point note in the Slice 3a prompt`).
2. `design/classifieds-live` is pushed and matches `origin`.
3. `main` matches `origin/main`.
4. `npm run build` clean **on the branch**.
5. `npm run audit:rls` — 59/59, zero unexpected ALLOWs.
6. `npm run audit:gates` — 30/30, including the guest name-leak assertions.
7. Confirm prod state is untouched by the audits: 4 seed members, 20 published listings, founder row byte-identical.

---

## Step 3 — the merge

```
git checkout main
git pull
git merge --no-ff design/classifieds-live -m "Classifieds migration: slices 1, 2 and 3a"
```

**`--no-ff` is not optional.** It keeps the whole migration as a single merge commit, so the undo is one `git revert -m 1 <sha>` rather than unpicking fifteen commits under pressure.

Do not rebase, do not squash, do not fast-forward. The branch history is the record of why each decision was made and it is worth keeping.

Then `npm run build` on `main` before pushing. A merge that builds on the branch and not on `main` is rare but it is exactly the case worth catching locally rather than in a deploy.

---

## Step 4 — push, and watch it land

```
git push
```

Then wait for the Vercel deploy and confirm it goes green. **Report the deployment URL and status.** If the deploy fails, do not start fixing forward — report what failed. The revert is cheap and a broken production site is not the place to debug.

---

## Step 5 — verify against production, not localhost

This is the part that matters. Everything until now was verified against a local build.

1. **`manhattanite.com` loads signed out.** Six listings, and **nobody named** — check the rendered HTML and the page payload, not just what is on screen. That is the assertion `audit:gates` added, and production is the first place it has ever run for real.
2. **A seventh listing id** returns the members-only wall, and leaks no field of the listing behind it.
3. **`/members/<id>` signed out** is the wall.
4. `/terms` and `/privacy` load, and the analytics claim is gone.
5. `/reset-request` loads and stays inside the design system.
6. **Signed in as the founder:** `/listings/new`, `/profile`, `/listings/mine`, and `/admin` via the new entry point.
7. Favicon and OG card still render — both are file-convention routes and a layout change is exactly what disturbs them.
8. Re-run `audit:rls` and `audit:gates` once more now that the code they describe is the code in production.

---

## If something is wrong

```
git revert -m 1 <merge-sha>
git push
```

That is the whole rollback, and it is why Step 3 insists on `--no-ff`. Take it early rather than late. Nobody is on the network yet, so the cost of reverting is close to zero and the cost of leaving something broken in front of a first cohort is not.

---

## Don't

- Don't squash, rebase or fast-forward the merge.
- Don't force-push anything, to any branch.
- Don't delete `design/classifieds-live` after merging. Keep it until 3b has shipped and settled.
- Don't touch an RLS policy or a migration in a merge.
- Don't fix forward on a failed deploy. Revert, then diagnose.

---

## Before you finish

1. Log the merge in `COMPANY/memory/session-log.md` and the design-foundation memory: what shipped, the production verification results, and the deploy URL. **This is the first code deploy since 22 July** and that is worth stating plainly in the record.
2. Note in `decisions.md` that the Classifieds system is now live on manhattanite.com.
3. Commit the docs and push.
4. **Say what is left:** Slice 3b (`/admin` ×4), then `app/design/` and the `(ed)` group retire together — along with `globals.css`, `SiteNav`, `NavGate`, `AuthShell`, `PageShell`, `BoxButton`, `ArrowLink` and the editorial `ListingCard`.
