# Claude Code prompt — the vouched-for-by copy pass + the edit-screen fix

**Written:** 2026-08-31 by Cowork · **State on disk:** everything below is already written and uncommitted in `~/Developer/manhattanite` · **Your job:** verify it properly, commit it, push it, and confirm it on production.

Cowork cannot run `next build` on this repo (node_modules is darwin-arm64, the device shell is linux/arm64 with no registry access) and cannot push. So this work is typechecked and lint-clean but **not build-verified and not deployed**. That is the gap you are closing.

---

## What changed and why

**1. The edit screen stopped promising a review that never happens.** (George's call, 31 Aug — fix the copy, not the behaviour.)

`updateListing` deliberately never writes `status`, so an edit to a published listing goes straight back live. The form told every editor "It goes back through review before it's live again." That single line is now `EDIT_NOTES` in `app/components/cl/ClPostForm.tsx`, one string per status — draft, pending, published, archived. The archived case had no copy of its own before and fell into the most misleading branch of the four.

It is typed `Record<ListingStatus, string>` on purpose: a fifth status cannot be added without the compiler demanding the sentence that goes with it.

**2. "Sponsor" is gone from everything a member can read.** (George, 31 Aug.)

The word carries financial and recovery meanings he does not want on a trust product, and the product already said "vouch" in half its screens while the byline said "sponsored by". The member-facing words are now **vouch for / vouched for by / vouching**. The byline reads **"Listed by Claire · vouched for by Dan"** — "vouched FOR by", never "vouched by", which reads as though the second name is the one being vouched.

**THE RENAME IS COPY-ONLY AND MUST STAY THAT WAY.** `sponsorships`, `sponsor_names`, `sponsor_id`, the RPCs and every identifier keep their names. Renaming a live schema to change a noun buys nothing a member can see and risks the byline every listing depends on. Expect both vocabularies in the same file — that is deliberate, documented in `lib/listings/byline.ts` and CLAUDE.md, and is not a job half-done.

---

## The files

**Copy (member-facing):** `lib/listings/byline.ts` · `lib/listings/card.ts` · `lib/cl/listings-read.ts` (the guest line, now "Vouched for by a member") · `lib/admin/review.ts` · `lib/applications/emails.ts` · `app/(cl)/listings/[id]/page.tsx` · `app/(cl)/members/[id]/page.tsx` · `app/(cl)/terms/page.tsx` · `app/(cl)/privacy/page.tsx` · `app/(cl)/invite/page.tsx` · `app/(cl)/join/[token]/page.tsx` · `app/(cl)/sponsor-request/[token]/page.tsx` · `app/(cl)/admin/applications/page.tsx` · `app/(cl)/admin/members/page.tsx` · `app/components/cl/ClPostForm.tsx` · `ClContactBody.tsx` · `ClInviteForm.tsx` · `ClApplicationActions.tsx` · `ClListingCard.tsx`

**Tests, already updated to match:** `scripts/test-multi-sponsor.ts` (six byline assertions) · `scripts/seed-example-listings.ts` (a comment).

**Docs:** `CLAUDE.md` (note 10 rewritten; a new voice rule) · `COMPANY/memory/decisions.md` · `COMPANY/memory/session-log.md` · `COMPANY/voice-and-copy.md` · `WORK AREAS/Product/mvp-build-project/memory.md` · `WORK AREAS/Admin-PA/*` · plus a new file, `Manhattanite_MVP-Timeline_v3.md`.

---

## Verify

1. `npm run build` — must exit 0. **This is the one thing Cowork could not do.**
2. `./node_modules/.bin/tsc --noEmit` — clean.
3. `npm run lint` — **the baseline is 4 errors project-wide, 3 in `app` + `lib`.** The fourth is in the stray `.claude/worktrees/inspiring-ardinghelli-988672/` from 20 July. Unchanged = pass. It is still worth asking George whether to prune that worktree.
4. `npm run test:multi-sponsor` — **the assertion strings were changed with the renderer, so this is the real check that the two agree.** If it fails, the disagreement is the finding; do not "fix" it by reverting the renderer.
5. `npm run audit:gates` against production — the guest anonymity assertions search guest HTML for real member names. The guest byline string changed, so confirm they still pass and are still testing what they claim to test rather than passing because a string moved.
6. **Read the four edit-screen strings on a real screen, not in the diff.** Mint a member fixture, open the edit page for a published listing and for an archived one, and confirm each reads correctly and that admin mode still suppresses the whole block.

`audit:rls` is not required — nothing here touches a policy, a function or a column. Run it if you are committing anything else alongside.

---

## Then

- **Two commits.** Code first, docs second, in the shape the repo already uses. The standing rule since the 20 July revert incident is that `COMPANY/` and `WORK AREAS/` doc changes get committed at the end of every session.
- **Push, and confirm the deploy landed.** Then check on manhattanite.com: a logged-out visitor sees "Vouched for by a member", and signed in as the founder a real byline reads "Listed by … · vouched for by …".
- **While you are signed in on production: confirm `Test - Ignore` is gone**, and that the published count is 20 rather than 21. It has been unconfirmed since the 27th and the takedown button that blocked it is fixed and deployed. If it is still there, take it down — that is one click on the edit screen now.

## Do not

- Do not rename any database column, table, RPC or identifier to match the new copy.
- Do not re-run `npm run seed:examples`.
- Do not change the edit behaviour to match the old copy. The copy was the thing that was wrong.

## Report back

Build / typecheck / lint / multi-sponsor / gates, each with its number. Whether `Test - Ignore` was already gone or you removed it. Anything you found that George should decide.
