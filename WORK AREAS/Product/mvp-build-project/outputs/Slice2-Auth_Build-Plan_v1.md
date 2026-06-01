# Slice 2 — Email + Password Auth · Two-Hour Build Plan

*Prepared 2026-05-27 for tomorrow's Manhattanite work block. Built in the Code tab. Source of truth: `COMPANY/tech-architecture.md` (schema) and `COMPANY/voice-and-copy.md` (UI strings).*

> **Change of direction (2026-05-27):** George chose **email + password** auth instead of magic link, including a **forgot-password reset flow** — "just what I want for now." This overrides the magic-link lock-in in `tech-architecture.md`. Treated as a for-now decision, revisitable later. See note at the bottom for the trade-off.

---

## The goal of this block

By the end of two hours, a real person can create an account with an email and password, log in, and land on their own `/profile` — and if they forget their password, request a reset link by email. That is the moment the two-tier wall stops being a diagram and starts being real: every account that logs in is a row in the database with a role.

Slice 1 already proved the app can talk to Supabase. This slice makes accounts and login real on top of it.

*Plain English on two terms you'll see:*
- **RLS (Row-Level Security)** = a rule living inside the database that decides which rows each logged-in person can see. It's what makes the Account-vs-Member wall unbreakable, not just hidden in the page.
- **Reset flow** = the "forgot password" round-trip: enter email → get a link → set a new password.

---

## Before you start — two 2-minute settings decisions

Both live in Supabase → Authentication settings. Deciding now avoids mid-build detours:

1. **Email confirmation on signup — turn it OFF for now.** By default Supabase makes new accounts confirm their email before they can log in. That's an extra email step that'll slow your test loop today. Toggle it off so you can sign up and immediately log in while building. (You can turn it back on before real members arrive — note it as a follow-up.)

2. **How reset emails get sent — use Supabase's built-in sender for this block.** The forgot-password flow emails a link, so it needs an email sender. Supabase's built-in one works with zero setup; the catch is a generic from-address and free-tier rate limits — fine for testing with your own email. Wiring Resend for a real `manhattanite.com` from-address is a polish step for later, and it's the single most likely thing to swallow your two hours. Skip it today.

---

## The two-hour timeline

This is a full plate for 120 minutes. The reset flow is the stretch — if anything slips, it's the first to move to next session (see cut-order).

### Block 1 — Database foundation (0:00–0:30)

Create the `accounts` table and its security rules. This is the spine everything hangs off.

- Create the `accounts` table per the locked schema: `id`, `email` (unique), `name`, `neighborhood`, `bio`, `role` (enum: `account` / `member` / `admin`), `is_member` (bool), `sponsor_id` (nullable FK to another account), `created_at`, `updated_at`.
- Add a **trigger** so that when Supabase Auth creates a new login, a matching `accounts` row is auto-created with role `account`. (A trigger = code the database runs automatically on an event — here, "new user signs up → make their account row.")
- Turn **RLS on** for `accounts` and add policies: a logged-in person can read and update *their own* row; nobody can read anyone else's member-only fields; admin (you) can read all.
- Save this as a versioned SQL migration file in the repo, not just dashboard clicks — so the schema is reproducible.

*Done when:* the table exists, RLS is on, and a manually-created test row behaves correctly.

### Block 2 — Signup + login (0:30–1:10)

The heart of the slice.

- **`/signup` page** — email + password fields. Submitting calls Supabase Auth `signUp`. On success, the trigger creates the `accounts` row; redirect to `/profile`.
- **`/login` page** — email + password fields. Submitting calls `signInWithPassword`, sets the session cookie, redirects to `/profile`.
- **Middleware** — refreshes the session on every request so people stay logged in (Supabase's Next.js SSR pattern; the cookie adapter you stubbed in Slice 1 is ready for this).
- Show a clean error when login fails (wrong password / no such account).

*Done when:* you can create an account, get logged in, and log back in with the same credentials.

### Block 3 — Profile page (1:10–1:30)

- **`/profile`** — a Server Component that reads the signed-in account's own row and shows name, neighborhood, bio. Empty on first signup → show the bio prompt copy below.
- A logged-out visitor hitting `/profile` gets bounced to `/login`.

*Done when:* `/profile` shows *your* account, and logged-out users can't reach it.

### Block 4 — Forgot-password reset flow (1:30–1:55) — the stretch

Three small pieces:

- **`/reset-request` page** — enter email → calls Supabase `resetPasswordForEmail`, which emails a recovery link.
- **`/auth/callback` (or `/reset-password`) handler** — catches the link click, establishes a recovery session.
- **`/reset-password` page** — new-password field → calls `updateUser` to set it → redirect to `/login`.
- Add a "Forgot password?" link on `/login`.

*Done when:* you click "Forgot password?", get the email, set a new password, and log in with it.

### Block 5 — Commit + verify (1:55–2:00)

- Commit (e.g. `feat(auth): email+password login, signup, reset + accounts table + RLS (Phase 1 Slice 2)`), push to `main`, let Vercel deploy.
- Test the full loop on the live site.
- Update memory files (`mvp-build-project/memory.md` + `COMPANY/memory.md` quick state), and note the magic-link → password change in `COMPANY/memory/decisions.md`.

---

## What "done" looks like (finish line)

A real visitor goes to `manhattanite.com/signup`, creates an account with email + password, lands on `/profile` logged in — with a row in `accounts` and RLS enforcing they only see their own data. They can log out, log back in, and recover a forgotten password by email. All committed and live.

## If time runs short — cut in this order

Protect the trust layer; cut polish from the bottom up:
1. **First to cut:** the reset flow (Block 4). Signup + login + RLS is a complete, bankable win on its own; reset can be next session.
2. **Next:** `/profile` styling — an unstyled page that proves login works is enough.
3. **Never cut:** the `accounts` table + RLS. A login without RLS is a broken wall, not a shortcut.

## One thing to watch

Don't get pulled into wiring Resend for a real from-address today, and don't leave email confirmation on during the build — either one will quietly eat your two hours. Built-in sender + confirmation-off gets you a fast test loop; polish both later.

---

## Copy to use (from `voice-and-copy.md` — don't write new strings)

**`/signup`** — gating-page framing (American spelling throughout):
> Manhattanite is a private marketplace for New Yorkers. Create a free account to browse the network. To post a listing or contact a member, you'll need to be approved.
>
> **[Create an account →]**

**`/login`** — quiet, functional ("inside the product" tone). Add a small **Forgot password?** link.

**`/reset-request`**:
> Enter your email and we'll send you a link to set a new password.

**`/profile` bio prompt** (empty-bio first-login state):
> Tell members who you are in a sentence or two. Where you live, what you do, what you're into. Real names only.

CTA rules: "Create an account" / "Apply for membership" — never "Sign up" or "Register". Even though the route is `/signup`, the button text stays on-brand.

---

## The trade-off, recorded honestly

Magic link was locked because it means no passwords to manage and no reset flow to build or support. Going to passwords adds the reset flow (built today), a future "email confirmation" decision, and the ongoing reality that members can lock themselves out. That's the cost of the choice. It's a legitimate "for now" call — just flagged so future-you remembers why the docs say magic link and the build says password.

---

## Why this is the right use of the block

This slice touches every key piece of the stack in one sitting — Supabase Auth, the schema, RLS, Next.js route handlers, middleware, email, and a deploy — and produces a visible, demonstrable win. It's the unlock for everything downstream: the application flow (Tier 1 → Tier 2), profiles, and listings all assume a logged-in account exists. Nothing else in Phase 1 can start until login is real.
