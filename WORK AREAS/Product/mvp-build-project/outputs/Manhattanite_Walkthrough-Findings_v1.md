# Manhattanite — Live-Site Walkthrough Findings

**Date:** 2026-06-09
**Context:** The agreed "explore the live site" checkpoint, run at the end of /apply Slice C (first time the full visit → account → apply → approve → post loop works end to end). George clicked through manhattanite.com as a real Tier-1 account (`george.gardner480@gmail.com`, non-member) and surfaced reactions. Findings below are sorted by type, with each claim checked against the actual code/RLS where relevant.

---

## The headline

Two things stand out above the rest of the list:

1. **There is no navigation.** No global header, no menu, no back links — confirmed: no nav/header component exists anywhere in the codebase. Every page is an island you can only reach by typing a URL. This is why almost everything feels "off." Most of section A below is really one fix.

2. **Listings are view-only for everyone — even members.** The contact feature isn't built (the Contact link on the listing page is deliberately commented out; no contact route, no `listing_contacts` table). A member's only extra power today is *posting*. The "capture the value" half of Tier 2 — contacting, responding — is the biggest functional gap. Per spec it's a planned v1 slice (contact form → Resend email, no in-app inbox), just not shipped.

---

## A. Functional gaps — things to build (verified real)

| # | Finding | Status in code | Fix |
|---|---------|----------------|-----|
| A1 | **No global navigation / no back button** | No nav or header component exists | Build a persistent nav: Home / Listings / Profile, plus "Post a listing" for members and back links on sub-pages |
| A2 | **No "my listings" view; can't edit/manage your own posts** | RLS *allows* author edit/delete; there is no UI for it | Add a "My listings" view + edit/delete controls |
| A3 | **A logged-in non-member can't find Browse** | RLS *allows* Tier-1 to read published listings; there's just no link to `/listings` from `/profile` | Add a Browse link (folds into A1) — this is discoverability, not access |
| A4 | **Member interaction (contact) not built** | Contact link commented out; no route; no `listing_contacts` table | Build the v1 contact slice: contact form → Resend email to the lister |
| A5 | **Signup captures email + password only — not name** | `app/signup/page.tsx` has no name field; account identity falls back to the email until the user edits their profile or applies | Add a Name field to signup and write it to `accounts` |
| A6 | **No images on the listings** | Image upload *is* built; the 2 founder listings are simply text-only (no photos uploaded) | Load real seed listings with photos |

## B. Copy

| # | Finding | Note |
|---|---------|------|
| B1 | Dislikes the "Who are you?" profile-edit copy | Rework in the copy pass |
| B2 | Account vs. membership distinction isn't clear | Users don't grasp that a free account and approved membership are two different things — needs clearer framing in copy + flow (see D3) |

## C. Design / visual — explicitly deferred ("can come later")

| # | Finding | Note |
|---|---------|------|
| C1 | Overall look & layout not loved | Phase 1.5 design workstream |
| C2 | Native date picker on `/listings/new` looks rough | Replace with a styled date component |
| C3 | Landing / gating page design | Already flagged for Phase 1.5 rework |

---

## D. Strategic decisions — referred to the Gens de Confiance (GDC) model

These aren't bugs; they're product-direction calls. George explicitly asked to weigh them against GDC.

### How GDC actually works (researched 2026-06-09)
- **Anyone can register freely.** Free registration is the low-friction top of the funnel.
- **You must be a member to *respond to* or *publish* ads** — and membership requires being sponsored by **three** existing members.
- **Sponsors are accountable** for the people they vouch for.
- **All ads are moderated** by a team before publishing.
- GDC's signature trust feature is showing **how you're connected** to a poster through your network (the "circle of trust" / connection chain).

### D1 — Should logged-out visitors see listings? → **DECIDED 2026-06-09: teaser + three-tier action-gated model**
- **Current Manhattanite:** No. The RLS policy requires an account to see *any* listing (`auth.uid() is not null`) — the "Tier 0 → Tier 1 gate." Stricter than GDC.
- **DECISION (George, 2026-06-09):** adopt a **three viewing-layer model where the trust gate sits at the ACTION layer, not the VIEWING layer:**
  - **Visitor (logged out):** *teaser* — a limited set of listings + the pitch. Job: make an account. *(This is the RLS change from today's "see nothing.")*
  - **Account (Tier 1):** sees **everything**, full detail; can **act on nothing** (no contact/post/sponsor). It's an **on-ramp/conversion step, not a destination** — user value = "browse the whole catalogue"; business value = captured email + raised hand + the object membership attaches to. Job: apply for membership.
  - **Member (Tier 2):** contact sellers, post, sponsor (+ v2 trust connections).
- **Why this answers "what's the point of an account but not a member?":** the account is the funnel + the application container (you must be an account before you can apply; the application writes to it, approval flips it). Two nested hooks: teaser → want an account; full browse → want to *act* → worth the social cost of being sponsored. Mirrors GDC exactly.
- **Guardrail:** never give Tier 1 transactional power to "thicken" it — that dismantles the moat. Keep the teaser genuinely limited; make the copy sell the account as "the lobby, not the building."
- **Build implication:** this reshapes the RLS (`listings_read_*`) and the logged-out experience, and it must be settled before the navigation slice — done. Full entry in `COMPANY/memory/decisions.md`.

### D2 — Mutual connections via sponsors (GDC trust-chain)
- This is GDC's hallmark and it **already lives in Manhattanite's long-term vision** — the graded trust score / "Connector" tier in `strategy-blueprint.md`. It is explicitly **post-MVP** (the MVP is the binary Account/Member gate; graded trust + connections is v2). So: great instinct, already on the roadmap, not now.

### D3 — Make "account vs. membership" unmistakable
- Overlaps with B2 but it's also an information-architecture / flow problem, not just wording. GDC keeps it clear: "register free" vs. "get sponsored to become a member." Manhattanite needs the two tiers to read as obviously distinct in the UI and the journey.

---

## Suggested sequencing (for discussion, not decided)

1. **Navigation slice** (A1 + A3 + A2-lite) — the highest-leverage fix; makes everything else feel coherent. Likely the next build slice.
2. **Contact slice** (A4) — wires up the "capture the value" half of membership. The biggest *product* gap; it's already a defined v1 slice.
3. **Signup name** (A5) — small, high-clarity fix; bundle with the copy pass (B1, B2).
4. **Seed listings + photos** (A6) — unlocks the *second* checkpoint, the "does it look finished" walkthrough.
5. **Phase 1.5 design** (C1–C3) — layout, date picker, landing/gating page.
6. **Strategic decisions** — D1 (public browse) **DECIDED 2026-06-09: teaser + three-tier action-gated model** (see D1 above + decisions.md). D3 (clarify account vs. membership) folds into the copy pass. D2 (trust connections) is v2.

*D1 is settled, so the navigation slice is unblocked. The nav must be built around the three-tier model: a teaser browse for logged-out visitors, full browse for accounts, action controls (post/contact/sponsor) for members only.*
