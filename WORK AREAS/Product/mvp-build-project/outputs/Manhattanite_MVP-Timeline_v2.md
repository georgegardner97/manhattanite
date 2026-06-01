# Manhattanite — MVP Work Timeline (v2)

**Re-anchored:** 2026-05-27 · **Target:** show-able working product by end of August 2026 · **Total runway left:** ~14 weeks

This replaces the v1 timeline (2026-05-18). Same destination, same realism. Three things changed since v1, all reflected below.

**What changed since v1:**

1. **We're slightly ahead on infrastructure.** Supabase is already wired and proven in production (Slice 1, May 18) — that was originally a Week 1 must-hit. Phase 0 admin (env vars, landing-page decision) is closed.
2. **Auth is now email + password, not magic link** (your call, May 27). That adds a forgot-password reset flow to build. Reflected in the foundation phase.
3. **A dedicated Design Foundation slot is now explicit** — a lightweight visual-system mini-phase between the trust wall and the listing screens, so listings get built into a styled shell instead of being retrofitted later. This is the one genuinely new block vs v1. See the note on the buffer trade-off at the bottom.

**The one rule of slippage:** if a week slips, scope is cut from later phases (polish, seed content, brand surfaces). Never from auth, the Tier 1/Tier 2 wall, or RLS. The trust gate is the product.

---

## ✅ Already done (Phase 0 + Phase 1 Slice 1)

- Infra closed: GitHub repo, Vercel project, manhattanite.com live, Resend verified, accounts created.
- Supabase wired end-to-end and proven (`/supabase-test` passes in production).
- Env vars restored; landing-page decision locked (keep the waitlist page until there's something real to replace it with).

**← You are here.** Next build action is tomorrow's auth block.

---

## Phase 1 — Foundation: auth + the trust wall

The wall between Tier 1 (Account) and Tier 2 (Member) is the product. Get it enforced at the database layer before anything is built on top of it.

### Week of May 25–31 (current) — Auth (Slice 2)
**Must-hit:** A stranger can sign up with email + password, an `accounts` row is created, and they can log back in.

- `accounts` table + auto-create trigger + first RLS pass.
- `/signup`, `/login`, session middleware, `/profile`.
- Forgot-password reset flow (the stretch — first thing to defer if the block runs short).
- *(This is tomorrow's two-hour block — full plan is in the Daily Plan page.)*

### Week of Jun 1–7 — The trust wall
**Must-hit:** A logged-in Account cannot reach Member-only data — at the database level, not just the UI.

- Member-only route guards (server-side checks against `is_member`).
- Account dashboard: shows current tier + an "Apply for membership" link (placeholder).
- RLS policies on every table that exists so far; manual test with a synthetic Account user.
- Finish the reset flow here if it slipped from last week. Document the policies in `tech-architecture.md`.

---

## Phase 1.5 — Design Foundation (lightweight) · NEW

### Week of Jun 8–14 — Set the visual bones, once
**Must-hit:** A small design system exists, so every page built after this inherits the right look automatically.

- Base type scale, color tokens (black + cream; brick reserved), spacing, and the core components: button, form field, card.
- Restyle the auth + profile pages to use it (cheap — they were built plain on purpose).
- Confirm the wordmark direction (already live on the homepage) carries through.
- **Not** the bespoke homepage or finished listing-card art direction — that heavy work stays in Phase 5. This is just the shell.

*Why here:* designing in a vacuum before screens exist wastes effort; building a dozen ugly pages and restyling at the end is an expensive retrofit. Setting the bones now is the middle path — and it means the listing screens you build next already look like Manhattanite.

*Design is treated as iterative, on purpose.* The look is expected to change a lot as we go, and the plan stays open to that. Tokens + shared components mean a visual change is made once and propagates everywhere — so restyling is cheap and nothing is "locked." The stable layer underneath is the plumbing (auth, trust wall, database), which doesn't care what the site looks like. Restyle freely on top.

---

## Phase 2 — Membership: apply + approve

### Week of Jun 15–21 — Application flow
**Must-hit:** A signed-in Account can submit a membership application and the row lands in both Supabase and Airtable.

- `applications` table + application form (questions per `mvp-spec.md`).
- Dual-write to Supabase **and** Airtable (seed-phase review queue).
- Confirmation email via Resend.

### Week of Jun 22–28 — Approval flow
**Must-hit:** You can approve an applicant and they actually become a Member.

- Approval handler: Airtable status flip → flips `accounts.is_member`, writes `sponsor_id`, writes a `sponsorships` row.
- Approval email ("You're in.").
- Smoke test: apply as a test account → approve → confirm it now passes the Tier 2 gate.

**End of Phase 2:** the membership loop is closed end-to-end.

---

## Phase 3 — Listings: Apartments

### Week of Jun 29–Jul 5 — Posting
**Must-hit:** A Member can post an apartment listing.

- `listings` table (`type` enum + JSON `details`); apartment fields in JSON.
- Post-listing form (Members only — RLS enforced).
- Image upload via Supabase Storage, resized on upload.

### Week of Jul 6–12 — Browsing
**Must-hit:** Any Account can browse apartment listings and open a listing detail page.

- Listings index + detail page (apartments), built into the styled shell from Phase 1.5.
- RLS audit: browsing fine for Accounts; the contact button is Member-only.

---

## Phase 4 — Listings: Furniture + contact

### Week of Jul 13–19 — Second category
**Must-hit:** Both Apartments and Furniture are postable, browseable, viewable; the form switches fields by category.

- Add `furniture` to the type enum + its JSON details.
- Post-form switches fields on category change; index + detail handle both; category toggle (Apartments / Furniture / All).

### Week of Jul 20–26 — Contact
**Must-hit:** A Member can contact another Member about a listing, and a moderation record is written.

- Contact form on each detail page (Members only) → Resend email with reply-to set to the contacter.
- `listing_contacts` row for moderation history; rate-limit per listing.

**End of Phase 4:** the core loop works — sign up → apply → approve → post → browse → contact.

---

## Phase 5 — Brand + seed content (the bespoke design)

### Week of Jul 27–Aug 2 — Brand surfaces
**Must-hit:** The waitlist page is replaced by the real gating-page homepage; brand applied across every surface.

- Implement the gating page from `voice-and-copy.md` as the new homepage.
- Final wordmark + palette confirmation; the bespoke art direction on homepage + listing cards.
- American-spelling pass across every user-facing string.

### Week of Aug 3–9 — Seed content + polish
**Must-hit:** A stranger landing on Manhattanite would believe it's a real product.

- 10+ example apartments, 15+ example furniture listings (clearly labeled "example").
- Real bios on 8+ seed member profiles.
- Loading / error / success states on every form; Manhattanite-voiced empty states.

---

## Phase 6 — Hardening

### Week of Aug 10–16
**Must-hit:** The trust gate cannot be bypassed.

- Full RLS audit on every Member-only table with a synthetic Account user.
- Sentry capturing prod errors; Plausible verified on every page; Resend deliverability (DKIM / SPF / DMARC).

---

## Phase 7 — Pre-launch

### Week of Aug 17–23
**Must-hit:** Ready to invite the first cohort. Terms + privacy + guidelines live.

- TOS + privacy policy + community guidelines, footer-linked.
- Light legal review (lawyer engagement has been planned around this point).
- Full copy review against the `voice-and-copy.md` five-point test.
- Cold QA pass on every flow: sign-up, application, approval, posting, browsing, contact.

---

## Phase 8 — Soft launch

### Week of Aug 24–30
**Must-hit:** Real users on real product, invited from your network. **Not a public launch.**

- Invite 10–25 people from your real network (sponsor: you, by default).
- Watch the moderation queue; review every application manually.
- Fast bug response, no new features. Capture friction for the v1.5 spec.

---

## The honest trade-off you should know about

Adding the Design Foundation slot (Phase 1.5) is the one real cost vs the v1 plan: it pushes everything down by roughly a week, which eats into the slippage buffer the v1 plan had reserved at the end of August.

Two ways to handle that, your call:

1. **Keep design foundation lightweight (recommended).** Treat Phase 1.5 as 2–3 focused sessions, not a full week of effort — set the bones and move on. Done that way it largely overlaps the tail of the trust-wall week and the buffer survives.
2. **Give design its own full week and accept no buffer.** More breathing room for the look, but a bad week or a band-heavy stretch then pushes the soft launch into September. Given the band and life are already in the mix, I'd not spend the buffer this early.

Either way, the heavy bespoke design (homepage, listing-card art direction) stays in Phase 5 where it belongs — Phase 1.5 is just enough to stop you building listings into an ugly shell.

---

## Reality checks

- **One must-hit per week.** Hit just that and the timeline still ships.
- **Auth + wall get ~2 weeks, not one** — underestimating these is the classic way this kind of timeline blows up.
- **No new features after Phase 6.** Hardening and launching what exists, not adding.
- **Furniture reuses apartment primitives** — if you need to claw back the buffer, that's the week most likely to compress to one.
- **The band, life, and bad weeks** are absorbed by keeping each week to a single deliverable.

---

*Drafted 2026-05-27. Supersedes Manhattanite_MVP-Timeline_v1.md. Owner: George. Revise at the end of each phase or whenever reality diverges materially.*
