# MVP Spec — Manhattanite

The scope, structure, and timeline for the v1 build. This file is the source of truth for what we're building. Disputes about scope come here first.

Works with `tech-architecture.md` (the how) and `product-vision.md` (the why).

---

## MVP intent

This is a **seed-phase MVP, not a public launch.**

**What "ready" means:**

- A real, working web product
- Populated with clearly-labeled *example* listings and example member profiles
- Account creation and membership application flows are functional and real
- Usable in advisor conversations, networking, and founding-member outreach
- Not advertised publicly. The network is not "open" yet.

**What "ready" does not mean:**

- A polished marketing site
- A full feature set
- Payment processing
- Native mobile apps

Public launch comes after the seed phase, once we have signal from real conversations.

## Timeline

14 weeks from 2026-05-16, target ready by end of August 2026.

| Phase | Weeks | What ships |
|---|---|---|
| 1. Foundations | 1–3 | Stack setup, auth, profile, the two-tier access model wired |
| 2. Apartments | 4–8 | Apartment listings: post + browse + contact-form |
| 3. Furniture | 9–11 | Furniture listings: same primitives applied to a second category |
| 4. Polish + seed | 12–14 | Brand application, example data, application flow stress-test |

These are commitments, not estimates. If a week slips, scope cuts to protect the date. Cuts come from later phases, not the trust layer.

## The two-tier access model

Manhattanite has two user tiers. This is the core of the product.

### Tier 1: Account

- Anyone can create an account with an email
- Free, no review
- Can view all listings (browse, see details, see who posted)
- Can apply for membership
- Cannot post, cannot contact listers, cannot sponsor anyone

This tier exists so people can see the network before they're inside it. It's how aspiration and FOMO build. Modeled loosely on Gens de Confiance.

### Tier 2: Member

- Requires application + manual review + approval
- A sponsor is required. During the seed phase, the sponsor is George by default.
- Can post listings, contact listers, sponsor new members
- Sponsor information is publicly visible on the member's profile

**The wall between Tier 1 and Tier 2 is where Manhattanite becomes interactive.** Account holders see the value. Members capture it.

## v1 feature list

### Account creation (Tier 1)

- Email + name + neighborhood
- Email verification (magic link)
- Optional short bio
- Result: account holder, can browse listings

### Membership application

- Open to any account holder via "Apply for membership" CTA
- Application form: real name, neighborhood, occupation, a paragraph in their own words, optional sponsor reference
- Submitted to a review queue (George reviews each manually for MVP)
- Review outcomes: approved (becomes member), declined (account stays at Tier 1), needs more info (back-and-forth)
- Approval triggers welcome email and member status flip

### Member profile

- Real name, neighborhood, occupation, bio
- Sponsor displayed publicly ("Brought in by [Sponsor name]")
- Listings posted (visible)
- Listings sponsored (visible)

### Apartment listings

- Post: title, neighborhood, beds, rent, available-from date, description, photos (up to 8), tags
- Browse: chronological feed, no filters in v1
- Detail page: full description, photos, poster's profile, contact button
- Contact button: in-product form → forwards to lister's email. Lister chooses whether to reply directly.

### Furniture listings

- Post: title, category (sofa, table, chair, etc.), price, condition, neighborhood, description, photos, tags
- Browse: chronological feed, no filters in v1
- Detail page + contact: same pattern as apartments

### Listing moderation

- Every new listing enters a moderation queue before going live
- Manually reviewed (manual for MVP — automated curation later)
- Listings can be removed, edited, or returned to the poster with feedback

### Interaction gating

When an account holder (Tier 1) tries to do something members-only — contact a lister, post a listing, sponsor someone — they hit an interaction gate. The gate explains why and points them to the membership application.

Sample copy lives in `voice-and-copy.md`.

### Admin views (George only)

- Application review queue
- Listing moderation queue
- Member directory
- Basic data: account count, member count, listings count, applications pending

## v1 features OUT (deliberate cuts)

These are intentionally not in v1. They go on the v2 list or later.

- **In-platform messaging.** Contact happens via the form → email forwarding.
- **Jobs category.** Different listing structure, different curation rules. v2.
- **Services category.** Same reason. v2 or later.
- **Search filters.** Chronological feed only in v1.
- **Saved listings / favorites.** v2.
- **Payments / pay-per-post.** v2 onward.
- **Native mobile apps.** Web responsive only.
- **Push notifications.** Email only.
- **Public profiles outside the network.** Member profiles are members-and-account-holders only.
- **Member-to-member messaging.** v2.
- **Sponsorship request flow** ("ask Anna to sponsor me"). v2.
- **Roommate-specific flow.** Apartment listings cover this informally in v1.

## How v1 delivers the brand promise

From `product-vision.md`:

1. **"I get better stuff here."** → Listings are curated. Manual moderation. Bar is taste.
2. **"I trust the people."** → Sponsor is publicly named. Application requires a real reviewer.
3. **"I'm in."** → The two-tier model makes membership feel earned, not given.

Every feature in v1 maps to one of these three. If a feature doesn't, it doesn't ship.

## Success criteria for the MVP

By end of August 2026, all of these should be true:

- The product works end-to-end in a single happy path: visit → account → browse → apply → approved → post
- The example data set is in place (10+ apartments, 15+ furniture listings, 8+ example member profiles)
- At least 3 real applications have come through the review flow (likely advisor or friend tests)
- The site can be demoed to a stranger without long explanation
- At least one real apartment or furniture listing exists from a real founding member
- Brand application is consistent and recognizable across the site

Miss any of these → extend rather than launch broken.

## Roadmap beyond MVP

| Stage | What we add | When |
|---|---|---|
| **v1.1** | Real founding cohort onboarded (10–20 members) | September 2026 |
| **v1.5** | Jobs category, search filters, saved listings | Q4 2026 |
| **v2** | In-platform messaging, sponsorship request flow, pay-per-post | 2027 |
| **v3** | Services category, mobile-native experience, neighborhood guides | 2027+ |

The order can change. The principle doesn't: each release must reinforce the trust layer before adding new surface area.

---

*Last updated: 2026-05-16.*
