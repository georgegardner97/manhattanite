# Manhattanite — Decisions Log

Distilled list of strategic decisions. Quick-reference for grounding any new work. For full session context, see `session-log.md`.

Read this at the start of every Manhattanite conversation.

---

## Product

- **Categories at launch:** Apartments + Furniture. (2026-05-16)
- **Jobs:** Added in v2, not v1. Maybe shown as "coming soon" in v1, framed not as waitlist. (2026-05-16)
- **Seed MVP:** Pre-launch MVP is populated with clearly-labeled *example* listings and example members for advisor and founding-member conversations. Wiped before public launch. (2026-05-16)
- **Account creation in the MVP is real, not example.** Visitors can genuinely apply for membership; George reviews each application. The application flow is live from day one. Only the listings are example data. (2026-05-16)
- **Two-tier access model.** Tier 1 = Account (free, no review, view-only). Tier 2 = Member (application + approval, can post/contact/sponsor). The interaction wall, not the viewing wall, is where trust is enforced. This is the core product mechanic. (2026-05-16)
- **Contact form, not in-platform messaging in v1.** Members initiate contact via a form on the listing that forwards to email. No in-product inbox until v2. (2026-05-16)

## Trust mechanic

- **Working name:** Gens de Confiance Lite. (2026-05-16)
- **Seed / MVP phase:** Open application path. Anyone visiting the site can apply for membership via real account creation. George reviews each application personally and approves or declines. Approved applicants are technically "sponsored by George." (2026-05-16)
- **Post-launch:** Sponsor-only becomes the primary path. One existing member vouches and is publicly named on the new member's profile. Application path may quietly remain or be removed depending on what we learn during MVP. (2026-05-16)
- **No "waiting list" framing.** The terminology is "apply for membership" — confident, member-facing, Soho House-style. Not waitlist, not signup, not registration. (2026-05-16)
- **Primary reviewer at start:** George. Until other members start sponsoring at volume, every approved member is functionally sponsored by him. (2026-05-16)

## Timeline

- **MVP target:** End of August 2026 (~14 weeks from 2026-05-16). (2026-05-16)
- **MVP intent:** Show-able working product, not publicly launched. (2026-05-16)

## Tech

- **Direction:** Coded MVP, not no-code. Built with Claude Code. (2026-05-16)
- **Stack confirmed:** Next.js (App Router) + Vercel + Supabase + Resend + Cloudflare (DNS + registrar) + Plausible + Sentry + GitHub. Stripe in v2 only. (2026-05-16, confirmed)
- **Auth:** Email + magic link via Supabase Auth. No passwords. (2026-05-16, confirmed)
- **Listings schema:** Single `listings` table with `type` enum + JSON `details` column for type-specific fields. Simpler than two tables, more flexible than rigid columns. (2026-05-16, confirmed)
- **Sponsorships are their own table** (not just an FK on accounts) so accountability state and history can be queried cleanly. (2026-05-16, confirmed)
- **Row-Level Security on every member-only table** is the security primitive of the two-tier model. Non-negotiable. (2026-05-16, confirmed)
- **Roles:** account / member / admin only. No role explosion. (2026-05-16, confirmed)
- **Listing photo cap:** 8 per listing. Tunable. (2026-05-16, confirmed)
- **Backups:** Supabase free tier (7-day daily) at MVP, upgrade to Pro ($25/mo, 30-day + PITR) at Cohort 1. (2026-05-16, confirmed)
- **No staging environment in v1.** Vercel previews + production only. (2026-05-16, confirmed)
- **v1 OUT (cuts to protect timeline):** In-platform messaging, search filters, payments, native mobile app. Web-first responsive only. (2026-05-16)
- **Monthly cost at MVP:** ~$10/month all-in. Domain (~$1 amortized) + Plausible ($9). Everything else free tier. (2026-05-16, confirmed)

## Brand

- **Voice anchor:** Soho House. (2026-05-16)
- **Visual reference set:** Mr. Porter, Soho House, Raya, Casa Magazines, Le Labo, The New Yorker. (2026-05-16)
- **Brand feeling:** Refined, simple, modern, cool. (2026-05-16)
- **Spelling:** American English throughout product, marketing, email, social, and support. Overrides George's personal British defaults for anything under the Manhattanite brand. (2026-05-16)
- **Wordmark + final palette:** Deferred until the first real product screens exist. Reason: hard to lock visual identity in isolation; needs context. Working defaults remain GT Sectra-style serif with italic "ite". (2026-05-16)
- **Palette direction:** Working base is black + cream (Lampblack + Paper). Brick demoted from primary accent to reserve. Open to revisiting Brick in context or replacing it. (2026-05-16)
- **Tagline (placeholder):** *New York's trusted private marketplace.* Used everywhere until revisited. (2026-05-16)
- **"Apply for membership"** is the canonical verb for joining. Never "sign up," "register," or "waitlist." (2026-05-16)

## Go-to-market

- **No paid ads, ever.** Growth is referral-led and curated. (2026-05-16)
- **Three phases:** Seed (0–20, founder-led), Cohort 1 (20–80, sponsor-led), Cohort 2 (80–200, light public surface). (2026-05-16)
- **Public marketing surface delayed until Cohort 2.** Goes live with cohort 2 expansion, not before. (2026-05-16)
- **No Twitter/X, no TikTok.** Instagram + email + word of mouth. Substack optional. (2026-05-16)
- **Monetization:** Free until end of Cohort 2 / start of Cohort 3, then pay-per-post via Stripe. Free to browse, free to sponsor, free to be a member. (2026-05-16, default pending confirm)

## Trust and moderation

- **Approvals are judgments, not checklists.** Application criteria are tilts, not requirements, except for the automatic-decline list. (2026-05-16)
- **Sponsor accountability is graded:** Good standing → Watch → Probation → Removed. Granular ladder, not binary. (2026-05-16)
- **Banned for life.** Once removed, no reapplication. (2026-05-16, confirmed)
- **Application response SLA:** Under 48 hours average, 72 hours max. (2026-05-16)
- **Listing moderation:** Every listing reviewed manually by George at MVP. 24-hour SLA in seed, 12-hour SLA in Cohort 1. (2026-05-16)
- **No broker apartment listings.** Peer-to-peer only. (2026-05-16, confirmed)
- **Sponsor accountability ladder is graded (Good standing → Watch → Probation → Removed).** Not binary. (2026-05-16, confirmed)
- **Founder identity exposure at seed:** George's name on emails, "Manhattanite team" introduced once a co-reviewer exists. (2026-05-16, confirmed)
- **Lawyer engagement target:** 4–6 weeks from 2026-05-16 (by end of June 2026). (2026-05-16, confirmed)
- **Sponsor visibility is permanent and public.** Every member's profile shows who they sponsored and who sponsored them. Social cost is the mechanism. (2026-05-16)

## Strategy synthesis (2026-05-17 reconciliation with prior STRATEGY.md)

After discovering that `~/Developer/manhattanite/` contained a substantial 26KB STRATEGY.md from 2026-05-06 with deeper strategic work than was visible at the start of this project, the two strategy streams were reconciled. The synthesized position now holds:

- **Trust mechanic at MVP:** binary two-tier (Account / Member) as planned. **v2 direction:** evolve toward a graded trust-score system with multiple membership tiers (Explorer / Verified / Trusted / Connector). The binary version is what ships in 14 weeks; the score version is the longer-term target. (2026-05-17, confirmed)
- **Launch categories:** stick with two — Apartments + Furniture. Jobs added in v1.5 (~Q4 2026). Services after that. (2026-05-17, confirmed)
- **Monetization:** simple pay-per-post only. No paid membership tiers, no business-account upsell. Free membership forever; only revenue is per-listing fees in v2. Keep it simple. (2026-05-17, confirmed — overrides earlier consideration of $99-499/mo business accounts)
- **Brand tone:** **utility-first, dressed in aesthetic vocabulary.** Trust is the product, not coolness. Take the older strategy's anti-clout / "invite-worthy because useful" positioning and execute it in the Soho House / editorial voice from the COMPANY/ brand-guide. The product *does* useful things; it just *looks* like a Soho House email. Reject pure status-positioning. (2026-05-17, confirmed)
- **Database:** Supabase as the primary marketplace database (per tech-architecture.md). **Airtable retained** during seed phase as George's manual application-review tool — applications flow into both. Sunset Airtable when the in-product admin review UI is built (v1.5 or v2). (2026-05-17, confirmed)
- **Build foundation:** Use `~/Developer/manhattanite/` (existing project with working code + integrations + git history) as the build repo. Move COMPANY/ docs into it. `~/Projects/manhattanite/` (today's clean shell) is being archived/deleted. (2026-05-17, confirmed)

## Legal posture

- **Seed-phase posture is private + non-transactional**, which reduces but does not eliminate legal exposure. (2026-05-16)
- **Legal-and-policy.md is a working map of open questions, not advice.** Every section is open until counsel is engaged. (2026-05-16)
- **First move:** Find a NY startup attorney within 4–6 weeks. Tier 1 items (entity, TOS, privacy) must resolve before MVP goes live. (2026-05-16)
- **NYC fair-housing law is the largest unaddressed regulatory question.** Specialist input may be needed. (2026-05-16)

## Personal Assistant

- **Email accounts:** Outlook = Manhattanite work. Gmail = personal. Never cross. (2026-05-16)
- **Default behaviors:** Claude can draft and label without asking. Claude must never send without asking. (2026-05-16)

## System / folder structure

- **`ABOUT ME/`** is read-only — founder identity. Cannot create or edit files there.
- **`COMPANY/`** holds all Manhattanite business reference (this folder).
- **`COMPANY/memory.md`** is the visible top-level snapshot (quick state + pointers). Read at the start of every Manhattanite conversation. (2026-05-16)
- **`COMPANY/memory/`** holds the deep memory files: `decisions.md` (this file) + `session-log.md`. Opened on demand. (2026-05-16)
- **`WORK AREAS/`** holds active project work.

---

*Decisions are dated. If something here conflicts with later work, the later decision wins — but log the change rather than silently edit.*
