# Claude Code prompt — finish the takedown (redirect after archive)

---

George, 15 Sep 2026: *"Can we make it so when you click to take a listing down and then you select a reason why, it just takes it down for you rather than taking you back to the listing edit page for you to then 'confirm changes' to take the listing down."*

**The takedown already works. This is a missing redirect, not a broken write.** Production has proof: the Ceccotti walnut dining table is `archived` with `outcome = 'found_elsewhere'`, recorded by George pressing one of the four buttons. The row is written, the outcome is stored, the revalidation fires. What never happens is anything that tells the member it worked.

## The cause

`archiveListing` in `lib/listings/archive.ts` ends with `return { error: null }` and this comment:

```
// No redirect: the caller (the My Listings row) re-renders and the listing
// is simply gone — that's the confirmation.
```

That was true when the control lived on the My Listings row. **It is false now.** `ClRemoveListing` is rendered by `ClPostForm` on the *edit screen*, so after a successful archive the member is left sitting on an edit form. `ClPostForm`'s `initial!.status !== "archived"` guard removes the "Take it down" block, so the only thing left on screen is the edit form and its "Confirm changes" button. A member reasonably concludes the takedown has not happened and presses it.

**Pressing it is harmless but that is luck, not design.** `update.ts` deliberately excludes `status` from its write set, so confirming changes on an archived listing does not un-archive it. The member still gets no confirmation either way.

## The fix

After the successful update, and after the three `revalidatePath` calls and `updateTag("listings")`, redirect to `/listings/mine`.

`/listings/mine` is the right destination and not an arbitrary one: it already renders archived listings as compact rows under their own "Archived" heading (`ClArchivedRow`). So the member watches the listing move from the active section into Archived. That *is* the confirmation, and it is a truer one than a toast, because it shows the listing still exists rather than implying it was deleted.

Notes for the implementation:

- `redirect()` throws, so it must sit outside any `try`/`catch` and after every side effect. `next/navigation` is already imported in this file for the unauthenticated case.
- The error paths must still `return { error }` as they do now. Only the success path redirects.
- `useActionState` handles a redirecting action correctly; no change needed in `ClRemoveListing`.
- The "Taking it down…" pending state stays. It now reads as accurate rather than as a state that never resolves.

## Check the copy while you are in there

`ClRemoveListing`'s confirm step says "Whichever you pick takes it down." That sentence was written to compensate for the missing confirmation. With a redirect in place it may now be reassurance the member no longer needs. Read it on the real screen and cut it if it has become noise. Do not cut it blind.

## Do not fix the draft bug in this change

A member cannot take down a `draft` listing at all: the 0017 trigger answers 42501 whether or not an outcome is sent, and the control still renders on a returned draft, so a member can pick a reason and get a generic error. That predates the outcome work and is recorded in the 2 Sep docs commit as a deliberate hold, because whether withdrawing a moderator-returned draft should be allowed is a product decision for George, not a patch. **Leave it. Mention it in your report so it stays visible.**

## Verify

- `next build` exits 0, `tsc --noEmit` clean.
- `eslint` — the baseline is **5 errors**, not 4. Report the count and whether it moved.
- `npm run test:edit-archive` — this is the guard that holds the nested-form rule that cost a fortnight. It must stay green.
- `npm run audit:gates`.
- **Drive the real form in a real browser, signed in as a real member, as the last change to this file was verified.** Create a fixture listing, take it down with one of the four buttons, and confirm three things: the browser lands on `/listings/mine`, the listing appears under Archived, and the row's `outcome` column holds the value for the button pressed. Repeat once from a `pending` listing, which takes the single-button path and must write null and still redirect. Tear the fixtures down.

## Before you finish, tell George this

**There are no published listings on manhattanite.com.** All three rows in production are archived, and invitations have gone out (five accounts, two members). Anyone arriving at the site right now sees an empty board. That is not caused by this change and is not yours to fix, but it should be the first line of your report, above anything about the redirect.

Commit code and docs separately, push, confirm against manhattanite.com, and log to all four memory files.
