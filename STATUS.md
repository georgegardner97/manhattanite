[2026-05-17] STATUS.md is being superseded by docs/work-areas/Product/mvp-build-project/memory.md, which is the active project tracking file going forward. Content below is retained for historical reference only.

# Manhattanite — Project Status

A living snapshot of where the project is. Read this first to get oriented quickly. Update whenever a milestone is hit or a decision is made.

**Last updated:** 2026-05-07

---

## What's live and working

- **Domain:** manhattanite.com (apex, no www redirect) — DNS A record at GoDaddy → Vercel (216.198.79.1)
- **Hosting:** Vercel project `manhattanite` (Hobby tier), auto-deploys from GitHub `main` branch
- **Code:** Next.js 16.2.4 + React 19.2.4 + TypeScript, App Router, Turbopack
- **Repo:** github.com/georgegardner97/manhattanite
- **Landing page:** single-page application form (`app/page.tsx`)
- **Form fields:** Name, Email, Neighborhood, Referred by (all optional except as marked)
- **Submission pipeline (dual-channel, independent try/catch):**
  - Resend → email notification to `info@manhattanite.com`, sent from `applications@manhattanite.com`
  - Airtable → row created in "Applications" table with linked-record cross-reference
- **Database:** Airtable base "Manhattanite" (`applBwtxAzzYfFELQ`), table "Applications" (`tblL1TAgU4LaNBZ7H`)
  - Fields: Name (text), Email (email), Neighborhood (text), Referred By (linked → self), Submitted At (auto), Status (single select: New/Reviewing/Approved/Waitlist/Declined), Referrals (auto reverse-lookup)
- **Self-referencing referral graph** working — when applicant B names applicant A as referrer, A's row shows B in its Referrals column.

## What's NOT yet built

- Authentication / member login
- Member dashboard / profile
- Listings (post, browse, search) — the actual marketplace product
- Admin review workflow (applications are captured but reviewing them happens manually in Airtable)
- Welcome email automation on approval
- Trust score logic
- Membership tiers (Explorer / Verified / Trusted / Connector)
- Anything beyond waitlist capture

## Open strategic decisions

These are unresolved and shape every downstream choice. See STRATEGY.md for context.

1. **Center of gravity:** Housing-first, general classifieds-first, or local network-first?
2. **Moderation posture:** Heavy manual approval at launch, or lighter touch?
3. **Brand center:** Trusted utility, or social-status membership?
4. **Monetization at launch:** Paid membership from day one, or freemium?
5. **Founding cohort:** Who are the first 100–300 people whose presence makes the marketplace feel real?

## Pending housekeeping

- Migrate Vercel + Resend ownership from personal Gmail (george.gardner480@gmail.com / @googlemail.com) to `info@manhattanite.com` — deferred but worth doing once before the project gains commercial weight.
- Consider whether to upgrade Vercel from Hobby tier (commercial use → requires Pro).

## Architecture decisions made (and why)

- **Apex over www** — modern brand convention; apex stays primary, www either redirects or is unused.
- **Server Actions** for form submission instead of API route — Next.js 16 idiomatic, less ceremony.
- **`formData.get()` explicit calls** instead of `Object.fromEntries(formData)` — Next.js 16 / React 19 inject internal `$ACTION_*` keys into FormData that would otherwise pollute payloads sent to third parties.
- **Independent try/catch around Resend and Airtable** — if one fails, the other still succeeds; the user still gets a "thank you" page; failures are logged to Vercel logs.
- **`typecast: true`** on Airtable POST — lets Airtable resolve the "Referred By" string to an existing record by primary-field match, or create a stub if no match exists.
- **Airtable IDs hardcoded as module constants** — they're not secrets, only the API token is.

## Project conventions and gotchas

- `AGENTS.md` / `CLAUDE.md` warn this is "NOT the Next.js you know" — Next 16 has breaking API changes; consult `node_modules/next/dist/docs/` before writing Next code, especially around forms, routing, server actions, caching.
- `.env.local` is gitignored. Real API keys live there locally and in Vercel Environment Variables. Never commit them.
- Vercel env vars are set per-environment (Production, Preview, Development). Both `RESEND_API_KEY` and `AIRTABLE_API_KEY` are in Production + Preview.
- Local dev: `npm run dev`. If port-in-use error, kill the stale process (`kill <PID>`) and restart.

## Recent milestones

- **2026-05-07** — Airtable integration deployed to production. Live form now writes to both Resend and Airtable. Self-referencing referral linking working end-to-end.
- **2026-05-07** — STRATEGY.md captured (Gens de Confiance analysis + operational blueprint).
- **2026-05-02** — Resend email notifications shipped.
- **(earlier)** — Domain connected, Vercel deployment live, repo initialized.
