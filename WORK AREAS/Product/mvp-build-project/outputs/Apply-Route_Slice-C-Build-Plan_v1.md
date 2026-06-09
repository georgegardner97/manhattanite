# /apply Slice C — Build Plan (v1)

**Hand-to-Claude-Code plan for the three membership emails.** Same level of detail as the Slice 5/6 plans: exact files, the copy mapping, the one real architectural decision, the test loop, the commit. Copy source of truth is `outputs/Manhattanite_Apply-Emails_v1.md` (already drafted + voice-tested).

Drafted 2026-06-08. **End of this slice = the agreed walkthrough checkpoint** (preferences.md). When it ships, the full visit → account → browse → apply → approved → post loop works for the first time.

---

## What ships

Three emails, all via Resend (already wired in `submit.ts`, domain verified):

1. **Applicant confirmation** — on submit, to the applicant. *New send.*
2. **Reviewer ping** — on submit, to `info@manhattanite.com`. *Already sending since Slice A; this refines it and moves it into the shared module.*
3. **Welcome / "You're in."** — on approval, to the new member. *New send. The brand moment.*

No decline email, no `needs_info` email (locked decisions — see the copy doc).

---

## The one decision to make first (read this before building)

**The problem:** approval today is a raw SQL call (`select public.approve_application('<id>')`) run in the Supabase SQL editor. The welcome email is a Node-side Resend send. A `SECURITY DEFINER` SQL function can't (and shouldn't) reach out to Resend. So "fire the welcome on approval" needs an **action layer** around the SQL — something in Node that calls approve, then sends the email.

There's no `/admin` page (deferred), so the action layer isn't a web route. The lowest-infra option that still fires the email reliably:

**→ Recommended: a small CLI script, `scripts/approve-application.ts`, run from the Claude Code terminal as `npm run approve -- <application-id> [sponsor-id]`.**

It does three things in order:
1. Calls `approve_application(app_id, sponsor_id)` against the database (privileged connection — see prerequisite below).
2. Reads the now-approved account's `email` + `name` from `public.accounts`.
3. Sends the welcome email via Resend.

This **replaces the raw SQL call as the approval path** — same idea, same seed-phase "no UI" spirit, but the welcome email rides along automatically. Raw SQL stays available as a fallback (it just won't send the welcome).

**Alternatives considered (and why not, for seed):**
- *Supabase Edge Function + DB webhook on `status → approved`* — fully automatic, but it's a whole new deploy surface and secret store. Overkill at founder-only volume.
- *A protected `/admin` server action* — that's the deferred `/admin` page by another name. Later polish.

**This is the only open call in the slice.** My lean is the script. If George would rather keep approval as pure SQL and send the welcome by hand for now, that's a valid (lazier) v1 — say so and I'll cut the script from the plan.

### Prerequisite if we build the script

The approve functions are `SECURITY DEFINER` and `revoke all ... from public`, so the **anon key can't call them**. The script needs a privileged connection. Two ways — Claude Code picks during the build:
- **Service-role key via supabase-js `rpc()`** — add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (from Supabase → Project Settings → API). May also need a one-line `grant execute on function ... to service_role;` since the `revoke from public` stripped the default grant.
- **Direct Postgres connection via `pg`** — add the pooled connection string as `SUPABASE_DB_URL`, connect as the same role the SQL editor uses. No grant change needed (mirrors exactly how it's approved today).

Either way: **a new secret goes in `.env.local` (gitignored) only — never committed.** Flag to George that he'll paste one value from the Supabase dashboard.

---

## File-by-file

### 1. `lib/applications/emails.ts` — new shared module

Three exported async functions, each wrapping `resend.emails.send`. Instantiate Resend once (`new Resend(process.env.RESEND_API_KEY)`). Each returns `void` and is best-effort — callers wrap in their own try/catch so a mail failure never breaks the underlying action (the same discipline already in `submit.ts`).

```
sendApplicantConfirmation({ to }: { to: string }): Promise<void>
sendReviewerPing({ applicantName, email, neighborhood, occupation, about, sponsorReference, applicationId }): Promise<void>
sendMemberWelcome({ to }: { to: string }): Promise<void>
```

Copy maps verbatim from `Manhattanite_Apply-Emails_v1.md`:

- **`sendApplicantConfirmation`** — from `Manhattanite <applications@manhattanite.com>`, subject `We've got your application.`, body = the three-line confirmation. No dynamic fields.
- **`sendReviewerPing`** — to `info@manhattanite.com`, subject `New membership application — ${applicantName}`. Body = neighborhood / occupation / brought-in-by / the about paragraph (`\n`→`<br/>`) + the action block. **Action-block reconciliation:** since approval now runs through the script, the block recommends `npm run approve -- <id>` as the path that sends the welcome, and keeps the raw `select public.approve_application('<id>');` as the no-email fallback. (This is the one place the shipped copy diverges one line from the copy doc — note it back into the doc after build.)
- **`sendMemberWelcome`** — from `Manhattanite <applications@manhattanite.com>`, subject `You're in.`, body = the welcome block, CTA `Browse listings →` linking to `https://manhattanite.com/listings`. No dynamic fields.

All three: simple inline-styled HTML, American spelling, no generic transactional chrome ("This is an automated message…"). Keep them plain and editorial — they're short enough that a heavy template would fight the voice.

### 2. `lib/applications/submit.ts` — wire the two on-submit sends

The reviewer ping is currently inline in `submit.ts` (lines ~154–175). Replace that inline block with calls to the new module:

- After the successful insert, fire **both** `sendApplicantConfirmation({ to: user.email })` **and** `sendReviewerPing({ … })`, each in its own try/catch (or one try wrapping both — but don't let the applicant confirmation failing skip the reviewer ping or vice versa; separate awaits, separate catches).
- Pass the already-validated `name`, `neighborhood`, `occupation`, `about`, `sponsorReference`, `user.email`, and the inserted row's `id`. **The insert must now return the id** — change the insert to `.insert({…}).select('id').single()` so the ping can embed the application id. (Today it inserts without selecting.)
- Delete the inline Resend instantiation + HTML from `submit.ts` — it now lives in the module.

### 3. `scripts/approve-application.ts` — new (if we build the script path)

A plain Node/TS script:
1. Read `process.argv` for `<application-id>` (required) and `<sponsor-id>` (optional).
2. Call `approve_application` via the privileged connection (mechanism per the prerequisite decision). Surface the Postgres `raise exception` messages cleanly (already a member / not pending / sponsor not a member) so a bad call reads as a clear line, not a stack trace.
3. On success, read `email`, `name` from `public.accounts where id = <the approved account>`.
4. `await sendMemberWelcome({ to: email })`.
5. Log `Approved <name> (<email>) — welcome email sent.`

Add to `package.json`: `"approve": "tsx scripts/approve-application.ts"` (or `node --import tsx`). `tsx` is a one-line devDependency add if it's not already present.

### 4. `app/apply/page.tsx` — no change expected

The on-page confirmation state already exists from Slice A. The confirmation *email* is additive; the page copy stays. (Quick read to confirm no duplicated "we emailed you" claim needs adding — optional nicety, not required.)

---

## Test loop (on prod, mirrors the Slice A/B loops)

Same synthetic-applicant pattern used to test Slice B:

1. **Confirmation + ping:** flip founder `is_member=false`, go to `/apply`, submit. Verify **two** emails land: the applicant confirmation (to the founder's address) and the reviewer ping (to info@) with the right details and the `npm run approve` line. Confirm the `applications` row is `pending` and carries the id shown in the ping.
2. **Welcome:** run `npm run approve -- <that-id>`. Verify in one step: application `approved`, account `is_member=true`, `sponsor_id` = founder, **and the "You're in." welcome email lands**. Confirm the member can now reach `/listings/new` (the Slice 5 gate lets them through).
3. **Cleanup:** restore `is_member=true`, `sponsor_id=null`, delete the test application row (or the whole synthetic `auth.users` row if a synthetic applicant was used, which cascades). Final check: 0 applications, founder untouched.
4. `tsc` + `eslint` clean on the changed files before commit.

---

## Commit

Two logical commits (or one if you prefer):
- `feat(apply): membership emails — confirmation, reviewer ping, welcome (Phase 2 Slice C)` — `lib/applications/emails.ts`, `lib/applications/submit.ts`, `scripts/approve-application.ts`, `package.json`.
- `docs: Slice C copy + build plan + memory` — the two outputs docs + memory + output-log.

`.env.local` change (the new secret) is **not** committed — it's gitignored. Note it to George as a manual paste-in step before the test loop.

---

## Open threads after this slice

- **Reconcile the one-line copy divergence** back into `Manhattanite_Apply-Emails_v1.md` (the ping's action block now leads with `npm run approve`).
- **No decline / needs_info email** — still silent by decision. Build later if the back-and-forth gets real.
- **Approval is still founder-only / terminal-driven** — fine for seed. The `/admin` page (when it lands) folds the script's logic into a gated server action.
- **Then: the walkthrough checkpoint.** Caveats to repeat: landing page (Phase 1.5 pending) + thin content (2 listings, no real photos, placeholder `John Robinson` sponsor) still look unfinished — the "looks real" checkpoint is after seed listings + photos load.

---

*Drafted 2026-06-08. Build lane is [Claude Code]. When the three sends are wired and the loop tests clean, Slice C ships and we run the walkthrough.*
