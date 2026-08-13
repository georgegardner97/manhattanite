# Strategy session — the August 13 mind dump, organized (v1)

**Dated 2026-08-13.** George's dump + Cole's voice notes + the Strawberry.me coaching output, sorted into: what's effectively decided, what's genuinely open, the working material, and the plan. Nothing here changes `mvp-spec.md` or `product-vision.md` yet — the flagged items go through a proper reconciliation once decided.

---

## 1. What you've effectively decided (now logged)

1. **Sublets/apartments are not the entry point.** The NYC sublet market is saturated (Listings Project, Girls Who Sublet, Ohana…). Apartments stay *a* category, not *the* wedge. This softens the original "apartments first" assumption.
2. **Grassroots seed, not elite outreach.** Per Cole and your own instinct: the first members are friends doing you a favor — people who'll make a profile and list something because they like you. The *elegance of the invitation* does the positioning work; the member list gets aspirational later, not first.
3. **Double down on GdC-style strictness.** Strictness is a feature to advertise, not soften. (GdC's eventual 3-sponsor floor is already logged as v2 direction — this confirms the instinct.)
4. **Trust is the product — hunt trust-broken markets.** The category question becomes: "where in Manhattan life is trust most broken?" That's the filter for what Manhattanite carries.
5. **The design goes to a professional.** Your verdict: current design reads "too AI." Direction: engage a human designer. (See §6 — this changes the design queue immediately.)
6. **Cole: pursue a professional strategic partnership.** She's open, deliberately unpressured, works by retainer or per-project. Next move is yours to formalize.

## 2. The one big open question — who is this for?

Everything else in the dump orbits this. Two poles:

**Older / wealthier ("the plutocratic consumer"):** more assets, more service needs, more to lose from broken trust — trust is a *dealbreaker*, not a preference. GdC's French base skews family/established. The art market instinct fits here (opaque, provenance-anxious, relationship-driven — trust issues are the market). They're also less online, harder to reach digitally, and slower to adopt — which cuts both ways: harder to acquire, stickier once in.

**Younger / tech-savvy (the current Anna/Max/Lila personas):** already transacting online, already burned by Craigslist/FBM, easy to reach, natural inviters. But lower spend, and the sublet/furniture space serving them is exactly the saturated part.

**A resolution worth testing rather than debating:** these may not be either/or — GdC serves households *because* it started with utility staples. The three-pillar framing (§3) leans older-and-settled without excluding younger. **Decide with data you can get free this month:** the friend interviews (§8) + which example offerings (§7) generate actual "I'd want that" reactions. This was also flagged after the Cole call prep (2026-08-10) — it's now the #1 strategy thread.

## 3. The new starter framing (from coaching) — and the flag on it

Three pillars, in plain words:

1. **Locals-only discounts** — member perks at neighborhood businesses.
2. **Community-based services** — the vetted person, not the anonymous marketplace: mover, handyman, music teacher, dog walker.
3. **Buy & sell with trusted neighbors** — the existing furniture/goods marketplace.

This is a *clearer, warmer* pitch than "private classifieds" — it describes a life upgrade, not a website. **But flag it honestly: this is a scope shift.** `mvp-spec.md` says apartments + furniture; services and discounts are currently OUT of v1. Discounts are an entirely new mechanic (business-side relationships). Before any build work follows this framing, it needs a reconciliation decision: is this new *positioning language* over the existing product, or a new *category roadmap*? Recommendation: treat it as positioning + category *sequencing* input for now — validate via §7/§8 before touching the spec. (Note: the listing form already supports "Service" and "Other" types since migration 0019 — the software mostly permits this already; it's a strategy decision, not a build.)

## 4. The growth math (the geometric expansion question)

The honest arithmetic on referral growth, using your existing structures:

- Let **m** = members, and each member successfully brings in **r** new members per cycle. Growth per cycle is ×(1+r). With the outreach kit's ritual — every member is asked for **3 names** — realistic conversion is the crux: if half the names are approached and half of those convert, **r ≈ 0.75**.
- **From 20 seed members:** r=0.5 per month → 20 → 30 → 45 → 68 → 101 in 4 months. r=0.75 → 20 → 35 → 61 → 107 in 3 months. Even modest r compounds fast — **the year-end target (50–100 members) needs only r≈0.5/month from a September seed of 20.** No blitz required.
- The bottleneck is deliberately *not* referrals — it's **your approval throughput and the quality bar**. At r=0.75 you'd be reviewing ~15–25 applications/month by November. That's fine solo; it's also the natural brake that keeps strictness credible.
- **The practical rule this yields:** every approval conversation ends with the 3-names question (bench them all), invite max ~5/week (already the tracker rule), and let the composition scoreboard — not the math — decide who from the bench gets approached. The math says the engine is sufficient; discipline on the ritual is everything.

## 5. Cole — what she actually said, distilled, and the partnership

From the voice notes (cleaned):

- **Community build = semi-grassroots, bottom-up.** Start with friends who'd sign up and list *as a favor*. She can immediately think of things she'd list herself (→ she's founding-member material, not just a hire).
- **Nail the invitation language first** — the invite should feel elegant, make the person feel important, let them into something they can't get elsewhere. The invitation IS the brand's first surface.
- **What you're selling is taste/POV.** Her read on where influence is going: oversaturated influencer market → the next wave is knowledge, expertise, actual point of view. Manhattanite's curation *is* the product people buy into (her comps: The RealReal-type collectives, luxury e-commerce where people buy a caliber of life). The barrier to entry plus your taste = the offer.
- **Working terms:** ~decade of client marketing work; retainer or per-project depending on need; explicitly no pressure — "keep talking about your hopes and dreams for this and see if we land somewhere useful."

**On the partnership you want:** her posture invites a light formalization, not a heavy one. Suggested shape to propose: a **defined pilot** — e.g., a small monthly retainer or a fixed per-project fee for one scoped deliverable ("the invitation": membership messaging + invite language + launch of the first grassroots wave, 4–6 weeks) — with an explicit review at the end before anything bigger. That respects her "one step at a time," gives you a real deliverable, and doubles as the mutual fit test the call-prep doc suggested (no-ads posture, first-90-days thinking). Draft proposal on request.

## 6. Design — the "too AI" verdict and what it changes

Taking the verdict at face value: the system is coherent but reads generated — and you want human taste on it. What this changes *today*:

- **Freeze the open design decisions** (serif call, accent call, further polish slices). Don't spend more cycles refining a direction a professional may redirect.
- **Your paperwork is now the designer's brief, and it's ready:** brand-guide v2 draft + photography rules + the steal sheet + the design audit/re-grade + before/after screenshots. That package is exactly what a designer needs to quote against. Very little is wasted — even if they redesign, the tokens/decisions record is the input.
- **Scope to buy:** realistic engagement is identity + art direction + key-screen redesign (landing, card, detail), implemented in the existing codebase — not a rebuild. Where to look: the ICW orbit (Manhattan editorial/brand studios), designers behind comparable membership brands, or Cole's network (first ask — she's worked with Zero Bond).
- **Action:** shortlist 3 designers/studios + budget range. I can research candidates in a future session.

## 7. The 3–5 example offerings (coaching action item — drafts to react to)

Candidates across the pillars, drawn from people already in your orbit:

1. *(Service)* **Cody the dog walker** — already in the tracker as a "neighborhood node." A vouched dog walker is a perfect trust-product demo.
2. *(Service)* **A vetted mover or handyman** from your circle — the single most trust-broken everyday transaction in NYC.
3. *(Buy/sell)* **Cole's first listings** — she said she can immediately think of things she'd list. Ask her to be listing #1 of the grassroots wave.
4. *(Discount)* **One neighborhood business you personally know** (coffee, framing, dry cleaning — East Village) offering a simple members-only perk. One is enough to prove the pillar.
5. *(Service, and it's free)* **Music lessons by George** — your Income project is literally a community-based service; listing it makes the founder the proof-of-concept.

## 8. Friend interviews — the script

Five friends, ten minutes each (can be the same coffees as seed outreach). Ask: (1) "When did you last get burned or nearly burned buying/selling/hiring in the city?" (2) "What would you *look for* on a members-only Manhattan site — first thing you'd search?" (3) "Which of these three grabs you: local discounts, vetted services, buying/selling with vouched neighbors?" (4) "What would make an invite to this feel special vs spammy?" (5) the standing closer: "Who are the three Manhattanites you'd vouch for?" — every answer feeds the audience question (§2), the pillar test (§3), and the bench.

## 9. Slogan — punchy candidates

Current working tagline: "New York's trusted private marketplace" (accurate, not punchy). Candidates to test in the friend interviews — say them out loud, watch faces:

- **"No scams, no spam, no strangers."** (already in your copy; it's the punchiest thing you own)
- **"Every member vouched for."**
- **"Manhattan, vouched for."**
- **"The marketplace where people behave."** (your own line from the skeptic pitch)
- **"Small on purpose."** (best as the second line, not the slogan)

Recommendation: don't lock one this month — collect reactions alongside the pitch variants already drafted in `Manhattanite_One-Line-Pitch_v1.md`.

## 10. The plan

**Today (Thu Aug 13) — the anchor day, unchanged:** the Week 12 must-hit comes first. RLS audit + Sentry/Plausible/Resend — runbook is ready (`mvp-build-project/outputs/Manhattanite_Week-12-Hardening_Claude-Code-Prompt_v1.md`). Strategy reading is for after 16:00 or the evening; don't let this doc eat the code block.
**Friday Aug 14:** hardening overflow + 15 minutes: react to §7's five offerings, pick the 5 interview friends.
**Weekend (make-up rule available):** if hardening slipped, Saturday morning covers it. Otherwise: message Cole proposing the pilot-scope conversation; 1–2 friend interviews.
**Pre-Newport (Mon 17–Tue 18):** remaining friend interviews; designer shortlist ask to Cole; docs tidy.
**Newport (Aug 19–24):** off. The audience question (§2) is good beach thinking; nothing else travels.
**Post-Newport (Week 14, Aug 25+):** decide the audience + pillar reconciliation with interview data in hand; formalize Cole; kick off designer conversations; resume seed approvals under the strictness banner. The original "ready by end of August" target holds in substance — the product is ready; what lands in September is the *go-to-market posture*, sharpened by these decisions.

---

*Filed by Cowork from George's dump + Cole voice notes + Strawberry.me session notes. Decisions in §1 logged to project memory; §2/§3 remain open threads pending the interview data.*
