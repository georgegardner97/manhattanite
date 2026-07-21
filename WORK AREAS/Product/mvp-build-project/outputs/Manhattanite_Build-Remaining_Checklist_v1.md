# Manhattanite — Remaining Build Checklist

**As of 2026-07-02.** Source of truth for v1 scope is `COMPANY/mvp-spec.md` — this is the working punch list.
Status in one line: **functionally demo-ready; the path to launch is mostly legal + a couple of loose ends.**

---

## ✅ Just done (for context)
- [x] **Spam protection live** — Cloudflare Turnstile on signup, login, and password-reset; Supabase CAPTCHA enforced; honeypot on the apply form; the spam application queue cleared.

---

## 1. ~~Ship the parked June slice~~ — ALREADY LIVE (verified 2026-07-02)
Confirmed both migrations were applied in a past session (all 4 functions present in prod: `get_my_connections`, `request_sponsorship`, `get_sponsorship_request`, `respond_to_sponsorship_request`; the `sponsorship_requests` table exists). The frontend was already committed + pushed. Nothing to ship — the "parked" note in memory was stale.
- [x] **Migration `0024_my_connections.sql`** applied — "Sponsored by / You've sponsored" blocks on profile.
- [x] **Migration `0025_sponsorship_requests.sql`** applied — applicant-names-a-member → member confirms flow.
- [ ] *(optional)* Eyeball `/profile` as the founder — the "You've sponsored" block should list the example members.

---

## 2. Launch-blockers — before real (non-George) users
These gate going live with the public, not a demo.
- [ ] **Form a company entity** (NY LLC was the default recommendation in the legal roadmap). Nothing is registered yet.
- [ ] **Attorney review of Terms & Privacy** — currently solid *working drafts* marked "pending counsel."
- [ ] **Fair-housing review of apartment listing standards** — the single biggest legal risk; get counsel's eyes on it before any non-George apartment listing goes public.

---

## 3. Loose ends / polish (small, non-blocking)
- [ ] **Confirm a real contact email actually delivers** — the member-to-lister contact form was tested but delivery to a live inbox was never verified.
- [ ] **Landing "On the network" glimpse** — currently 100% example listings with no "Example" label; worth a copy/design pass.
- [ ] **Reconcile stale CTA copy** in `voice-and-copy.md` (still lists "Join the network" as the create-account CTA; shipped CTA is "Create an account").
- [ ] **Hard-delete any leftover "QA TEST" listing** from the founder's My Listings if one remains (Cowork can't hard-delete; a quick SQL row drop).

---

## 4. Deliberately OUT of v1 — do NOT build yet
Cut on purpose in `mvp-spec.md`. Listed here so scope doesn't creep:
in-platform messaging · jobs · services · search filters · favourites · payments · native apps · paid membership tiers · business accounts.

*(The graded trust score, min-2 sponsor floor, and a fuller member-facing invite UI are v2 direction, not v1.)*
