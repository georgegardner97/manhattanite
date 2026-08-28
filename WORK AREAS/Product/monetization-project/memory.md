# Project memory: Monetization

Claude reads this file whenever resuming work on pricing or payments. Append at the end of each session.

Format: `### YYYY-MM-DD — Short title` / `Category: Progress | Decision | Blocker | Next steps | Lessons learned` / 1–3 sentences.

---

## Log

### 2026-08-27 — Project created off George's pricing questions

Category: Progress

George asked when to start charging, whether to charge for everything, and what the margins look like. Project scaffolded and `outputs/Manhattanite_Pricing-Model_v1.md` delivered: comparator pricing, unit economics, five revenue scenarios by member count.

### 2026-08-27 — Recommendation on the table, not yet confirmed

Category: Next steps

Recommended: apartments $99/30 days (free until rented), furniture free forever, jobs $75 when the category lands, featured upgrades later. Switch-on trigger is repeat posting + reply rates, not a member count. Awaiting George's call on price and on whether furniture stays free permanently.

### 2026-08-27 — The FARE Act invalidates the July pricing rationale (conclusion survives)

Category: Lessons learned

The 2026-07-14 note priced apartments high because "broker-fee pain makes it cheap" — but NYC's FARE Act (in effect 2026-06-11) moved broker fees off tenants and onto landlords. The tenant-pain argument is dead; the right anchor is what a *lister* pays: StreetEasy for-rent-by-owner is $249 per two weeks, Listings Project is $47 a week in NY. $99 still reads cheap against those.

### 2026-08-27 — Operational point that changes the build

Category: Decision

Payment must be taken on approval, not on submission. Every listing is manually reviewed, so charging up front means refunding every declined listing and arguing about it. Authorize on submit, capture on approval.

### 2026-08-27 — 20,000-member scenario added to the model

Category: Progress

George asked what 20,000 members looks like. Section 6 added to `outputs/Manhattanite_Pricing-Model_v1.md`: revenue $600k–$1.2m, costs ~$470–540k (three-quarters payroll), break-even at ~470 paid listings a month. Headline: the 97% listing margin does not survive contact with a moderation team, and 20,000 Manhattan-only members is one in eighty residents, so it implies both expanding past Manhattan and replacing personal judgement with a reporting-and-insurance system, as Gens de Confiance did.

### 2026-08-27 — Exit valuation at 20,000 members added (section 7)

Category: Progress

Three methods converge on $2m–$6m: owner-earnings multiples (3–6.5x, FE International's marketplace band), revenue multiples (Nextdoor trades at 3.4x on $260m revenue, down 71% from 2021), and per-member value (Zillow paid $50m for StreetEasy's 1.2m monthly visitors in 2013, ~$42 a head for anonymous traffic). Two flags for George: pay-per-post is transactional, and recurring revenue roughly doubles a multiple — so "membership free forever" plausibly halves the exit; and owner dependency is the single largest discount buyers apply, which makes documented moderation standards and a trained reviewer value creation rather than admin.
