# /apply Route — Three-Slice Plan (v1)

**Phase 2 proper.** Closes the biggest open thread in the build: there is currently no real door through the Tier 1 → Tier 2 wall. Members only exist because we flip `is_member=true` by hand in SQL. This plan builds the apply → review → approve flow that lets a real person cross the wall.

Drafted 2026-06-08. Each slice ships something testable on its own.

---

## The key reframe (read this first)

The dormant `lib/applications/submit.ts` was written for the **old anonymous waitlist**: it collected name + email from scratch and wrote to Airtable + Resend. The new model is different.

By the time someone applies, they **already have a Tier 1 account and are logged in.** So:

- The application is **account-bound** — keyed to `auth.uid()`, not a free-floating email.
- Email comes from the **session**, not a typed field.
- Name / neighborhood **prefill** from their profile (the `/profile/edit` work from Slice 2 means they may already have these set).
- The destination is a **Supabase `applications` row**, not Airtable.

We keep two things from the dormant code: the **form fields** (occupation, the paragraph, optional sponsor reference) and the **Resend notification pattern** (so you get pinged when an application lands). Everything else gets rewired.

---

## Slice A — the form + application row

**Goal:** a logged-in Tier 1 account can submit a membership application. It lands as a row in a new `applications` table. You get an email. They see a confirmation.

**Database — new migration `0007_applications.sql`**

- New `applications` table: `id`, `account_id` (FK → accounts, cascade), `status` enum (`pending` / `approved` / `declined` / `needs_info`, default `pending`), `occupation`, `about` (the paragraph), `sponsor_reference` (free text — "who sent you", optional), `neighborhood` (snapshot at apply time), timestamps, plus a `reviewed_at` / `reviewer_note` for Slice B.
- **One application at a time:** a partial unique index so an account can't have two `pending` applications open at once.
- **RLS — the wall, at the database:**
  - Insert: `account_id = auth.uid()` AND the account is **not already a member** (no point applying if you're in).
  - Read-own: an applicant can see their own application status.
  - Admin-read-all / admin-update-all: reuse the `is_admin()` SECURITY DEFINER helper from migration 0002 (don't subquery accounts directly — that's the recursion bug from Slice 2).

**Code**

- `lib/applications/submit.ts` — **rewrite.** Drop the Airtable write. Keep a trimmed Resend notification to `info@manhattanite.com`. Insert the application row server-side keyed to the session user. Returns `{error}` for inline display (the `useActionState` pattern from `lib/listings/create.ts`).
- `app/components/ApplicationForm.tsx` — **refactor.** Strip the name/email fields (now from session/profile), keep occupation + paragraph + sponsor-reference + the neighborhood select. Same `FIELD_BASE` / `LABEL` / `HINT` styling so it matches the other forms.
- `app/apply/page.tsx` — **new route.** Server Component. Auth gate (no session → `/login`). If already a member → `/profile`. If a `pending` application already exists → show "we've got your application" state instead of the form. Otherwise render the form, prefilled.
- `app/profile/page.tsx` — **uncomment the `/apply` CTA.** It's been sitting commented out as a dead link since Slice 2. This is the slice that makes it live.
- `app/page.tsx` (gating page) + the interaction gates — point the "Apply for membership" CTA at `/apply`.

**Testable at the end:** Log in as a Tier 1 account → `/apply` → submit → row appears in `applications`, you get an email, applicant sees a confirmation. Re-visiting `/apply` shows the "already applied" state, not a second form.

**Open decisions for Slice A**
1. **Airtable — keep or drop?** CLAUDE.md says Airtable is transitional (sunset v1.5/v2). Cleanest is Supabase-only now. Option: dual-write to Airtable during seed so you get a friendly review grid for free. My lean: **Supabase-only**, review via Slice B. One less moving part.
2. **What does the form actually ask?** Spec says: real name, neighborhood, occupation, a paragraph, optional sponsor reference. Confirm that's still the set — anything to add or cut?

---

## Slice B — the review + approve step

**Goal:** you can approve or decline an application. Approving flips `is_member=true` and writes the sponsor FK **in one transaction**, so a half-approved state can never exist.

**The approve action is the heart of the whole flow.** Per the architecture anchor: "Approval flips `is_member` and writes the sponsor FK in one transaction." Three things happen atomically — application status → `approved`, account `is_member` → `true`, account `sponsor_id` → the approving member (George at seed).

**Two ways to build the review UI — pick one:**

- **Option 1 — SQL-driven (v1, recommended).** A documented, repeatable `approve_application(app_id, sponsor_id)` Postgres function (SECURITY DEFINER) that does the three-way transaction. You review the pending queue with a saved SQL query and call the function to approve. Zero new UI. Matches how members are made today, just safe and atomic instead of a manual `is_member` flip. **~1 session.**
- **Option 2 — minimal `/admin` page.** A gated Server Component listing pending applications with approve/decline buttons that call the function above. Nicer, but it's real UI + admin RLS surface + its own testing. **Pushes the slice toward ~2 sessions.**

My lean: **build the `approve_application()` function regardless** (it's the load-bearing part), ship Slice B as SQL-driven, and treat the `/admin` page as a later polish slice once you've actually run a few approvals by hand and know what the queue needs.

**Database — migration `0008_approve_application.sql`**

- `approve_application(application_id uuid, sponsor_id uuid)` — the atomic transaction. Guards: app must be `pending`, account must not already be a member.
- `decline_application(application_id uuid, note text)` — sets status `declined`, leaves the account at Tier 1.
- `request_more_info(application_id uuid, note text)` — sets status `needs_info` (the back-and-forth outcome from the spec).

**Testable at the end:** Take the pending application from Slice A. Run `approve_application(...)`. Verify in one step: application is `approved`, the account is now `is_member=true`, `sponsor_id` is set, and that member can now reach `/listings/new` (the gate from Slice 5 now lets them through). Decline path leaves a different test account at Tier 1.

**Open decisions for Slice B**
1. **SQL-driven vs `/admin` page** (above). Lean: SQL now, page later.
2. **Sponsor at seed** = George by default. Confirm the approve function should default `sponsor_id` to George's account unless you pass someone else.

---

## Slice C — email notifications

**Goal:** the human-facing emails that make the flow feel real. Applicant gets a confirmation on submit and a welcome on approval; you get a review ping.

**Three emails, all via Resend (already wired, domain verified):**

1. **Applicant confirmation** — on submit. "We've got your application." Sent from `applications@manhattanite.com`. (Slice A already pings *you*; this is the *applicant's* copy.)
2. **Reviewer ping** — to `info@manhattanite.com` on submit. This is the trimmed Resend notification carried over from the dormant code — lands in Slice A, refined here.
3. **Welcome / approved** — fired by the approve path. "You're in." Per the spec: *"Approval triggers welcome email and member status flip."* This is the one that matters most for the brand moment.

**Code**

- A small `lib/applications/emails.ts` with the three templated sends, in Manhattanite voice (open `COMPANY/voice-and-copy.md` first — American spelling, Soho House register, no generic transactional language).
- The approve function in Slice B is SQL; the welcome email is a Node-side send, so the trigger is: approve via the action layer (a thin server action wrapping the SQL function) → on success, fire the welcome email. Keeps email out of the database trigger.

**Testable at the end:** Full happy path end to end — visit → account → `/apply` → confirmation email → you approve → welcome email → that account can now post. The single happy path the spec names as the v1 success criterion: *"visit → account → browse → apply → approved → post."*

**Open decisions for Slice C**
1. **Decline email — send one or stay silent?** Spec doesn't require it. A gentle "not right now" is kinder than silence but invites a reply you'll have to handle. Lean: **no decline email at seed**, revisit later.
2. **Copy pass** — each email wants a real draft against the voice guide. Worth doing as a parallel content lane while the code lands (the same split that worked in the Slice 2 session).

---

## The whole shape, at a glance

| Slice | Ships | DB | Effort | Testable outcome |
|---|---|---|---|---|
| **A** | `/apply` form → application row | `0007_applications.sql` | ~1 session | Tier 1 account submits, row lands, you're emailed |
| **B** | approve/decline (atomic) | `0008_approve_application.sql` | ~1 session (SQL-driven) | Approving makes a real member who can post |
| **C** | the three emails | none | ~½–1 session | Full visit → apply → approved → post happy path |

**Total: ~2–3 sessions**, matching the original estimate.

## Things that stay out of these three slices

- `/admin` review **page** (SQL-driven review covers v1; page is later polish).
- Sponsorship **request** flow ("ask Anna to sponsor me") — explicitly v2 in the spec.
- Email **change** flow — separate Supabase Auth concern, unrelated.
- Replacing the fake `John Robinson` byline placeholder — happens naturally once a real approval creates a real sponsor relationship.

## The honest caveat (unchanged)

This flow collects real personal data — names, neighborhoods, occupations. Your **Tier 1 legal items** (entity formation, TOS, privacy policy, founder identity exposure) are still open and still block any *public* go-live. For seed-phase, advisor demos, and friend tests this is fine. But the lawyer engagement is the gate between "working demo" and "real people I don't know." Naming it here so it doesn't get lost in the build momentum.

---

*Next step if you greenlight: I write the full Slice A build plan (the level of detail the Slice 5/6 plans had — exact files, migration SQL, RLS policies, the test loop) and we run it.*
