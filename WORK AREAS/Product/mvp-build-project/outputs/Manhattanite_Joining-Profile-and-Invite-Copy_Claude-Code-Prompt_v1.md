# Claude Code prompt — the joining profile, the invitation copy, and the profile-page footer

**Written by Cowork, 2026-09-08, after George walked the invitation path end to end on production for the first time.** All edits are ON DISK and unpushed. `tsc --noEmit` is clean outside `_to_delete/`; `eslint app lib scripts` reports **4 errors — the baseline, unmoved, none in the touched files.**

Your job: verify, build, run the audits, commit and push. No migration is involved — every column written already exists on `accounts`.

## What changed and why

Four asks from George, taken off the live site during the walk. Two of them are one change.

### 1. `lib/applications/emails.ts` — the invitation email copy

The live copy described the mechanism as a **feature** ("everyone is brought in by someone who already belongs") when the finalised pitch of 2026-09-02 turned deliberately on describing it as a **consequence**. It also never said what the site is, and repeated the inviter's name three times in three lines.

**The consequence line says "gets looked at too", not "is removed".** The spoken pitch says "you're both out"; `/terms` says the members who vouched for you are *assessed* the same way (George, 2026-09-04). This is written copy, so it matches the Terms and not the pitch. If the Terms change, change this in the same commit.

HTML and plain-text bodies both rewritten; they must stay identical in substance.

### 2 + 3. The "Request access" form becomes the joining profile

George: *"Get rid of the request access form"* and *"when someone becomes a member through the link, they should be prompted to fill out the profile information so it's more than just their name and email."* These are the same change — the form is not deleted, it is repointed.

- **`app/components/cl/ClApplyForm.tsx`** — the "Who's vouching for you" field is GONE. It asked a person who had been vouched for four minutes earlier to name who vouched for them, and it was decorative anyway: the sponsor is derived server-side from the invite (`inviter_for_me`) and never from that input. **A LinkedIn field takes its place.** Button is "Finish and send"; the footnote promises the confirmation email.
- **`lib/applications/submit.ts`** — now writes `bio` (the paragraph) and `linkedin_url` to the `accounts` row alongside `name` and `neighborhood`. **This is the actual fix for ask 3.** The paragraph previously lived only on the `applications` row, so an approved member arrived on the network as a name and an email, and `/members/[id]` had nothing to show. Both columns already exist; both are unprotected by the `protect_account_columns` trigger (0001), and "accounts: update own row" is the policy.
- **LinkedIn is validated server-side against a `linkedin.com` host.** `/members/[id]` already refuses to render anything else — a value that silently never appears is worse than one refused at the door, because the person who typed it believes it is on their profile.
- **`app/components/cl/ClAccess.tsx`** — "Request access / A member has to vouch for you" becomes "Finish your profile / You've been vouched for." The pending state becomes "Your membership is being reviewed", promising the email. **George kept his approval step** (answered explicitly this session): profile in, then reviewed, then an email.

**A DORMANT FLOW TO KNOW ABOUT, flagged not fixed.** Dropping `sponsor_reference` means `request_sponsorship` (0025) never fires and `/sponsor-request/[token]` has no way to be reached. Nothing was deleted — the action's block is simply guarded on a value that is now always null, so restoring the field restores the flow. **This is the fifth screen in this product to lose its only entry point (CLAUDE.md note 8), which is why it is written down here rather than discovered in three weeks.**

### 4. `app/(cl)/profile/page.tsx` — the account-closure paragraph

George: *"get rid of the copy underneath sign out and just put that somewhere tucked at the bottom neatly."* It sat directly under the Sign out button, making deletion the loudest thing on the page. **Moved to the bottom of the page, smaller and quieter — not deleted.** `/terms` and `/privacy` both promise this email route, so removing it would leave the policy overclaiming (the same error corrected on `/privacy` on 26 Aug). `id="leaving"` is preserved so old `/profile#leaving` links still land.

## What to verify

1. `npm run build` — clean.
2. `npm run audit:gates` against a **warm** dev server — a cold one reports false 404s. The guest name-leak assertions and `checkNotInForm()` must stay green. **Never delete those assertions.**
3. `npm run audit:rls` — 59/59, prod state identical before and after.
4. **Drive the real form, do not read the diff.** The two bugs of 27 August were both "a form control that renders but the server action never reads", and this change adds a field and removes a field on the same form. Submit the joining profile as a real Tier-1 account and confirm on the row that `bio` and `linkedin_url` landed on `accounts`, not just on `applications`.
5. Check the LinkedIn refusals: a non-LinkedIn URL and a malformed one must both return the inline error, and blank must still save.
6. `/profile` at 390px and desktop — the closure paragraph reads as a footer, not as a section.

## Commit

Two commits, or one with a clear message. Suggested subject for the pair:

> The invitation says what happens, and joining builds a profile

