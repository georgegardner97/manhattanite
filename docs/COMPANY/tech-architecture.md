# Tech Architecture — Manhattanite

The stack, the data model, and the operational scaffolding for v1. Confirmed as of 2026-05-16. This file is the source of truth for build decisions.

Works with `mvp-spec.md` (what we're building) and `product-vision.md` (why).

Plain-English notes throughout for non-technical reading. If anything here turns out to be wrong in build, fix in code first, then update this file.

---

## Stack — confirmed

| Layer | Choice | What it does, in plain English |
|---|---|---|
| Frontend framework | **Next.js** (App Router) | The framework the website is written in. Most-used, most-documented, most-Claude-friendly. |
| Hosting | **Vercel** | Where the website lives. Push code, it goes live. Free at MVP scale. |
| Database, auth, file storage | **Supabase** | The backend. Stores accounts, listings, photos. Handles login. One service instead of three. |
| Email (transactional) | **Resend** | Sends invite emails, application receipts, listing notifications. |
| Image handling | **Supabase Storage + Next.js Image** | Where listing photos live. Automatic resizing for fast page loads. |
| Domain / DNS | **Cloudflare** | Where the manhattanite.com (or chosen domain) name is managed. Free SSL. |
| Analytics | **Plausible** | Privacy-first page-view stats. No cookies, no creep factor. Brand-aligned. |
| Error monitoring | **Sentry (free tier)** | Catches bugs in production before members report them. |
| Code hosting | **GitHub** | Where the code lives. Free for private repos. |
| Payments (v2 only) | **Stripe** | For pay-per-post in v2. Not built in v1. |

**Total monthly cost at MVP scale:** ~$9 (Plausible) + ~$1/month amortized domain = **~$10/month**, all-in. Everything else on free tiers.

## Lock-ins — the once-decided decisions

Locked at MVP. Don't revisit unless something serious breaks.

### Auth: email + magic link

Members log in with their email. They get a one-click sign-in link via Resend. No passwords to manage, no password-reset flow to build, no "forgot password" support tickets. Matches the editorial feel. Supabase handles the mechanics.

### Single canonical sponsor per member

Every member has one sponsor (foreign key to another member). During seed phase, sponsor defaults to George's account. Clean, no special-case logic. Sponsor is permanent and public on the member's profile.

### Application is a row with status

An application is its own database row with one of four statuses: `pending`, `approved`, `declined`, `needs_info`. When George approves, the system flips the corresponding account's `is_member` flag to true and writes the sponsor FK. No separate "approval" table — the application row IS the record.

### Three roles only

- `account` — can browse, apply, view profiles
- `member` — can post, contact, sponsor
- `admin` — George, plus any future co-reviewer

Roles are a column on the accounts table. No role-explosion. Promotions are admin actions.

### Listings: one table with a type column and a flexible details field

Single `listings` table with a `type` enum (`apartment` or `furniture` in v1, expandable later). Common fields (title, price, neighborhood, posted_by, status, created_at) sit on the main table. Type-specific fields (beds, available_from for apartments; condition, category for furniture) sit in a JSON `details` column. Simple schema, easy to extend, fits Claude Code's build flow.

### 8 photos per listing

Cap at 8. Stored in Supabase Storage. Resized on the fly by Next.js `<Image>`. Tunable later.

### Contact-form messaging, not in-product inbox

When a member clicks "Contact" on a listing, they fill a form. The form POSTs to a Next.js API route, which uses Resend to email the listing owner. A row is logged in `listing_contacts` for moderation history. No real-time chat, no inbox UI.

### Row-Level Security on every member-only table

This is the critical security primitive of the two-tier model. Supabase enforces it at the database layer. Account holders' queries cannot return member-only data (contact details, sponsor names that haven't been approved, etc.). This is what makes the wall between Tier 1 and Tier 2 real, not just UI-deep.

**Plain English: without RLS, a clever account holder could fetch member data via the API even though the UI hides it. With RLS, the database itself refuses to serve that data. Non-negotiable.**

---

## Data model — v1

Six core tables. Fields listed are the minimum. Will be expanded in build.

### `accounts`

- `id` (uuid, primary key)
- `email` (unique)
- `name`
- `neighborhood`
- `bio` (optional)
- `role` (enum: `account` | `member` | `admin`)
- `is_member` (bool, derived from role but cached for fast queries)
- `sponsor_id` (FK to another account, nullable — null until approved as member)
- `created_at`, `updated_at`

### `applications`

- `id`
- `account_id` (FK to accounts)
- `paragraph` (the applicant's freeform paragraph)
- `proposed_sponsor_id` (FK to an account, optional)
- `status` (enum: `pending` | `approved` | `declined` | `needs_info`)
- `reviewed_by` (FK to accounts, set on approval/decline)
- `reviewer_note` (internal note from reviewer)
- `submitted_at`, `reviewed_at`

### `listings`

- `id`
- `posted_by` (FK to accounts; must be a member, enforced by RLS)
- `type` (enum: `apartment` | `furniture`)
- `title`
- `price` (integer, cents)
- `neighborhood`
- `description`
- `status` (enum: `pending_review` | `live` | `removed` | `archived`)
- `details` (JSON — type-specific fields: beds, available_from, condition, etc.)
- `created_at`, `updated_at`, `removed_at`

### `listing_photos`

- `id`
- `listing_id` (FK)
- `storage_path` (Supabase Storage reference)
- `position` (ordering)
- `created_at`

### `listing_contacts`

- `id`
- `listing_id` (FK)
- `from_account_id` (FK to accounts)
- `message` (the form text)
- `sent_at`

### `sponsorships`

- `id`
- `sponsor_id` (FK, the existing member)
- `sponsored_id` (FK, the new member)
- `created_at` (= approval date)
- `status` (enum: `active` | `removed` — for member-removal cases)

Sponsorships are their own table (not just a FK on accounts) so we can query "everyone Anna sponsored" cleanly and track sponsor-accountability state from `trust-and-moderation.md`.

---

## Auth flow, in five steps

1. Visitor enters email on `/login` (or `/join`)
2. Supabase Auth sends a magic link via Resend
3. Visitor clicks link → returned to site logged in
4. If first time: `accounts` row created with role `account`
5. If already a member: role/sponsor info loaded, dashboard shown

The application path (Tier 1 → Tier 2) is a separate flow inside an authenticated session. Apply for membership is a form that creates an `applications` row.

---

## Deployment flow

- **Code lives on GitHub** in a private repo.
- **Local dev** via Claude Code on George's machine (or via the Cowork sandbox).
- **Every push to `main`** triggers a Vercel preview deploy at a unique URL.
- **Promotion to production** is a manual click in the Vercel dashboard (or merging a labeled PR — to decide during week 1).
- **Database migrations** via Supabase migrations: SQL files versioned in the repo, applied via Supabase CLI.

No staging environment in v1. Vercel previews are good enough for the seed phase.

## Backups

- **Supabase free tier**: daily backups retained 7 days
- **At cohort 1** (real listings, real members): upgrade to Supabase Pro ($25/month) for daily backups retained 30 days + point-in-time recovery
- **Manual snapshot** of the production database before any schema migration

## Domains and naming

- Domain registrar: **Cloudflare Registrar** (preferred — no markup, free privacy)
- DNS: same provider (Cloudflare)
- Primary domain: **manhattanite.com** (or chosen variant — see action items)
- SSL: automatic, free, via Vercel + Cloudflare

## Observability

- **Sentry** for error tracking (free tier: 5,000 events/month, plenty)
- **Plausible** for analytics (page views, unique visitors, conversion funnels)
- **Supabase dashboard** for database health, query performance, auth logs
- **Vercel dashboard** for deploy health, edge function performance

No third-party session replay tools (Hotjar, etc.). Wrong vibe.

## Security posture at MVP

- All member-only data protected by Supabase Row-Level Security policies
- Auth tokens managed by Supabase (HTTP-only cookies, secure flag)
- Image uploads: scoped to the uploader's account, server-validated for file type and size
- No raw SQL passed from frontend to backend (Supabase client only)
- API keys and secrets stored in Vercel environment variables, never in the repo
- HTTPS everywhere (free via Vercel + Cloudflare)
- Email verification required to access any account features

What's deferred until cohort 1 or cohort 2:

- 2FA for admin accounts
- Rate limiting on the application form (basic Vercel-level limits are enough at seed)
- Audit logs for admin actions
- Penetration testing

## What the stack does NOT include (v1)

- No microservices
- No separate API layer (Next.js API routes are enough)
- No Redis or caching layer (Supabase + Vercel edge caching handles MVP scale)
- No real-time features, no WebSockets (no messaging in v1)
- No CMS — listings ARE the content
- No native mobile apps — web responsive only
- No third-party identity verification (Persona, Plaid Identity) — not needed at MVP scale
- No headless commerce or e-commerce engine — peer-to-peer listings, not transactions

---

## Action items for George (before build week 1)

These need George's input or signature, not a developer's. In order:

1. **Choose and register the domain.** Default: `manhattanite.com`. Alternatives: `manhattanite.nyc`, `manhattanite.co`, or one with intentional friction (e.g., a hyphenated form). Register via Cloudflare Registrar.
2. **Create a GitHub account** (if not already done) and a private repo named `manhattanite`. Invite Claude Code and any future collaborators.
3. **Sign up for Vercel, Supabase, Resend, Cloudflare, Plausible, Sentry.** All free to start. Use the Manhattanite Outlook address for every account. Use a password manager.
4. **Pick the email-from address.** Recommended: `hello@manhattanite.com` for member-facing emails, `george@manhattanite.com` for personal review comms. Configure both via Resend + Cloudflare.
5. **Decide the production-promotion rule** — manual click in Vercel, or merge-labeled PR. Recommendation: manual click during seed (more deliberate), automated post-Cohort-1.

Once items 1–4 are done, Claude Code can start build week 1.

---

## When to revisit this file

- **End of build week 1.** Any surprises in the stack? Update.
- **Before cohort 1.** Backups upgrade, 2FA decision, rate limits.
- **Before cohort 2 / public surface.** Scaling check: does Supabase free tier still fit?
- **Before monetization.** Stripe integration spec gets added.
- **If anything in this file is contradicted in build.** Update immediately.

---

*Last updated: 2026-05-16. Status: confirmed v1.*
