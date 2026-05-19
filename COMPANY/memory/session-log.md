# Manhattanite — Session Log

Append-only chronological record. Add a dated entry after every meaningful session. For the distilled list of strategic calls, see `decisions.md`.

Newest entries at the top.

---

## 2026-05-18 · Personal Assistant fully configured for Manhattanite

**Worked on:**
- Activated and scoped the Personal Assistant inside the Manhattanite workspace. PA plugin was installed back on 2026-05-15 but never properly switched on.
- Built the missing Admin-PA scaffolding: `captains-log/2026-05-captains-log.md`, `contacts.md`, `preferences.md`, `output-log.md`. Until now only `tasks.md` existed.
- Wrote `WORK AREAS/Admin-PA/manhattanite-pa-config.md` — the master operational config for the PA. Covers email/calendar account map, calendar permissions (Personal Google Calendar read+write, Outlook read+write, Danbro read-filtered), cross-folder access pattern for George's other Cowork workspaces, proactive surfacing rules, ADHD defaults, logging behaviours, and what the PA explicitly does NOT do.
- Upgraded the existing scheduled tasks `pa-morning-briefing` (7am daily) and `pa-end-of-day-summary` (8pm daily). Both now read Manhattanite project memory (`COMPANY/memory.md` + `WORK AREAS/Product/mvp-build-project/memory.md`), scan Outlook for business email, and have a hook to read other Cowork workspaces when mounted. Morning briefing now produces a dedicated "Manhattanite build state" section and includes a Monday-only "Week ahead" view.

**Decided:**
- **Outlook = Manhattanite business, Gmail = personal, never cross.** Already in `pa-rules.md`; reinforced in the PA config and both briefing prompts.
- **Anticipate aggressively.** Daily 7am briefing + 8pm EOD + meeting prep before meetings + decision surfacing — drafts everything, sends nothing without George's per-message approval.
- **Cross-folder pattern: on-demand mounting.** Scheduled tasks request other Cowork workspaces via `request_cowork_directory` when needed. Cowork persists approved mounts so subsequent runs come up silently.
- **Calendar autonomy:** PA may create, move, and respond to events on Personal Google Calendar and Outlook for George's own time. Still surfaces a decision before booking external attendees.

**Blockers / open threads:**
- **Other Cowork folder paths pending.** George needs to share the exact paths of his other Cowork workspaces (e.g. music, personal life) so they can be listed in `manhattanite-pa-config.md` Section 3 and mounted on first request.
- The 8pm EOD summary will fire later today and should now reflect this richer setup. Worth a Run Now from George to pre-approve the new connectors the prompts reference.

**Next:**
- George shares paths to other Cowork folders → add them to the cross-folder map.
- Optional: George triggers Run Now on `pa-morning-briefing` and `pa-end-of-day-summary` to pre-approve Outlook/Gmail/Calendar tool access so future scheduled runs don't pause on permission prompts.

---

## 2026-05-17 · Phase 0 collapse migration complete

**Worked on:**
- Executed and verified the Phase 0 collapse migration on the night of 2026-05-17.
- Unified the previously split Cowork workspace and Claude Code repo into a single folder at `~/Developer/manhattanite`.

**Decided:**
- Single folder at `~/Developer/manhattanite` is now the source of truth for both the CoWork upper layer (ABOUT ME, COMPANY, RESOURCES, WORK AREAS) and the Claude Code lower layer (Next.js codebase). No more drift between two folders.

**Blockers / open threads:**
- None from the migration itself.

**Next:**
- Resume Phase 1 build work against the unified folder.

---

## 2026-05-16 · Tech stack locked

**Worked on:**
- Confirmed Batch 4 assumptions as defaults (lifetime ban, no broker listings, four-state sponsor ladder, George's-name-on-emails at seed, lawyer engagement in 4–6 weeks).
- Rewrote `tech-architecture.md` from stub to confirmed v1. Locked the full stack: Next.js + Vercel + Supabase + Resend + Cloudflare + Plausible + Sentry + GitHub.
- Closed every open decision in the stub: auth via magic link, single sponsor FK, status-based applications, three roles only, one listings table with JSON details, 8 photos per listing, contact form via Resend, RLS as the security primitive of the two-tier model.
- Added missing scaffolding the stub didn't cover: Sentry, GitHub, deployment flow, backups, security posture, observability.

**Decided:** See `decisions.md`. Headlines:
- Full stack confirmed. Total cost ~$10/month at MVP.
- RLS on every member-only table is non-negotiable — it's what makes the two-tier wall real.
- No staging environment; Vercel previews + production are enough at MVP.
- Backups: free-tier OK at seed, upgrade to Supabase Pro at Cohort 1.

**Blockers / open threads:**
- George has 5 personal action items before build week 1: register domain, create GitHub repo, sign up for accounts, pick email-from addresses, decide production-promotion rule.
- Founding-member acquisition project still unstarted.
- Lawyer outreach still unstarted.

**Next:**
- George runs through the 5 pre-build action items.
- After that: spin up `WORK AREAS/Product/mvp-build-project/` and begin build week 1.
- In parallel: founding-member acquisition + lawyer outreach.

---

## 2026-05-16 · Batch 4 — GTM, trust, legal

**Worked on:**
- Drafted `gtm-playbook.md`: three-phase model (Seed 0–20, Cohort 1 20–80, Cohort 2 80–200), founder routines per phase, channel posture, anti-patterns, and metrics.
- Drafted `trust-and-moderation.md`: approval criteria (baseline + tilts + automatic decline), listing standards by category, sponsor accountability ladder (good standing → watch → probation → removed), removal grounds, edge cases.
- Drafted `legal-and-policy.md` as a tiered open-questions map (not legal advice). Identified Tier 1 items that block MVP go-live: entity formation, TOS, privacy policy, founder identity exposure. NYC fair-housing flagged as the largest unaddressed risk.

**Decided:** See `decisions.md`. Headlines:
- No paid ads. Sponsorship-led growth. Public marketing surface delayed until Cohort 2.
- Free until Cohort 3, then pay-per-post via Stripe.
- Sponsor accountability is a graded ladder, not binary.
- Lifetime ban on removal (default; open to a 12-month cooling-off alternative).
- Seed-phase legal posture: private + non-transactional. Counsel engagement is the first move.

**Blockers / open threads:**
- All legal Tier 1 items remain open. George needs to find a NY startup attorney.
- First-20-members list still to be built. Lives under `WORK AREAS/Growth/founding-member-acquisition-project/` once created.
- Several assumptions in the new files want a reaction round: broker-listing policy, founder identity exposure, sponsor accountability ladder granularity, lifetime ban vs cooling-off.

**Next:**
- George reacts to Batch 4 assumptions.
- Spin up `WORK AREAS/Growth/founding-member-acquisition-project/` for the operational first-20 list.
- Begin lawyer outreach.
- Decision needed: do we draft a `WORK AREAS/Legal/counsel-engagement-project/` to track the legal workstream?

---

## 2026-05-16 · Batch 3 + clarifications round

**Worked on:**
- Drafted Batch 3: `mvp-spec.md` (two-tier model, 14-week timeline, v1 OUT cuts, success criteria) and `tech-architecture.md` stub (default stack table, open decisions, data model sketch).
- Applied a sweep of George's clarifications across earlier files: American English throughout, two-tier access model propagated, palette demotion of Brick, wordmark + final palette deferred.
- Created visible top-level `COMPANY/memory.md` as the quick-state entry point (deep memory files stay in `memory/`).
- Updated `_index.md` to point at the new memory entry.

**Decided:** See `decisions.md`. Headlines:
- Two-tier access model is the core mechanic: Account (free, view-only) → Member (approved, can interact).
- Contact form in v1 forwards to email; no in-platform inbox until v2.
- American English everywhere in Manhattanite-branded copy, overriding George's personal British defaults.
- Wordmark + final palette deferred until first product screens exist. Black + cream working base; Brick demoted to reserve.

**Blockers / open threads:**
- First-20-members strategy still undefined. Sits as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture still undefined. NYC fair-housing rules for apartment listings need structured work.
- Default stack (Next.js + Supabase + Vercel + Resend + Cloudflare + Plausible) is provisional until tech-architecture.md is confirmed.

**Next:**
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`.
- Set up `WORK AREAS/Growth/founding-member-acquisition-project/` once GTM playbook exists.
- Confirm tech stack before week 1 of MVP build.
- Possible side-quest: mock wordmark concepts on a real first screen.

---

## 2026-05-16 · Context system kickoff (Batch 1 + 2 + clarification)

**Worked on:**
- Designed the 9-file context system for `COMPANY/`.
- Resolved 3 strategic pushbacks: launch categories, trust mechanic, MVP timeline.
- Set up `COMPANY/memory/` with decisions log + session log.
- Drafted Batch 1: `pa-rules.md`, `_index.md`, `product-vision.md`.
- Drafted Batch 2: `brand-guide.md`, `voice-and-copy.md`.
- George clarified: account creation in the MVP is real, not example. Application path is functional from day one and reviewed manually.

**Decided:** See `decisions.md`. Headlines:
- 2-category launch (apartments + furniture)
- Trust mechanic: seed-phase = open application reviewed by George; post-launch = sponsor-only primary
- No "waiting list" framing — use "apply for membership"
- 14-week MVP target (end of August 2026)
- Stack: Next.js + Supabase + Vercel (default, pending confirm in `tech-architecture.md`)
- Seed MVP has labelled example listings + real application flow
- Brand: GT Sectra wordmark with italic "ite" (default), Lampblack + Paper + Brick palette (default)
- Voice anchor: Soho House. Tagline placeholder: *New York's trusted private marketplace.*

**Blockers / open threads:**
- First-20-members strategy is undefined. Lives as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture is undefined. Needs structured work, including NYC fair-housing rules for apartment listings.
- Spelling split (British vs American) flagged for confirmation in voice-and-copy.md.
- Brand color and wordmark direction are defaults — need George's react.

**Next:**
- Batch 3: `mvp-spec.md`, `tech-architecture.md` stub
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`
- Set up `WORK AREAS/` with founding member acquisition project once GTM playbook exists
- Possible side-quest: mock wordmark concepts

---

*Entry format: date · short title, then sections for Worked on / Decided / Blockers / Next.*
