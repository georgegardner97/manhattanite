# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is right now

**A real, working Next.js 16 project with a waitlist landing page + Airtable + Resend integrations**, being migrated forward into the full Manhattanite MVP. This repository was originally scaffolded on 2026-04-26 to run the manhattanite.com waitlist and is being repurposed as the production build for the marketplace itself. The Phase 1 build is just beginning. Strategy and reference docs live under `docs/COMPANY/` and project tracking under `docs/work-areas/`.

The stack is **Next.js (App Router) + Supabase (planned, not yet wired) + Vercel + Resend + Airtable (transitional)**. See `docs/COMPANY/tech-architecture.md` for locked stack decisions. Until Supabase is wired, applications continue to flow into Airtable as today — this is intentional during seed phase.

## Memory protocol — read at the start of every Manhattanite conversation

Non-negotiable. Orient yourself this way:

1. `docs/COMPANY/_index.md` — navigation map
2. `docs/COMPANY/memory.md` — quick state snapshot (what's true *right now*)
3. `docs/COMPANY/strategy-blueprint.md` — the deeper Gens de Confiance analysis and operational blueprint (from 2026-05-06; longer and more thorough than what's in mvp-spec.md and product-vision.md)
4. The task-specific files from the table in `_index.md`

Open `docs/COMPANY/memory/decisions.md` only when you need the full dated decision list. Open `docs/COMPANY/memory/session-log.md` only when recent session context matters.

**At the end of a meaningful session:** append a dated entry to `memory/session-log.md` (newest at top), update `memory/decisions.md` if a strategic decision was made or revised, and update the "Quick state" section of `memory.md` if anything material changed. If the deeper files conflict with `memory.md`, the deeper files win — fix the snapshot.

## The synthesized strategic position

Manhattanite reconciles two strategy streams: an earlier deep analysis (`strategy-blueprint.md`, 2026-05-06) and a later tactical refinement (the rest of `COMPANY/`, 2026-05-16/17). The reconciled position holds:

- **Trust is the product, not coolness.** Utility-first positioning. Manhattanite must be *useful* — solve real local trust problems — before it is *exclusive*. Reject pure status-positioning. The framing is "invite-worthy because useful," not "invite-only because cool."
- **Aesthetic execution, not aesthetic positioning.** The brand voice (Soho House, editorial, Mr. Porter, Le Labo) is the *costume*, not the substance. We dress utility in cultivated voice; we do not lead with cultivation.
- **Binary trust mechanic at MVP, graded trust score in v2.** Account / Member is shippable in 14 weeks. The longer-term direction is the multi-tier score system (Explorer / Verified / Trusted / Connector) from strategy-blueprint.md.
- **Pay-per-post only.** No paid membership tiers. No business accounts at MVP. Free membership forever.
- **2 categories at launch.** Apartments + Furniture. Jobs in v1.5.

## Architectural anchors (the things that aren't obvious from any single file)

- **Two-tier access model is the product.** Tier 1 (Account) = free, can browse + apply, cannot post/contact/sponsor. Tier 2 (Member) = application + manual approval, sponsor publicly named. The wall between them is the trust gate and the moat — never weaken it for ergonomics. Full spec in `mvp-spec.md`. Future direction: replace the binary with a graded trust score per `strategy-blueprint.md`.
- **Row-Level Security is load-bearing, not optional.** The Tier 1/Tier 2 wall must be enforced at the Supabase database layer on every member-only table, not just in UI. An RLS-less feature is a broken feature. See `tech-architecture.md`.
- **Single `listings` table with a `type` enum + JSON `details` column.** Apartments and furniture share common fields; type-specific fields live in `details`. Designed to extend (jobs, services) without schema explosion.
- **One canonical sponsor per member**, foreign-keyed on `accounts.sponsor_id`. During the seed phase, sponsor defaults to George. Sponsorships also get their own row in `sponsorships` for queryability.
- **Applications are rows with status**, not a separate approval table. Approval flips `is_member` and writes the sponsor FK in one transaction.
- **Contact = form → Resend email.** No in-product inbox, no real-time messaging in v1. A `listing_contacts` row is logged for moderation history.
- **Auth = magic link only.** No passwords, no reset flow. Matches the editorial feel.
- **Airtable is transitional, not permanent.** During seed phase, applications flow into both Airtable (for George's manual review UI) and Supabase (for the member record). Sunset Airtable when the in-product admin review UI is built (v1.5 or v2).

## Scope discipline

`docs/COMPANY/mvp-spec.md` is the source of truth for what's in and out of v1. **Deliberately out of v1:** in-platform messaging, jobs, services, search filters, favorites, payments, native apps, sponsorship request flow, paid membership tiers, business accounts. If a feature doesn't map to one of the three brand promises ("better stuff", "trust the people", "I'm in"), it doesn't ship.

If a build week slips, scope is cut from later phases — never from the trust layer.

## Voice, copy, and spelling conventions

- **American spelling throughout** product and marketing copy (Manhattanite is a New York brand). The `voice-and-copy.md` and `brand-guide.md` files are the source of truth for tone — Soho House is the voice anchor.
- When writing any user-facing string (interaction gates, application copy, system emails), open `voice-and-copy.md` first.
- The current waitlist landing page (`app/page.tsx`) was written under earlier branding. Future copy refresh should pull from `voice-and-copy.md` for consistency.

## Personal-assistant boundary

If a session involves email/calendar work alongside code:

- **Outlook = Manhattanite (business). Gmail = personal. Never cross them.**
- Claude can draft, label, summarize without asking. Claude must **never** send email without explicit approval — even short replies, even to George.
- Full rules in `docs/COMPANY/pa-rules.md`.

## Working directory conventions

- `docs/COMPANY/` — business reference (vision, spec, architecture, voice, brand, GTM, trust/moderation, legal, PA rules, strategy-blueprint). Treat as authoritative.
- `docs/COMPANY/memory/` — the deep memory store (decisions log + session log). See memory protocol above.
- `docs/work-areas/Product/` — active product work (currently `mvp-build-project/` tracks setup + phase progress).
- `docs/work-areas/Admin-PA/` — non-product personal-assistant tracking.
- `app/`, `public/`, `next.config.ts`, etc. — the actual Next.js codebase. Existing waitlist code; will evolve into the full marketplace.
- `STATUS.md`, `STRATEGY.md`, `AGENTS.md` — legacy files from the pre-reconciliation project. STRATEGY.md has been copied into `docs/COMPANY/strategy-blueprint.md` and can be safely deleted from the repo root once that move is verified. STATUS.md should be updated or replaced by `docs/work-areas/Product/mvp-build-project/memory.md`.

## Active migrations and known transitions

This repo is mid-migration. Be aware:

1. **Airtable → Supabase.** Currently applications go to Airtable. Phase 1 work will add Supabase auth + accounts/members tables, then dual-write, then cut over.
2. **Waitlist page → gating page.** `app/page.tsx` currently shows a waitlist form. It will be replaced by the proper Account/Member gating flow per `voice-and-copy.md`.
3. **Legacy STRATEGY.md → docs/COMPANY/strategy-blueprint.md.** Read the moved version; the root one is being archived.
