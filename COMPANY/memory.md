# Manhattanite — Memory

The Manhattanite-specific memory file. Read this at the start of every Manhattanite conversation.

Two parts:

1. **Quick state** below: what's true right now, in plain language.
2. **Deeper files** in `memory/`: `decisions.md` (every decision, dated) and `session-log.md` (chronological session history).

If something below conflicts with what you read in the deeper files, the deeper files win — and update this snapshot.

---

## Quick state — as of 2026-06-09 (Slice C + Navigation slice shipped)

> Reconciled snapshot. On 2026-06-08 the `/apply` flow was built across two slices; on 2026-06-09 Slice C (the membership emails) shipped and the full apply→approve→welcome loop was verified end-to-end on the deployed site. Verified against git (working tree clean, in sync with `origin/main`) and the production database. Naming note: the membership flow is **"Phase 2"** per the build plan even though it shipped *after* the Phase 4 byline/profile work — the phase numbers reflect the original plan order, not chronology.

**Build progress at a glance.** Through **/apply Slice C (2026-06-09)**:
- **Auth:** email+password, signup, login, forgot-password reset.
- **Two-tier gating** page at `/`; `/profile`; `/profile/edit` (self-edit name/neighborhood/bio).
- **Listings:** `listings` table + RLS, `/listings` browse with covers, `/listings/[id]` detail with gallery, `/listings/new` member-gated posting with image upload (private `listing-images` bucket + signed URLs). Denormalized author/sponsor bylines ("Listed by George Gardner · sponsored by John Robinson"). **Byline convention = GdC-style full first + last.**
- **Membership application flow (NEW, the big 2026-06-08 work):**
  - **Slice A** — `/apply` route: a logged-in Tier-1 account fills the form (name required + prefilled, neighborhood, occupation, paragraph, optional referral), it writes an `applications` row (status `pending`) + writes name/neighborhood back to the account, sends a reviewer ping email, and shows a confirmation state. The "Apply for membership" CTA on `/profile` is now live. Migration `0007_applications.sql`. Built, committed, **deployed**, live-tested clean on prod.
  - **Slice B** — review functions (migration `0008_approve_application.sql`): `approve_application()` (atomic: account→member + sponsor_id set + application→approved), `decline_application()`, `request_more_info()`. SQL-driven review (no /admin page yet). Committed; functions live in prod; happy-path tested clean. Approving via SQL: `select public.approve_application('<app-id>');` (sponsor defaults to founder).
  - **Slice C — SHIPPED 2026-06-09.** Three membership emails (`lib/applications/emails.ts`, best-effort Resend sends): applicant confirmation ("We've got your application.") + reviewer ping (refined, leads with the `npm run approve -- <id>` action block) fire on submit; member welcome ("You're in.") fires on approval. Approval moved from raw SQL to **`npm run approve -- <app-id>`** (`scripts/approve-application.ts`), which calls `approve_application()` then sends the welcome. Migration `0009` grants `service_role` execute on the approve function. The CLI runs **only from George's Mac** — the `SUPABASE_SERVICE_ROLE_KEY` lives in `.env.local` and is never deployed (by design for seed phase). Committed (3 commits), pushed, **deployed**, and the full visit→account→apply→approve→welcome→post loop tested clean on prod with a Gmail plus-alias applicant. Cleanup left prod pristine.

**Production DB state:** all 9 migrations applied. `applications` table + 3 review functions + the 0009 service_role grant live. **0 applications, 0 non-founder accounts.** Founder (`info@manhattanite.com`, `85ce5315-…`) is `is_member=true`, `name='George Gardner'`, `sponsor_id` null.

**Still open:**
- **Walkthrough checkpoint — DONE 2026-06-09.** Produced `outputs/Manhattanite_Walkthrough-Findings_v1.md` (punch list). Two headlines were: (1) no navigation existed → **now fixed** (nav slice shipped); (2) **listings are view-only for everyone, even members** — the contact feature still isn't built (the biggest remaining product gap; a planned v1 slice).
- **TIER MODEL DECIDED 2026-06-09** (see decisions.md): three viewing layers, trust gate at the ACTION layer not the VIEWING layer — logged-out **teaser** / account = **full browse, acts on nothing** (on-ramp) / member = contact+post+sponsor. **Implemented** in the nav slice (migration 0010 anon teaser read).
- **Navigation slice — SHIPPED 2026-06-09.** Tier-aware `SiteNav`, back links, `/listings/mine`, logged-out 6-listing teaser (migration 0010). Resolves walkthrough A1/A3/A2-lite + D1.
- **Next build:** the **contact slice** (form on each listing → Resend email; logs `listing_contacts` for moderation — per mvp-spec) — the "capture the value" half of membership. Or the small **signup-name + copy pass** first. Then seed listings + photos (→ unlocks the second, "does it look finished" checkpoint).
- Standing caveats for the next walkthrough: landing page (Phase 1.5 rework pending) + thin content (2 listings, no photos, placeholder "John Robinson" sponsor) still look unfinished.
- `sponsor_name='John Robinson'` is fake placeholder on the founder's listings — replace before any non-founder sees the network.
- Seed listings (27, with real photos) not loaded; only the 2 founder listings exist, text-only.
- No email-change flow. No `/admin` review page (SQL-driven for now). Landing page flagged for Phase 1.5 redesign.
- **Profile photos:** decided 2026-06-08 — photo on profile page OK, but NO inline avatar thumbnails by names (looks scrappy). Implementation deferred to Phase 1.5.

Full per-slice detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## Original quick state — as of 2026-05-18 (morning)

### What Manhattanite is

A private NYC marketplace. **Trust is the product, not coolness.** Built for New Yorkers who are sick of Craigslist and Facebook Marketplace.

Loose model: **Gens de Confiance, but for Manhattan.** Positioning is "invite-worthy because useful" — utility-first, with an aesthetic execution. The product *does* useful things; it just *looks* like a Soho House email. Pure status-positioning is explicitly rejected.

### The two-tier access model (core mechanic)

- **Tier 1 — Account.** Anyone with an email. Free, no review. Can view all listings and apply for membership. Cannot post, contact, or sponsor.
- **Tier 2 — Member.** Application + manual review + approval. Sponsored by an existing member (during seed phase, the sponsor is George by default). Sponsor is publicly named on the profile. Can post, contact, sponsor.

Wall between Tier 1 and Tier 2 is the trust gate. Account holders see the value. Members capture it.

### MVP scope

- **Categories at launch:** Apartments + Furniture. Jobs in v2.
- **Timeline:** ~14 weeks from 2026-05-16. Target ready by end of August 2026.
- **Intent:** Show-able working product populated with clearly-labeled example listings. Real account creation + application flow from day one. **Not** a public launch.
- **Stack (confirmed):** Next.js + Vercel + Supabase + Resend + Cloudflare + Plausible + Sentry + GitHub. Stripe in v2. Auth via magic link. RLS on every member-only table. ~$10/month all-in at MVP.
- **Member contact:** Contact form on each listing forwards to email. No in-product inbox until v2.
- **Out of v1:** In-platform messaging, jobs, search filters, payments, native apps, sponsorship request flow.

### Build environment (as of 2026-05-17 night, post-folder-collapse)

- **Unified folder:** **~/Developer/manhattanite** on George's Mac is now the single source of truth for both the CoWork upper layer (ABOUT ME, COMPANY, RESOURCES, WORK AREAS) and the Claude Code lower layer (the Next.js codebase). The previous two-folder split (Cowork on ~/Desktop, build repo in ~/Developer) was collapsed on 2026-05-17 night.
- **Working code in repo:** Next.js 16 landing page + application form + Resend email pipeline + Airtable integration. Originally scaffolded 2026-04-26. Being migrated forward into the full MVP build.
- **GitHub:** github.com/georgegardner97/manhattanite (private). Synchronized with ~/Developer/manhattanite as of commit 2c8d597 (2026-05-17, "Migrate from waitlist project to MVP build foundation"). ABOUT ME/ is gitignored (personal); the rest of the Cowork folders are committed.
- **Build tool:** **Claude Code via the desktop app's Code tab.** Worktree mode OFF. Branch `main`, mode `Local`.
- **Hosting:** Vercel project `manhattanite`. manhattanite.com is the primary URL (308 redirect from www → non-www). Site is live, serving the existing waitlist landing page. Framework Preset was fixed from "Other" → "Next.js" earlier on 2026-05-17.
- **Email DNS:** Resend already verified for manhattanite.com from prior setup.
- **Application review tool:** Airtable (existing base, retained during seed phase as George's manual review queue). Sunset planned for v1.5 or v2 once the in-product admin UI exists.
- **Phase 1 Slice 1 (stack setup) — DONE 2026-05-18 morning.** Supabase wired end-to-end. Smoke test at `manhattanite.com/supabase-test` confirms the deployed app can talk to Supabase. Commit `9d14752` on `origin/main`. See project memory for the full slice log.
- **Landing-page direction — LOCKED 2026-05-18.** Current waitlist page stays live until Phase 1 + early Phase 2 give us something real to show; then it gets replaced by a trust-first / utility-leading homepage. Form test on the existing waitlist was dropped (testing the wrong product). Full reasoning in `memory/decisions.md`.
- **Design workstream — scheduled for Phase 1 week 2–3** (~7–14 days out). Decisions land before Phase 2 listing UI work.
- **Claude-in-Chrome browser automation is now part of the workflow.** Lets Cowork drive Vercel/Supabase/etc directly without dictating clicks back to George.
- **Archived:** ~/Projects/manhattanite was deleted on 2026-05-17 evening (Trash). ~/Desktop/Manhattanite is scheduled for archive after final verification of the collapsed folder.

### Voice + brand

- **Voice anchor:** Soho House. Tagline placeholder: *New York's trusted private marketplace.*
- **Spelling:** American throughout product and marketing copy. (Manhattanite is a New York brand.)
- **Visual references:** Mr. Porter, Soho House, Raya, Casa Magazines, Le Labo, The New Yorker.
- **Wordmark + final palette:** deferred until we can see them on a real page. Black + cream is the working base, brick reserved.

### Personal Assistant rules

- **Outlook** = Manhattanite work. **Gmail** = personal. Never cross.
- Claude can draft, label, summarize without asking. Claude must never send without asking.

### Folder layout

Both Cowork-side and Claude-Code-side folders coexist at `~/Developer/manhattanite/`:

- `ABOUT ME/` — read-only founder identity (gitignored, lives only on George's Mac).
- `COMPANY/` — all Manhattanite business reference (this folder).
- `COMPANY/memory/` — the deep memory files.
- `RESOURCES/` — CoWork OS templates, guides, and skills.
- `WORK AREAS/` — active project work. Live: `Product/mvp-build-project/` (the build), `Admin-PA/` (personal-assistant tracking).
- `app/`, `lib/`, `public/`, etc. — the Next.js codebase (Claude-Code-side).

---

## How to use the deeper files

| If you need… | Open… |
|---|---|
| Every decision we've made, dated | `memory/decisions.md` |
| Full chronological session-by-session history | `memory/session-log.md` |
| Why we're building this | `product-vision.md` |
| What we're building | `mvp-spec.md` |
| How it sounds | `voice-and-copy.md` |
| How it looks | `brand-guide.md` |
| How it's built | `tech-architecture.md` |
| How Claude operates day-to-day | `pa-rules.md` |

---

## Memory protocol

**Start of every Manhattanite conversation:**
1. Read `_index.md` (orientation)
2. Read this file (`memory.md`) for current state
3. Open `memory/decisions.md` only if you need a specific decision's full text
4. Open `memory/session-log.md` only if recent session context matters

**End of every meaningful session:**
1. Append a dated entry to `memory/session-log.md`
2. If a strategic decision was made or revised, update `memory/decisions.md`
3. Update the "Quick state" section above if anything material changed

---

*Last updated: 2026-06-09 (Slice C shipped — membership emails live, full loop verified on prod).*

## 2026-06-09 — Legal action plan delivered
- Created `WORK AREAS/Legal/company-formation-project/` (new work area: Legal).
- George has no registered entity yet. Recommended NY LLC by default; Delaware C-Corp only if raising/equity within ~12–18 months. Flagged Manhattan LLC publication cost (~$1,200–2,000).
- Three do-now items: form entity, Terms+Privacy live before real users, fair-housing guardrails before non-George apartment listings.
- Output: `Manhattanite_Legal-Roadmap_v1.md`.
