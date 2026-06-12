# CLAUDE.md

This file is read at the start of every session by both Cowork and Claude Code. It is the single source of truth for how to work in this project.

The first half is the **CoWork OS reading protocol** (orient yourself, read context, log work). The second half is the **Manhattanite project context** (what we're building, why, and how it's organized).

---

# Part 1 — CoWork OS reading protocol

## Before every session

1. Read everything in `ABOUT ME/`. No exceptions. Five files define who George is, how to write for him, and where his tools live: `about-me.md` (identity, business context, background), `voice-profile.md` (beliefs, personality, perspective), `writing-rules.md` (tactical writing mechanics: banned words, anti-AI patterns), `my-context-map.md` (full tool ecosystem), `specialist-routing.md` (which plugins cover which domains).
2. Read this file's Part 2 (Manhattanite project context) and `COMPANY/memory.md` (current quick state).
3. Open the task-specific COMPANY files from the table in `COMPANY/_index.md`.
4. Open `COMPANY/memory/decisions.md` only if you need the full dated decision list. Open `COMPANY/memory/session-log.md` only when recent session context matters.

## After every session

Log anything significant to the appropriate memory file:

- **Universal memory** (`COMPANY/memory.md`): decisions about how we work, discovered preferences, system changes.
- **Project memory** (`WORK AREAS/Product/mvp-build-project/memory.md`): progress, project-specific decisions, blockers, next steps.
- **Decisions log** (`COMPANY/memory/decisions.md`): if a strategic decision was made or revised.
- **Session log** (`COMPANY/memory/session-log.md`): a dated entry summarizing what happened (newest at top).

Use the format defined in each memory file. If nothing significant happened, don't force an entry.

## Folder protocol (now unified)

This folder serves **two purposes simultaneously**: it's both the CoWork workspace (strategy, planning, PA) and the Manhattanite build repo (code, deployment).

**Cowork-side folders** (read by Cowork; the upper layer):
- `ABOUT ME/` — George's identity and preferences. Personal — gitignored, lives only on his Mac.
- `RESOURCES/` — CoWork OS templates, guides, and skills.
- `COMPANY/` — Manhattanite strategy reference (vision, brand, voice, mvp-spec, tech architecture, GTM, trust/moderation, legal, PA rules, memory).
- `COMPANY/memory/` — the deep memory store (decisions log + session log).
- `WORK AREAS/` — active project work, including `Product/mvp-build-project/` (where this MVP is tracked) and `Admin-PA/` (personal-assistant tracking).

**Claude-Code-side folders** (read by Claude Code; the lower layer):
- `app/`, `public/`, `lib/`, etc. — the actual Next.js codebase.
- `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, etc. — project config.
- `.env.local` — environment variables (API keys); gitignored.
- `.git/` — version control.

Both layers coexist at the same root. Cowork reads from the upper layer, Claude Code reads from both. This eliminates the previous drift problem (two folders out of sync).

## Project creation protocol

When work begins on something that looks like a new project — a distinct piece of work with a goal that will take multiple sessions, not a quick question or one-off task — check whether a matching project folder already exists anywhere in `WORK AREAS/`. If it doesn't:

1. Decide which work area it belongs to. If unclear, ask. If it's a quick task or general admin, use `Admin-PA/`.
2. Create the project subfolder inside the chosen work area using kebab-case and ending with `-project`.
3. Create `project-brief.md` and `memory.md` inside it. Create an `outputs/` subfolder.
4. Log the new project in `COMPANY/memory/decisions.md` as a system change.

## Naming convention

Files in `outputs/` follow: `Project_Content-Type_v1.ext` (e.g., `Manhattanite_Brief_v1.md`, `Q3-Launch_Deck_v1.pptx`). Increment version if a file with the same name already exists.

## Operating rules

- If the brief is unclear, ask. Don't fill gaps with generic filler.
- Don't over-explain. Deliver the work. Save commentary unless George asks for it.
- Never delete files anywhere except where explicitly stated (e.g., archiving). Append to memory files; don't rewrite them.
- Be proactive but think before destructive actions. For anything that can't be undone, pause and confirm.
- When you hit a wall, say so clearly. Don't loop.
- All writing must follow the rules in `ABOUT ME/writing-rules.md`. Apply the five-point test before finishing any piece of writing.

## Personal-assistant boundary

If a session involves email/calendar work alongside code:

- **Outlook = Manhattanite (business). Gmail = personal. Never cross them.**
- Claude can draft, label, summarize without asking. Claude must **never** send email without explicit approval — even short replies, even to George.
- Full rules in `COMPANY/pa-rules.md`.

## Things to always do

- If you find something unexpected while working (a problem, a better approach), flag it.
- Prefer doing over explaining — if you can just do the thing, do it.
- If a task could be automated or systematised, mention it.

## Things to never do

- Don't use technical jargon without immediately explaining it in plain terms. George is non-technical with ADHD; define every technical term inline at first use.
- Don't ask multiple questions at once — pick the most important one.
- Don't delete, send, post, or submit anything without telling George first.
- Don't give a wall of text when a few sentences will do.

---

# Part 2 — Manhattanite project context

## What this repo is right now

A real, working Next.js 16 project. Originally scaffolded 2026-04-26 to run the manhattanite.com waitlist; now the production build for the marketplace itself. **Current state (2026-06-10):** auth (email + password — signup, login, forgot-password reset), Tier 1 gating page at `/`, `/profile` + `/profile/edit`, `listings` table with RLS, `/listings` browse (with a logged-out teaser), `/listings/[id]` detail, member-gated `/listings/new`, `/listings/mine`, edit + archive of your own listings (`/listings/[id]/edit`), image upload (Supabase Storage), `/apply` + manual approval, member-to-lister contact (`/listings/[id]/contact` → Resend), tier-aware navigation, and the multi-sponsor model (many sponsors per member, hybrid-at-2 byline). Migrations are applied through `0012` (with `0013`, a cosmetic column-drop, written but not yet applied). Founder is `is_member=true` with three real test listings live in prod.

The stack is **Next.js (App Router) + Supabase + Vercel + Resend + Airtable (dormant)**. See `COMPANY/tech-architecture.md` for locked stack decisions. The `/apply` slice (Phase 2) shipped on `lib/applications/submit.ts`; the Airtable side of that pipeline stays dormant, with Supabase as the live store.

@AGENTS.md — Read this for Next 16 breaking-changes warnings. Do not use Next 15 muscle memory.

## Synthesized strategic position

Manhattanite reconciles two strategy streams: an earlier deep analysis (`COMPANY/strategy-blueprint.md`, 2026-05-06) and a later tactical refinement (the rest of `COMPANY/`, 2026-05-16/17). The reconciled position holds:

- **Trust is the product, not coolness.** Utility-first positioning. Manhattanite must be *useful* — solve real local trust problems — before it is *exclusive*. Reject pure status-positioning. The framing is "invite-worthy because useful," not "invite-only because cool."
- **Aesthetic execution, not aesthetic positioning.** The brand voice (Soho House, editorial, Mr. Porter, Le Labo) is the *costume*, not the substance. We dress utility in cultivated voice; we do not lead with cultivation.
- **Binary trust mechanic at MVP, graded trust score in v2.** Account / Member is shippable in 14 weeks. The longer-term direction is the multi-tier score system (Explorer / Verified / Trusted / Connector) from strategy-blueprint.md.
- **Pay-per-post only.** No paid membership tiers. No business accounts at MVP. Free membership forever.
- **2 categories at launch.** Apartments + Furniture. Jobs in v1.5.

## Architectural anchors (the non-obvious essentials)

- **Two-tier access model is the product.** Tier 1 (Account) = free, can browse + apply, cannot post/contact/sponsor. Tier 2 (Member) = application + manual approval, sponsor(s) publicly named. The wall between them is the trust gate and the moat — never weaken it for ergonomics. Full spec in `COMPANY/mvp-spec.md`. Future direction: replace the binary with a graded trust score per `COMPANY/strategy-blueprint.md`.
- **Row-Level Security (RLS) is load-bearing, not optional.** The Tier 1/Tier 2 wall must be enforced at the Supabase database layer on every member-only table, not just in UI. RLS = Supabase's database-level permission system that decides which rows a logged-in user can see/edit. An RLS-less feature is a broken feature. See `COMPANY/tech-architecture.md`.
- **Single `listings` table with a `type` enum + JSON `details` column.** Apartments and furniture share common fields; type-specific fields live in `details`. Designed to extend (jobs, services) without schema explosion.
- **Many sponsors per member** (revised 2026-06-10; was single-sponsor). The `sponsorships` table (migration 0012) is the source of truth; `accounts.sponsor_id` is retained as the *primary / inviter* pointer, rendered first. Floor of 1 sponsor now, working toward 2, no upper limit. The listing caches an ordered `sponsor_names text[]`; the byline is assembled by the **hybrid-at-2** rule in `lib/listings/byline.ts` (1 name → "A & B" at two → "A, B + N more" beyond). During seed phase the primary sponsor defaults to George.
- **Applications are rows with status**, not a separate approval table. Approval (`approve_application`) flips `is_member`, writes `accounts.sponsor_id`, and inserts the primary `sponsorships` row in one transaction.
- **Contact = form → Resend email.** No in-product inbox, no real-time messaging in v1. A `listing_contacts` row is logged for moderation history.
- **Auth = email + password.** Signup, login, and a forgot-password reset flow (`/reset-request` → `/reset-password`). Magic-link-only was the earlier plan but was overridden in Phase 1 Slice 2 (see the 2026-05-27 decisions-log entry).
- **Airtable is transitional, not permanent.** During seed phase, applications flow into both Airtable (for George's manual review UI) and Supabase (for the member record). Sunset Airtable when the in-product admin review UI is built (v1.5 or v2).

## Scope discipline

`COMPANY/mvp-spec.md` is the source of truth for what's in and out of v1. **Deliberately out of v1:** in-platform messaging, jobs, services, search filters, favorites, payments, native apps, sponsorship request flow, paid membership tiers, business accounts. If a feature doesn't map to one of the three brand promises ("better stuff", "trust the people", "I'm in"), it doesn't ship.

If a build week slips, scope is cut from later phases — never from the trust layer.

## Voice, copy, and spelling conventions

- **American spelling throughout** product and marketing copy (Manhattanite is a New York brand). `COMPANY/voice-and-copy.md` and `COMPANY/brand-guide.md` are sources of truth for tone — Soho House is the voice anchor.
- When writing any user-facing string (interaction gates, application copy, system emails), open `COMPANY/voice-and-copy.md` first.
- `app/page.tsx` is the Tier 1 gating page (shipped Slice 3.5, 2026-06-01) using copy lifted verbatim from `COMPANY/voice-and-copy.md`. Flagged for Phase 1.5 rework — both copy and design need revisiting once the Design Foundation slot opens. Until then, the page does its functional job (closing the funnel mismatch) but is not the marketing surface Manhattanite needs longer term.
- **CTA library is partially stale.** `voice-and-copy.md` still lists "Join the network" as the create-account CTA; the shipped CTA is "Create an account →". Reconcile in a later copy pass.

## Active migrations and known transitions

This repo is mid-build. Be aware:

1. **Airtable application pipeline is dormant, not removed.** `/apply` (Phase 2) shipped on `lib/applications/submit.ts`; Supabase is the live store and Airtable is the dormant mirror. Airtable + Resend env vars stay in Vercel. Sunset Airtable when the in-product admin review UI lands (v1.5/v2).
2. **Bylines render (multi-sponsor).** Denormalized `author_name` + `sponsor_names text[]` on listings (migrations 0006 → 0012), assembled by `lib/listings/byline.ts`. The old singular `listings.sponsor_name` is kept and dual-written for now; **migration `0013` (drop `sponsor_name`) is written but not yet applied/pushed** — a parked cosmetic cleanup, safe to run any time (it recreates the byline functions without the dual-write before dropping).
3. **Image upload is wired** (Slice 6) — Supabase Storage `listing-images` bucket, RLS-scoped to the user's own folder, signed URLs on read.
4. **`/apply` + manual approval is live.** Apply creates a pending application; approval is run from a CLI/SQL during seed (`approve_application`). Niggle to check: the apply flow appears to fire two near-identical confirmation emails (flagged 2026-06-09).
5. **Landing page flagged for Phase 1.5 rework.** Copy + design both. Functional but not the marketing surface we need.
6. **`min-2` sponsor floor and a member-facing `/invite` / sponsorship-request flow are future.** The model supports many sponsors now, but the floor stays at 1 and there's no in-product "add a sponsor" UI yet (seed uses the `add_sponsor` helper).
