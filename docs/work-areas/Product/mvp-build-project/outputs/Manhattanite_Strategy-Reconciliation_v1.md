# Manhattanite — Strategy Reconciliation

A side-by-side comparison of:

- **OLD:** `STRATEGY.md` from `~/Developer/manhattanite/` (written 2026-05-06, ~26KB)
- **NEW:** the `COMPANY/` folder built in Cowork on 2026-05-16/17

Goal: surface where they agree, where they diverge, and what the merged best-version looks like. George decides.

---

## Where they agree (no decision needed)

Both strategies converge cleanly on:

- **Trust is the product.** Both frame trust as the moat — not aesthetics, not features.
- **Gens de Confiance is the inspiration**, but only the trust architecture, not the literal French model.
- **Manhattan-first geographic focus.** Apex domain. NYC-native voice. No Brooklyn-centric framing.
- **Anti-Craigslist / anti-Facebook-Marketplace positioning.** Both define the enemy clearly.
- **Real identity, no anonymous accounts.** Both reject pseudonyms.
- **Apartments and furniture are core categories.** Both agree these are the strongest wedges.
- **Manual moderation is non-negotiable, especially early.** Both say this explicitly.
- **No paid ads.** Both reject the standard growth playbook.
- **Founder-led trust at seed.** Both expect George to manually approve early members.

This is a large overlap. The two strategies share the same backbone.

---

## Where they genuinely diverge (need decisions)

Five real choice points. Each one materially changes the product.

### Divergence 1 — Trust mechanic: score vs binary gate

| | OLD (STRATEGY.md) | NEW (COMPANY/) |
|---|---|---|
| Structure | **Trust score** that builds over time | **Binary tier**: Account vs Member |
| Components | Phone +10, LinkedIn +15, transaction +15, etc. | One application, one approval, one sponsor |
| Membership ladder | 4 tiers: Explorer / Verified / Trusted / Connector | 2 tiers: Account / Member |
| Sponsor accountability | Referrer notified after 2 strikes; loses invite after 3 | Graded ladder: Good standing → Watch → Probation → Removed |

**Implications.** The OLD is more sophisticated and more honest (real trust is graded). It requires more product work (tier upgrade flows, score display, tier-specific privileges). The NEW is simpler and shippable in 14 weeks, but loses the nuance of "I trust you a little, you've earned more access."

**Recommendation:** Start with the NEW binary model for MVP (faster to ship), but architect it so we can evolve into the OLD score model in v2. The four-tier system is a v2/v3 product, not an MVP. But the *direction* of travel should be the score system, not the binary one — long-term, "trust as a score" is more defensible.

### Divergence 2 — Launch categories: 2 vs 4

| | OLD | NEW |
|---|---|---|
| Categories at launch | **Apartments + Furniture + Jobs + Services** | **Apartments + Furniture** |
| Jobs | Launch category | v2 |
| Services | Launch category | Later |

**Implications.** OLD assumes broader launch makes the marketplace feel alive faster. NEW assumes narrower scope means we can actually ship in 14 weeks and not stretch thin.

**The real question:** is the engineering effort to add Jobs at launch large enough to push the build past August 2026? My honest read: yes, probably. Jobs has a different listing structure (no price, has duration, employer info), different review criteria, and different user behavior (employer vs candidate). It's not a free addition.

**Recommendation:** Stick with NEW's tighter scope (Apartments + Furniture only) for the MVP. Add Jobs in v1.5 (~Q4 2026). Note in roadmap that Services is the third category, not Jobs, because services maps more naturally to the existing peer-to-peer pattern.

### Divergence 3 — Monetization model

| | OLD | NEW |
|---|---|---|
| Free tier | Browse, limited messaging | Browse only (full visibility) |
| Paid membership | $12/mo Verified, $29/mo Premium | None — membership is always free |
| Listing fees | $15–$40 housing, $20–$100 jobs | $25/listing (after free monthly cap) |
| Business accounts | $99–$499/month for brokers / recruiters | Not addressed |
| Timing | Multiple revenue streams from launch | Free until Cohort 3, then pay-per-post only |

**Implications.** OLD goes after multiple revenue streams aggressively; NEW is conservative and prioritizes growth. OLD's paid membership model is bold but unproven; NEW's free-membership-forever is safer but caps revenue.

**Recommendation:** NEW's "free membership forever, monetize through listings and possibly later business accounts" is the right MVP and early-Cohort posture. OLD's paid-membership idea is worth keeping as a v3 possibility, but not at MVP. Add OLD's business-account concept ($99–$499/mo for brokers/recruiters/agencies) as a v2 revenue stream worth exploring.

### Divergence 4 — Brand tone: utility vs aesthetic

| | OLD | NEW |
|---|---|---|
| Brand instinct | "Local, sharp, socially intelligent, useful, discreet" | "Refined, confident, editorial, Soho House" |
| Reference set | (Implicit — Gens de Confiance, NYC) | Mr. Porter, Soho House, Raya, Casa Magazines, Le Labo, The New Yorker |
| Tagline direction | "The trusted local operating system for Manhattan life" | "New York's trusted private marketplace" |
| Framing | "**Invite-worthy because useful**" (rejects exclusivity-as-vibe) | More aesthetic / lifestyle / cultivated |
| Voice | Utility-leaning | Status-leaning |

**This is the biggest divergence and the one only you can call.** They imply different products even with identical mechanics.

The OLD position warns explicitly against "exclusive marketplace for cool people" — it argues the brand should feel useful first, exclusive second. The NEW position leans the other way: cultivated, member-aware, aesthetically refined.

Both are coherent. Neither is wrong. They attract different members.

**Recommendation: this is a personal decision, but my honest steer is "useful, in an aesthetic package."** Take OLD's positioning principles (utility-first, anti-clout, "invite-worthy because useful") and dress them in NEW's aesthetic vocabulary (Soho House voice, editorial typography, Le Labo restraint). The product *does* better things; it just *looks* like a Soho House email.

That gives you the OLD's strategic durability with the NEW's brand polish. Without that synthesis: NEW alone risks "expensive-looking thing that doesn't solve a problem"; OLD alone risks "useful-but-ugly Craigslist-ish thing."

### Divergence 5 — Tech stack: Airtable vs Supabase

| | OLD (current code at ~/Developer/manhattanite/) | NEW (planned in tech-architecture.md) |
|---|---|---|
| Database | Airtable | Supabase (Postgres) |
| Auth | Not built yet | Magic link via Supabase Auth |
| Email | Resend | Resend (same) |
| Hosting | Vercel + Next.js 16 (same) | Vercel + Next.js (same) |
| Security primitive for tiers | Not yet — waitlist only | Row-Level Security on every member-only table |

**Implications.** Airtable is brilliant for a waitlist (no-code, easy to view/sort/filter applications manually). It is not the right database for a real marketplace with auth, RLS, complex queries, or eventual scale. The decision in tech-architecture.md to use Supabase is well-reasoned and shouldn't be reversed.

**Recommendation:** Migrate from Airtable to Supabase once we move beyond the waitlist phase, but **keep Airtable as the application review tool during the seed phase** — applications can flow into both Airtable (for George's manual review UI) and Supabase (for the actual member record). That preserves the working integration without compromising the long-term architecture. Sunset Airtable when the admin review UI is built into the product (likely v1.5 or v2).

---

## The synthesized position

If you accept the recommendations above, the resulting product is:

**A private NYC marketplace with a binary trust gate at MVP (evolving toward a graded trust-score system in v2), launching with apartments and furniture, monetized only through listing fees after a free tier, dressed in an editorial Soho-House voice but positioned around utility and outcomes, not exclusivity-as-vibe.**

That's a stronger, more durable position than either strategy on its own.

---

## What stays from each

### Keep from OLD (STRATEGY.md)
- The Gens de Confiance analysis in full (deeper than COMPANY/ has)
- The "trust score" architecture as the v2 product direction
- The four-tier membership ladder as a v3 concept
- The operational blueprint detail (referral mechanics, violation tiers, enforcement model)
- The "invite-worthy because useful" framing
- The recommendation to launch with cohort-based onboarding (by neighborhood or profession)
- The principle of monetizing seriousness, not access
- The working code and integrations (Next.js scaffold, form, Resend, Airtable)

### Keep from NEW (COMPANY/)
- The detailed brand guide (visual identity, typography, palette)
- The detailed voice and copy guide (vocabulary, banned words, CTAs)
- The PA rules
- The 14-week MVP build timeline
- The locked tech architecture decisions (Next.js + Supabase + RLS + magic link)
- The mvp-spec with binary two-tier model and explicit cuts
- The GTM playbook with three-phase model
- The trust-and-moderation operational rules
- The legal-and-policy open-questions map

### Drop from both
- The current waitlist landing page copy at ~/Developer/manhattanite/ (we're not running a waitlist anymore — we're going straight to "Account + apply for membership")
- The Airtable-as-primary-database assumption (Airtable becomes a review tool, not the database)

---

## What this means for the build environment

If George accepts this synthesis, the practical implications:

1. **Use `~/Developer/manhattanite/` as the build foundation.** It has working code, working integrations, real git history, and is already deployed (until we replaced its GitHub repo today).
2. **Move COMPANY/ docs into Developer/manhattanite/.** Same structure as we set up in Projects/: `docs/COMPANY/`, `docs/work-areas/`.
3. **Add STRATEGY.md to docs/COMPANY/** as `strategy-blueprint.md` or similar — preserve it as reference reading for future Claude sessions.
4. **Update CLAUDE.md** to reflect the synthesized position and point at both old and new documents.
5. **Reconnect to the new GitHub repo** (force-push Developer/'s history into the empty new repo, or start a fresh history that incorporates both).
6. **Delete or archive `~/Projects/manhattanite/`** — it served as a scratch space today and we no longer need it.
7. **Update Vercel** to deploy from this folder (it already does, just verify after the GitHub reconnect).

---

*Created 2026-05-17 by reviewing STRATEGY.md (`~/Developer/manhattanite/STRATEGY.md`) against the COMPANY/ folder.*
