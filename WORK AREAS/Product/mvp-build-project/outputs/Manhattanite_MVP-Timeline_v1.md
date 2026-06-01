# Manhattanite — MVP Work Timeline

**Start:** 2026-05-18 (today) · **Target:** show-able working product by end of August 2026 · **Buffer:** final week of August · **Total:** 14 weeks + 1 slippage week

This is a realistic week-by-week plan. Not aspirational. Built around the reality that you're non-technical, building with Claude Code, balancing the band, and that auth + RLS always takes longer than expected. Every week has one **must-hit** deliverable. Everything else is bonus.

**The one rule of slippage:** if a week slips, scope is cut from later phases (polish, seed content, brand surfaces). Never from auth, the Tier 1/Tier 2 wall, or RLS. The trust gate is the product.

---

## Phase 1 — Foundation (Weeks 1-3): auth + the trust wall

The wall between Tier 1 (Account) and Tier 2 (Member) is the product. Get this enforced at the database layer before anything else gets built on top of it.

### Week 1 · 2026-05-18 → 05-24 (current week)
**Must-hit:** Close out the live waitlist admin items so we can move forward cleanly. Get Supabase project provisioned and connected to the repo.

- Test the live application form end-to-end (open manhattanite.com incognito, submit, watch for email + Airtable row). **First-thing tomorrow per project memory.**
- Add `RESEND_API_KEY` and `AIRTABLE_API_KEY` to Vercel **Preview + Development** environments (currently only on Production).
- Lock the landing-page decision: keep current waitlist / replace with gating page / hybrid (Option C recommended).
- Spin up Supabase project. Connect to the Next.js repo. Confirm `.env.local` and Vercel both wired.
- Verify Resend can send from `info@manhattanite.com` to a test address from the new Supabase-aware path.

**Why this week:** none of the build matters if the form is broken and the env is half-configured. Close the open loop first.

### Week 2 · 05-25 → 05-31
**Must-hit:** A stranger can sign up with magic link and an `accounts` row gets created.

- Build the `accounts` table schema (with `is_member` boolean defaulting false).
- Wire magic-link auth via Supabase Auth.
- Build the sign-up + sign-in routes. Magic link in, redirect to account dashboard placeholder.
- First pass of RLS on the `accounts` table.

**Why this week:** auth is the floor. Everything above it depends on knowing who's logged in.

### Week 3 · 06-01 → 06-07
**Must-hit:** The Tier 1 / Tier 2 wall is enforced. A logged-in Account cannot reach Member-only routes — at the database level, not just the UI.

- Build Member-only route guards (server-side checks against `is_member`).
- Build the basic account dashboard: shows current tier, link to apply for membership (placeholder).
- RLS policies on every table that exists so far, enforcing the wall. Manual test: log in as fake Account → confirm Member-only data is invisible at the database response level.
- Document the RLS policies in `COMPANY/tech-architecture.md`.

**Why this week:** if the wall isn't load-bearing at the database, an MVP bug or a UI mistake leaks the value the product is supposed to gate. Get this right before you build anything on top of it.

---

## Phase 2 — Membership (Weeks 4-5): the apply-and-approve flow

### Week 4 · 06-08 → 06-14
**Must-hit:** A signed-in Account can submit a membership application and the row lands in both Supabase and Airtable.

- Build the `applications` table.
- Build the membership application form (questions per `mvp-spec.md`).
- Submission writes to Supabase **and** Airtable (dual-write during seed phase).
- Confirmation email via Resend to the applicant.

### Week 5 · 06-15 → 06-21
**Must-hit:** You can approve an applicant from Airtable and they actually become a Member.

- Build the approval handler: Airtable status flip → webhook or polling → Supabase transaction that flips `accounts.is_member = true` and writes `accounts.sponsor_id`.
- Approval email via Resend ("You're in.").
- `sponsorships` row also written for queryability.
- Manual smoke test: apply as a test account → approve → verify the test account now passes the Tier 2 gate.

**Why this phase:** without approval flow, "Member" is a database flag with no path to. By end of W5 the membership loop is closed end-to-end.

---

## Phase 3 — Listings: Apartments (Weeks 6-7)

### Week 6 · 06-22 → 06-28
**Must-hit:** A Member can post an apartment listing.

- Build the `listings` table with `type` enum + JSON `details` column.
- Apartment-specific fields in JSON (per `mvp-spec.md`).
- Build the post-listing form (Members only — RLS enforced).
- Image upload via Supabase Storage. Resize on upload.

### Week 7 · 06-29 → 07-05
**Must-hit:** Any Account can browse apartment listings and view a listing detail page.

- Build the listings index page (apartments only for now).
- Build the listing detail page.
- RLS audit: browsing is fine for Accounts, contact form is Member-only.
- First brand-aligned visual pass on these pages.

---

## Phase 4 — Listings: Furniture + contact (Weeks 8-9)

### Week 8 · 07-06 → 07-12
**Must-hit:** Both Apartments and Furniture are postable, browseable, viewable. The post-form switches its details fields based on category.

- Add `furniture` to the `type` enum and the JSON schema for its details.
- Update the post-listing form to switch fields when category changes.
- Update the index and detail pages to handle both types.
- Filter toggle on the index page (Apartments / Furniture / All).

### Week 9 · 07-13 → 07-19
**Must-hit:** A Member can contact another Member about a listing, and a moderation record is written.

- Build the contact form on each listing detail page (Members only).
- Submission → Resend email to the lister with reply-to set to the contacter.
- `listing_contacts` row written for moderation history.
- Cooldown / rate-limit on contacts per listing.

**End of Phase 4:** core product loop works. Sign up → apply → approve → post → browse → contact.

---

## Phase 5 — Identity (Weeks 10-11): brand + seed content

### Week 10 · 07-20 → 07-26
**Must-hit:** The waitlist landing page is replaced with the proper gating page. Brand applied to every public surface.

- Implement the gating page from `voice-and-copy.md` as the new homepage.
- Apply `brand-guide.md` to: sign-up, application, account dashboard, listings index, listing detail.
- Real wordmark + final palette decision (deferred from earlier weeks).
- American spelling pass across every user-facing string.

### Week 11 · 07-27 → 08-02
**Must-hit:** Anyone landing on Manhattanite would believe it's a real product.

- Seed 10-15 clearly-labelled example listings across both categories (clearly tagged "example" — not deceptive).
- Real bios on a small set of seed Member profiles.
- Polish UX on every form (loading states, error states, success states).
- Empty-state copy that sounds like Manhattanite, not a SaaS.

---

## Phase 6 — Hardening (Week 12)

### Week 12 · 08-03 → 08-09
**Must-hit:** The trust gate cannot be bypassed. RLS audit complete on every Member-only table.

- Full RLS audit: every Member-only table has the right policies, tested with a synthetic Account user.
- Sentry wired and capturing errors from prod.
- Plausible verified on every page.
- Cloudflare WAF rules tuned (block obvious abuse patterns, allow magic-link redirects).
- Resend deliverability check (DKIM, SPF, DMARC).

---

## Phase 7 — Pre-launch (Week 13)

### Week 13 · 08-10 → 08-16
**Must-hit:** Ready to invite the first beta cohort. Terms + privacy + community guidelines live.

- Terms of service + privacy policy + community guidelines written and linked from footer.
- Light legal review (you've been planning lawyer engagement around this point per `pa-rules.md` / strategy).
- Copy review across the entire product against `voice-and-copy.md` and `writing-rules.md` five-point test.
- QA pass on every flow (cold sign-up, application, approval, posting, browsing, contact).

---

## Phase 8 — Soft launch (Week 14)

### Week 14 · 08-17 → 08-23
**Must-hit:** Real users on real product, invited from your network. **Not a public launch.**

- Invite 10-25 people from your real network (sponsor: you, by default per the seed-phase rule).
- Watch the moderation queue. Manually review every application.
- Respond fast to bugs. Don't add features.
- Capture every piece of friction and missing-feature feedback for v1.5 prioritisation.

---

## Buffer · 08-24 → 08-31

One full week of slippage absorption. **Do not pre-plan into this week.** If you used it, post-mortem what slipped. If you didn't, celebrate and use it to draft the v1.5 spec (in-product admin UI, jobs category, sponsorship request flow).

---

## Reality checks built into this plan

- **Each week has one must-hit** — not three, not five. If you only do that one thing per week, the timeline still ships on schedule.
- **W1 is admin-only.** Resist the urge to "also start auth this week." Close the open Vercel loop, then start clean.
- **Auth + RLS gets 2 weeks each, not one.** Underestimating these is the most common way founders blow this kind of timeline.
- **Phase 5 (brand + seed content) is dedicated weeks**, not "I'll squeeze it in." Polish-as-afterthought is how MVPs ship looking unfinished.
- **No new features after W12.** Phase 6 onward is hardening and launching what you have, not adding.
- **The band, life, and bad weeks are already priced in** via the buffer week and the 14-vs-13 week structure.

## What the PA will do with this plan

- The 7am briefing will surface "what's the must-hit this week" automatically once this file is in `WORK AREAS/Product/mvp-build-project/outputs/`.
- The EOD summary will check progress against the current week's must-hit.
- On Mondays the briefing's Week-ahead section will quote the upcoming week's goal verbatim.
- If a week slips (the must-hit didn't land), the PA will flag it on the Sunday EOD and propose either: extend the slip into next week (and cut from later phases), or absorb into the buffer.

---

*Drafted by the Manhattanite PA, 2026-05-18. Owner: George. Revise at the end of each phase or whenever reality diverges materially from this plan.*
