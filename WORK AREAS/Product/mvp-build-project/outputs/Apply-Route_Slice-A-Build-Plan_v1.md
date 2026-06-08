# /apply — Slice A Build Plan (v1)

**Phase 2, Slice A.** The membership application form. A logged-in Tier 1 account fills it in; it lands as a row in a new `applications` table; you get an email ping; the applicant sees a confirmation. This is also the slice that makes the long-dead "Apply for membership" CTA live.

This plan is written to hand straight to Claude Code, same detail level as the Slice 5 / Slice 6 plans. Drafted 2026-06-08.

**Decisions locked going in** (from the three-slice sketch): Supabase-only (no Airtable), SQL-driven review (Slice B, not this slice). One refinement settled below: the form doubles as the place a real member finally sets their name.

---

## The one design call worth understanding first

The dormant `submit.ts` collected `name` + `email` from scratch (old anonymous waitlist). Now the applicant is **already logged in**, so:

- **Email** comes from the session — never typed.
- **Name + neighborhood** live on the `accounts` row already (editable since `/profile/edit`). The apply form **prefills** them and, on submit, **writes any changes back to the accounts row.**
- **Occupation, the paragraph, the sponsor reference** are application-specific — they live only on the new `applications` row.

**The quiet win:** because applying writes `name` + `neighborhood` back to `accounts`, a real member who applies will have their byline name set as a *side effect* — closing the "name not collected at signup" gap that's been open since Slice 2, for exactly the people who need it (real members about to be approved).

---

## Step 1 — Migration `0007_applications.sql`

Reuses three things already in the database: `touch_updated_at()` (0001), `is_member()` SECURITY DEFINER helper (0003), `is_admin()` SECURITY DEFINER helper (0002). No new helpers needed.

```sql
-- Migration 0007: applications table + RLS
-- Phase 2 — membership application flow (/apply Slice A)
--
-- One row per membership application. Account-bound: an application always
-- belongs to a signed-in Tier 1 account (account_id = the auth user). The
-- approve/decline transaction lands in Slice B (migration 0008); this migration
-- only creates the table, the "one open application at a time" guard, and the
-- RLS that makes the apply path safe.

-- ---------------------------------------------------------------------------
-- 1. Status enum
-- ---------------------------------------------------------------------------
create type public.application_status as enum
  ('pending', 'approved', 'declined', 'needs_info');

-- ---------------------------------------------------------------------------
-- 2. applications table
-- ---------------------------------------------------------------------------
create table public.applications (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id) on delete cascade,
  status            public.application_status not null default 'pending',
  occupation        text,
  about             text,            -- the paragraph, in their own words
  sponsor_reference text,            -- optional free text: "who sent you"
  neighborhood      text,            -- snapshot at apply time
  reviewer_note     text,            -- set on decline / needs_info (Slice B)
  reviewed_at       timestamptz,     -- set when reviewed (Slice B)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- keep updated_at fresh (reuse the 0001 helper)
create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. One OPEN application per account
-- ---------------------------------------------------------------------------
-- A partial unique index: an account can have many historical applications
-- (declined, then re-applied) but only ONE in 'pending' at a time. A second
-- insert while one is pending raises 23505 (unique_violation) — the server
-- action maps that to a friendly "we've already got yours" message.
create unique index applications_one_pending_per_account
  on public.applications (account_id)
  where status = 'pending';

-- review-queue index (Slice B reads this)
create index applications_status_created
  on public.applications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Row-Level Security — the wall
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

-- INSERT: you can only create an application for yourself, and only if you're
-- not already a member. is_member() is the SECURITY DEFINER helper from 0003,
-- so no recursion risk (this policy is on applications, not accounts, but we
-- use the helper for consistency + safety).
create policy "applications: insert own when not member"
  on public.applications
  for insert
  with check (account_id = auth.uid() and not public.is_member());

-- READ own: an applicant can see their own application + its status.
create policy "applications: read own"
  on public.applications
  for select
  using (account_id = auth.uid());

-- ADMIN read/update all — for the review queue. The Supabase SQL editor runs
-- as the postgres role (bypasses RLS entirely), so SQL-driven review in Slice B
-- doesn't strictly need these. They're here so the model is complete and an
-- /admin page can be added later with no migration. No admin exists yet
-- (founder is role='account'); these policies simply match zero rows until one does.
create policy "applications: admin reads all"
  on public.applications for select using (public.is_admin());

create policy "applications: admin updates all"
  on public.applications for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Verify with:
--   select * from public.applications;             -- empty
--   select polname, polcmd from pg_policy
--     where polrelid = 'public.applications'::regclass;   -- 4 policies
--   -- (a, r, r, w) — insert, read-own, admin-read, admin-update
-- ---------------------------------------------------------------------------
```

**Smoke test the RLS before any UI** (same discipline as Slices 4 + 6), via SQL-editor role impersonation:

1. As `authenticated` with the founder's uuid (`85ce5315-…`, currently `is_member=true`) → insert → should **fail** the `not is_member()` check.
2. Temporarily flip founder to `is_member=false` → insert → **succeeds**.
3. Second insert while one pending → **23505 unique_violation**.
4. Read as a different authenticated uuid → **0 rows** (read-own holds).
5. Clean up the test row, restore founder `is_member=true`.

---

## Step 2 — Rewrite `lib/applications/submit.ts`

Full rewrite. Drop the Airtable block entirely. Convert to the `useActionState` shape (`{ error }`) used by `createListing` and `updateProfile`. Keep a trimmed Resend ping to you.

Behavior, in order:

1. `getUser()`; no session → `redirect("/login")`.
2. Pluck + validate: `name` (2–80, required — applying is the moment we insist on a real name), `neighborhood` (≤60, required per spec), `occupation` (≤120, required), `about` (the paragraph, ≤1500, required), `sponsor_reference` (≤200, optional). Use the `pluck()` empty-string→null helper from `updateProfile`.
3. **Update the accounts row** with `name` + `neighborhood` (RLS "update own row" allows it; the `protect_account_columns` trigger ignores these two — they're not protected). This is the byline-name side effect.
4. **Insert the applications row**: `account_id = user.id`, `occupation`, `about`, `sponsor_reference`, `neighborhood` (snapshot), `status` defaults to `pending`.
   - On `error.code === "23505"` (duplicate pending) → return `{ error: "You've already applied — we're reading it. Hang tight." }` (defensive; the route also guards this).
   - On `error.code === "42501"` (RLS — somehow already a member) → `redirect("/profile")`.
   - Other error → log + return generic `{ error: "Something went wrong sending your application. Try again in a moment." }`.
5. **Resend ping to you** (best-effort, own try/catch so a mail failure never loses the application): from `Manhattanite <applications@manhattanite.com>`, to `info@manhattanite.com`, subject `New Manhattanite application: ${name}`, body with name / email (from `user.email`) / neighborhood / occupation / about / sponsor_reference. (The *applicant's* confirmation email is Slice C; this is just your heads-up.)
6. Success → `redirect("/apply")`. Because a `pending` row now exists, the route renders the confirmation state (Step 4) instead of the form. No `/thank-you` (that's the old waitlist page — leave it alone this slice).

Signature: `export async function submitApplication(_prev: SubmitApplicationState, formData: FormData): Promise<SubmitApplicationState>` with `export type SubmitApplicationState = { error: string | null }`.

---

## Step 3 — Refactor `app/components/ApplicationForm.tsx`

Keep the editorial styling system already in the file (`FIELD_BASE`, `LABEL`, `HINT`, the underline inputs, the neighborhood `optgroup` select). Changes:

- **Remove** the standalone Name and Email fields as *anonymous* fields → re-add **Name** as a prefilled field (it's required, and we write it back to the profile). **Email is gone** — it comes from the session.
- **Keep** the grouped Neighborhood select (prefill the account's current neighborhood as `defaultValue` / initial state).
- **Replace** the waitlist "Use Cases" checkbox grid + the separate "Instagram or LinkedIn" field with the spec's set: **Occupation** (text, required, "What do you do?"), **About** (textarea, required — this is "tell us who you are in your own words"), **Referred by** (the existing optional field, maps to `sponsor_reference`).
- Convert to `useActionState(submitApplication, { error: null })` and render the returned `error` inline above the button (same pattern as `NewListingForm`).
- Submit button copy: **"Apply for membership"** (CTA library — never "Submit Application"). Keep the existing `bg-park`/hover styling.
- Take the account's current `name` + `neighborhood` as props (`defaultName`, `defaultNeighborhood`) so the route can prefill from the DB.

**Form opening copy** (lift verbatim from `voice-and-copy.md`, the "Application form opening" block):
> Manhattanite is a private network. We read every application personally, so tell us who you are in your own words.
>
> The basics matter: real name, where you live in Manhattan, what you do. The rest is up to you. We're not looking for a CV.

---

## Step 4 — New route `app/apply/page.tsx`

Server Component. Gates, in order:

1. `getUser()` → null → `redirect("/login")`.
2. Read the account's own row (`name`, `neighborhood`, `is_member`) via read-own RLS.
3. If `is_member` → `redirect("/profile")` (members don't apply).
4. Query `applications` for this account, `status = 'pending'`, limit 1.
   - **If one exists** → render the **confirmation state** (no form), copy lifted verbatim from `voice-and-copy.md` "Application received — confirmation":
     > Thanks for applying.
     >
     > We read every application personally, which means it'll take a few days. We'll be in touch either way.
     >
     > In the meantime, if you know a member of Manhattanite who'd vouch for you, ask them to send a note. Sponsored applications move faster.
   - **Otherwise** → render `<ApplicationForm>` with the opening copy, `submitAction={submitApplication}`, and `defaultName` / `defaultNeighborhood` from the account row.

Keep the page chrome consistent with `/listings/new` and `/profile/edit` (same container, same page-title treatment). Page title in the interrogative-question voice those pages use — e.g. **"Tell us who you are."**

---

## Step 5 — Make the CTA live + wire entry points

- **`app/profile/page.tsx`** — uncomment the "Apply for membership →" CTA in the **Tier-1 (non-member) branch** (it's been a commented dead link since Slice 2). Point it at `/apply`. Leave the member branch ("Post a listing →") untouched.
- **Interaction gates** — anywhere a "[Apply for membership →]" link sits commented out as a dead link (the listing-detail contact gate copy in `voice-and-copy.md` references it), point it at `/apply`. Grep for `Apply for membership` and `/apply` to find the commented stubs.
- **Gating page `app/page.tsx`** — no change needed: logged-out visitors see "Create an account →"; logged-in non-members are already redirected to `/profile`, where the now-live apply CTA lives. (If you'd rather the gating page itself surface apply for logged-in non-members instead of redirecting, that's a small follow-up — flag it, don't bundle it.)

---

## Step 6 — Verify + ship

- `tsc` + `eslint` clean locally.
- **Prod test loop** (drive Chrome via MCP using the founder session; flip `is_member=false` first so the founder can actually apply):
  1. Logged-out `/apply` → 307 `/login`.
  2. Flip founder `is_member=false` (SQL editor). `/profile` now shows the Tier-1 nudge + the live "Apply for membership →" CTA.
  3. `/apply` → form renders, Name + Neighborhood **prefilled** from the account.
  4. Submit with occupation + paragraph → redirect back to `/apply` showing the **confirmation** state. Verify: one `applications` row (`status=pending`), and the account's `name`/`neighborhood` updated to match what was typed. Check `info@manhattanite.com` for the ping email.
  5. Revisit `/apply` → still the confirmation state, no second form. Attempting a duplicate insert is blocked (23505).
  6. Clean up: delete the test application row; flip founder `is_member=true`. Confirm `/apply` now redirects to `/profile`.
- **Commit** (Claude Code): `feat(apply): membership application form + applications table + RLS (Phase 2 Slice A)`. Paths: `supabase/migrations/0007_applications.sql`, `lib/applications/submit.ts`, `app/components/ApplicationForm.tsx`, `app/apply/page.tsx`, `app/profile/page.tsx`. Memory/docs land as a separate `docs:` commit, per convention.

---

## What this slice deliberately leaves for B / C

- **Approve/decline** — Slice B (`0008_approve_application.sql`, the atomic transaction). Until then, an application sits `pending` and you'd approve by the old manual `is_member` flip if you needed to.
- **Applicant confirmation email + welcome email** — Slice C. Slice A only sends *you* the ping; the applicant sees the on-page confirmation, not an email yet.
- **`/admin` page** — later polish; SQL review covers B.

## Open thread to confirm before building

- **Is `name` required at apply time?** This plan makes it **required** (you're vouching for a real person; the byline convention wants a real name). The profile editor still lets them clear it later, but you can't submit an application without one. Confirm that's the intent — it's the one spot this plan is stricter than `/profile/edit`.

---

*On greenlight: apply migration 0007 → smoke-test RLS → build the three code files → wire the CTA → run the prod loop → commit. Estimated ~1 focused session.*
