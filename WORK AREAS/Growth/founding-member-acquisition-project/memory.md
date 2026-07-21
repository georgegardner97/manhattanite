# Project memory: Founding member acquisition

This is the memory log for this project. It captures progress, decisions, and context specific to this work.

Claude reads this file whenever resuming work on this project. Claude appends to it at the end of each session or when something significant happens.

---

## What belongs here

- **Progress** — What was done, what stage we're at.
- **Decisions** — Choices made about this project's direction.
- **Blockers** — Things that stopped progress and need resolving.
- **Next steps** — What should happen next time we pick this up.
- **Lessons learned** — Insights worth remembering beyond this project.

## Format

```
### YYYY-MM-DD — Short title

Category: Progress | Decision | Blocker | Next steps | Lessons learned

[1-3 sentences.]
```

## Pruning rule

When this file exceeds 50 entries, summarise everything older than 1 month into a "Summary" section at the top. Keep the summary under 300 words.

---

## Log

### 2026-07-02 — Project created; sequencing decided

Category: Decision

George initially chose "conversations now, legal in parallel" (no approvals until LLC + attorney review). Project scaffolded with two-week action plan and candidate tracker in outputs/.

### 2026-07-02 — Sequencing revised: entity deferred, full go

Category: Decision

George overrode the legal gate: no money is changing hands, so no entity registration until revenue approaches. Triggers to revisit: first dollar, ~50+ members, or members he doesn't personally know. Approvals unblocked immediately. Surviving guardrail: fair-housing checklist in the moderation pass for apartment listings (that exposure doesn't depend on money or entity).

### 2026-07-02 — Fair-housing legality researched

Category: Progress

Researched platform liability for member-posted apartment ads: money is irrelevant to fair-housing law, but Section 230 shields the platform for user content (Craigslist precedent) provided the listing form never asks for tenant preferences (Roommates.com trap) and moderation approves/declines rather than rewrites. George's own/seed listings get no shield. Screening list (esp. source-of-income) in `outputs/Fair-Housing_Research_v1.md`. No licence needed for classifieds, even paid per-post.

### 2026-07-02 — Brain-dump done: 38 candidates

Category: Progress

George dumped 38 unique names into the tracker (target was 30). Priority flags: Richard Learmer ("very important"), Phil Lavoie (apartment buildings — supply-side anchor for the harder category), Beau (natural connector, already vouched Reid Volkey). Sid Simons appeared twice in the dump.

### 2026-07-02 — Tracker moved to an editable Claude artifact

Category: Decision

George wanted to edit the list in-app; the file preview is read-only. Built the "founding-members-tracker" artifact (editable table, composition scoreboard, priority stars, copy-as-markdown export). **The artifact is now the working tracker; `outputs/Founding-Members_List_v1.md` is a snapshot** — sync it when George pastes the markdown export into chat.

### 2026-07-02 — Tracker refined to George's working style

Category: Decision

Tracker artifact iterated: Neighbourhood column swapped for Contact info, drag-to-reorder with starred names pinned to top, and the Anna/Max/Lila persona codes replaced with 14 plain-language candidate types (connector, apartment supply, neighbourhood fixture, tastemaker, etc.). Composition scoreboard still tracks the playbook's 8/8/4 as Movers/Locals/Newcomers via a type→bucket mapping. Lesson: George prefers plain descriptions over internal codenames in working tools.

### 2026-07-02 — Seed listings already live (stale-memory correction)

Category: Lessons learned

Claimed the seed listings were unloaded based on a 2026-06-09 memory note; George challenged it and a live check proved him right — example listings with photos are live on prod. Lesson: verify prod state directly before citing build-status claims from memory files; quick-state notes go stale when fixes ship in later sessions. Site readiness is NOT a blocker for coffees.

### 2026-07-02 — Outreach kit delivered; supply-side added to scope

Category: Progress

Created `outputs/Founding-Members_Outreach-Kit_v1.md`: outreach templates (text, email, second-degree), elevator pitch library (one-liner: "It's Craigslist, if everyone on it was vouched for"), and the listing-supply play. Supply principle agreed with George: **poach posters, not listings** — recruit the person at their trigger moment (moving, merging households, redecorating); never repost content. Top sources: members' own "bring one listing" onboarding ritual, Phil Lavoie/supers for apartments, well-photographed FB Marketplace sellers, Listings Project, AptDeco/Chairish Manhattan sellers.

### 2026-07-13 — Per-category pitch cards delivered

Category: Progress

Created `outputs/Founding-Members_Pitch-Cards_v1.md`: a "spine + swap" pitch system for the tracker's 14 candidate types. One memorized spine (one-liner → angle → proof → two questions); only the angle line changes per type. Types grouped into four motives for improvising — PAIN (mover, newcomer), PRIDE (local, connector, tastemaker), SUPPLY (landlord, fixture, hospitality, design, creative), MODEL (finance, tech, media). Includes per-card asks and watch-fors (no press ask to tastemakers/media at seed; fair-housing rule on landlord card).

### 2026-07-13 — "Craigslist meets Raya" variant added

Category: Decision

George flagged that "Craigslist meets Raya" lands with a specific New Yorker. Added to pitch cards as a swap-in opener with guardrails: only for the scene-literate (tastemakers, connectors, creatives, hospitality, social movers); read-the-room test is "would they know Raya without explanation"; must be chased with the utility beat so it never drifts into exclusive-because-cool; never say it to media (ready-made headline, seed is no-press).

### 2026-07-13 — Company briefing PDF delivered

Category: Progress

Created `outputs/Manhattanite_Company-Briefing_v1.pdf` (generator: `generators/generate_company_briefing_pdf.py`) — the founder's nitty-gritty crib: the model, current state (live, demo-ready, seed phase), three-phase plan, finances (~$10/mo costs, $0 revenue by design, pay-per-post at ~200 members, bootstrapped/no raise), legal position (entity deferred with triggers; fair-housing guardrail active), and 12 hard-question answers. Uses the reconciled monetization position (pay-per-post only, membership free forever) — not the older strategy-blueprint pricing tiers.

### 2026-07-13 — Tweaks round 1 applied to both PDFs

Category: Progress

Per George: (1) mover card broadened beyond apartment-hunting to all marketplace pain; (2) briefing moderation copy now says "send back for the poster to rewrite" — never platform-rewrites (Section 230 nuance kept); (3) categories reframed as focus-not-limit; (4) paid-ads rule softened to "not while seeding, open later." Both PDFs regenerated from their generators. Positioning revisions logged in COMPANY/memory/decisions.md.

### 2026-07-02 — Next steps

Category: Next steps

George: pick the 3 week-1 coffees, personalise + send the first messages, fill contact info in the tracker. Fine-tune pitches after first real conversations. Hard-delete the archived QA-test listing before demos.
