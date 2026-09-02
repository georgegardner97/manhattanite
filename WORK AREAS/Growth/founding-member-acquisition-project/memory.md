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

### 2026-08-01 — Saturday sweep: pitch reworked, First 1000 closed, Laermer gap flagged

Category: Progress

One-line pitch rework delivered (`outputs/Manhattanite_One-Line-Pitch_v1.md`): "It's Craigslist, if everyone on it was vouched for" promoted to sole default opener, "Raya meets Craigslist" retired, four listener variants + the 30-second elevator pitch (doubles as Chloe's exercise deliverable). First 1000 research closed (`outputs/First-1000_Acquisition-Notes_v1.md`) — newsletter has pivoted to AI content; distilled its classic material + Lenny Rachitsky's equivalent research into 5 applicable patterns and 3 Week-11 actions (sequence flagged names first, vouch question as ritual, pilot one building via Lavoie).

### 2026-08-01 — Blocker: Laermer meeting outcome never logged

Category: Blocker

The Richard Laermer meeting (2026-07-21, Chrysler Building — the first founding-member conversation) has no recorded outcome: no meeting note, tracker still "Idea". Needs George's 2-minute debrief before the tracker or next-wave sequencing can move. Task added to tasks.md.

### 2026-08-13 — Laermer correction: meeting postponed indefinitely

Category: Progress

Correction to the 2026-08-01 blocker note: the Richard Laermer meeting (booked for 2026-07-21) never happened — postponed indefinitely, per George. He stays flagged "very important" in the tracker, parked; no re-chase scheduled.

### 2026-08-13 — Cole call happened; George wants a professional strategic partnership

Category: Progress

Cole's voice-note advice distilled (full version in `outputs/Manhattanite_Strategy-Session_2026-08-13.md` §5): semi-grassroots bottom-up seeding (friends who list as a favor — she'd list things herself), nail the invitation language first (elegant, makes the invitee feel important), and what Manhattanite sells is taste/POV — curation as the product. Working terms: retainer or per-project, explicitly no pressure. George's call: pursue a professional partnership. Proposed shape logged: scoped 4–6 week pilot (invitation language + first grassroots wave) with a review gate.

### 2026-08-13 — Strategy session: sublet de-emphasis, three-pillar framing, growth math

Category: Decision

From George's mind dump + Strawberry.me coaching: (1) sublets/apartments are NOT the entry wedge (market saturated) — a category, not the lead; (2) new starter framing under test: locals-only discounts / community-based services / buy-sell with trusted neighbors — flagged as a scope shift vs mvp-spec, treated as positioning input until validated; (3) audience question formally open (plutocratic consumer vs young professional) — to be resolved via 5 friend interviews + offering reactions, not debate; (4) growth math logged: from 20 seed members, r≈0.5/month referral conversion hits the 50–100 year-end target — the 3-names ritual is the engine, approval throughput the deliberate brake; (5) GdC-style strictness confirmed as a feature to advertise. All organized in `outputs/Manhattanite_Strategy-Session_2026-08-13.md`.

### 2026-09-02 — The pitch finalised: two descriptions, and a sharper mechanism

Category: Decision

Closed the decision that had been open since 14 July and on the wave-one blocker list since 31 August. **Two descriptions, not one** — spoken wins on punch, written wins on dignity (`outputs/Manhattanite_One-Line-Pitch_v2.md`). Spoken default: *"It's an invite-only listings site for New Yorkers. A member has to vouch for you to get in — and if you behave badly, they go too."* Written: four short paragraphs ending on the invitation to be one of the first ten.

### 2026-09-02 — Shared liability replaces the name-on-a-profile

Category: Decision

George's own wording, and the biggest change in the pitch: *"the voucher is responsible for the behaviour of the people they let in — break the rules and you both go."* A consequence rather than a label. Every angle line in the cards was rebuilt on it, and the PRIDE motive shifted from *whose name means something* to *whose judgement you'd trust*.

### 2026-09-02 — Craigslist is the comparison, never the self-description

Category: Lessons learned

Settled by looking at what the comparators actually say about themselves. Radio H-P's founder: "an honourable and trusted network" (Air Mail's headline: "a posh Craigslist"). Gens de Confiance: "a trustworthy ad site" / "buy, sell, or rent with confidence" (everyone else: classified ads). Neither uses the comparison or the word *classifieds* about itself, and both get described that way without harm. **Let the listener reach for it and agree warmly; never volunteer it.** This retired "It's Craigslist, if everyone on it was vouched for" and, with it, George's worry that "classifieds" sounds antiquated — the fix was dropping the category noun for verbs, not finding a synonym.

### 2026-09-02 — Radio H-P documented for the first time

Category: Progress

radio-hp.co.uk, founder Nigel Hadden-Paton, Companies House 11923265. Pure login wall, no public marketing surface. ~8,000 members at the 2019 Air Mail profile. **Two nominations plus written testimonials, founder reviews every one personally** — stricter than our one voucher, no testimonial. Raised with George; not opened as a decision.

### 2026-09-02 — Pitch cards v2 delivered

Category: Progress

`outputs/Founding-Members_Pitch-Cards_v2.md` + `.pdf` (generator updated and re-run on the device; reportlab is available there). New four-beat spine (open / swap / picture / close), twelve angle lines rewritten, "sponsor" gone, Raya variant deleted rather than parked, page one now carries both descriptions. Landlord card gained an explicit fair-housing line: **never "likeminded" or anything about the type of person** — the standard is conduct. That phrase was in George's own draft and was cut.

### 2026-09-02 — Blocker: the pitch promises a rule the product doesn't have

Category: Blocker

The pitch now says "you're both out", and there is no rule for what happens to the people a removed member vouched for. Two-line policy, needed before the first invitation on 7 Sep. Added to `tasks.md`. Also still open from the same list and not blocking: no probation before a new member can vouch, no cap on how many one member may vouch for.

### 2026-09-02 — Next steps

Category: Next steps

Say the spoken line out loud a few times before the first coffee. Write the cascade-removal rule. Then the invitation email itself, which the written description is now the body of.
