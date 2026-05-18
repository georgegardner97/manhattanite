# Trust and Moderation — Manhattanite

How Manhattanite holds the bar. Application criteria, listing standards, removal grounds, and sponsor accountability.

This file translates the trust mechanic from abstract idea into operational rules. Works with `product-vision.md` (the why) and `mvp-spec.md` (the where it lives in the product).

Everything here is a default. Items marked **[ASSUMPTION — confirm or revise]** are calls I made that you should react to.

---

## The core principle

**Trust is the product. Quality and taste are the moat.**

Every rule below exists to protect those two sentences. When a rule and the principle conflict, the principle wins and the rule gets rewritten.

Three operational consequences:

1. We approve, we don't process. Applications are judgment calls, not checklists.
2. We curate, we don't host. Listings are editorial decisions, not user-generated submissions.
3. We hold sponsors accountable. A sponsor is putting their reputation on the line.

---

## Membership: what gets approved

### Baseline criteria (must all be true)

- Real name, verifiable identity (LinkedIn or social presence confirms it's a real person)
- Manhattan-resident or strong Manhattan-anchored (lives in outer boroughs but socially anchored here) — **[ASSUMPTION — confirm. Alternative: strict Manhattan-only.]**
- Age 22+ (legal contracting age in NY for transactions)
- Has a coherent reason for being on Manhattanite (in their application paragraph)
- Doesn't violate any of the "automatic decline" criteria below

### Quality signals that move an applicant toward yes

These are not requirements. They're tilts.

- Sponsored by an existing member (especially a member with a good sponsorship track record)
- Active in Manhattan-anchored communities (specific neighborhoods, cultural institutions, professional networks)
- Application paragraph shows specificity and taste (mentions places, names, real life)
- LinkedIn or web presence shows a coherent professional identity
- Photo (optional) is a real photo of a real human

### Automatic decline

Any one of these is grounds for immediate decline.

- Anonymous application or pseudonym
- Stated commercial intent without member-style usage (real estate agents prospecting, marketing agencies, recruiters acquiring for jobs platforms)
- Behavior on other platforms suggests bad actor (scams, harassment record)
- Doesn't live in the NYC metro
- Lying on the application

### Application response time

- **Target average:** Under 48 hours
- **Maximum:** 72 hours
- **At seed phase:** George reviews each manually
- **Post cohort 1:** Same, until a co-reviewer is added

Response time is brand. A 6-day response says "you're a number." A 24-hour response says "we read your application."

### What an approval feels like to the applicant

- Personal email, signed by a real name
- Mentions one specific thing from their application
- Sets the tone for what the network is

Sample copy lives in `voice-and-copy.md`.

### What a decline feels like

- Personal, brief, kind
- Doesn't enumerate reasons
- Leaves the door open if sponsorship later changes the equation
- The applicant should not feel humiliated

Sample copy lives in `voice-and-copy.md`.

---

## Listing standards: what gets posted

### Baseline criteria for any listing

- Posted by a current member in good standing (not under sponsor probation, see below)
- Listing the member can credibly claim (their apartment, their furniture, their job opening)
- Real photos (not stock, not vendor images for furniture, not staging photos for apartments)
- Real price (not "make offer," not "DM for price")
- Real description (specific details, not lifted from a listing site)
- In one of the live categories (apartments, furniture — others rejected until v2)

### Apartments: additional rules

- Manhattan or NYC metro location, specific neighborhood
- Real availability date
- Either a sublet, a roommate situation, or a direct rental from owner/leaseholder
- **No broker-fee listings.** Manhattanite is a peer-to-peer network. Members can post their own listings. Brokers cannot post listings as a service. **[ASSUMPTION — confirm. Alternative: allow brokers if they're members; flag broker-listings clearly.]**
- Compliance with NYC fair-housing law (see `legal-and-policy.md` for the open question)

### Furniture: additional rules

- Real photos, ideally in-context (the piece in a room, not on a backdrop)
- Honest condition disclosure ("light wear on top," "scratch on left leg")
- Specific provenance helpful ("bought from Wyeth in 2022," "Eames original from 1965 reissue")
- Reasonable pricing — clearly off-market or scam pricing is grounds for review

### Listings that get removed

Any one of these:

- Photos don't match (stock photos, images from other listings, AI-generated)
- Description is generic or pasted from elsewhere
- Price is misleading or omitted
- Item is misrepresented (condition, size, history)
- Listing is a service rather than an item (e.g., "I can help you find an apartment")
- Listing duplicates an existing listing
- Listing violates NYC fair-housing or relevant law
- Member is using listings to harvest contact info for off-platform business

### Listing approval flow at MVP

- Member submits listing
- Goes into moderation queue (admin view in product)
- George reviews and either approves, returns with feedback, or removes
- Approved listings go live within the moderation SLA below

### Listing moderation SLA

- **At seed phase:** Within 24 hours
- **At cohort 1:** Within 12 hours
- **Long-term:** Same-day, with admin co-reviewers

---

## Sponsor accountability

Sponsors are the trust transmission mechanism. Their reputation is on the line, and the network needs to feel that.

### What a sponsorship commits to

When a member sponsors an applicant:

- Their name appears publicly on the applicant's profile if approved
- They are formally accountable for the applicant's first 90 days of behavior
- If the applicant misbehaves, the sponsor takes a reputation hit

### Sponsor reputation states

| State | Trigger | Effect |
|---|---|---|
| **Good standing** | Default. Sponsorships are working. | No restriction. |
| **Watch** | One sponsored member removed or had a listing pulled in their first 90 days. | Sponsor sees a private note. No external visibility. |
| **Probation** | Two or more sponsored members removed or repeatedly problematic. | Sponsor cannot sponsor new applicants for 90 days. Existing sponsorships unaffected. |
| **Removed** | Pattern of bad sponsorships, or one severe incident. | Sponsor's membership reviewed. May be removed. |

**[ASSUMPTION — confirm the consequence ladder. Alternative: simpler binary "in good standing / not." This is more granular but feels right for trust transmission.]**

### Sponsor visibility

- Each member's profile shows everyone they've sponsored
- Each member's profile shows who sponsored them
- Sponsor history is permanent and public to other members
- This is by design: it's the social cost mechanism

### What sponsors cannot do

- Cannot bulk-sponsor (cap: 3 active sponsorships in review at any one time)
- Cannot sponsor anonymously
- Cannot withdraw a sponsorship after approval (only George can remove a member, not a sponsor)

---

## Member removal

### Grounds for removal

Any one of these:

- Repeated listing violations (3 strikes pattern)
- Off-platform conduct that damages other members (harassment, scams)
- Stated false identity on application or profile
- Using the network for commercial harvesting (listings as funnel to off-platform business)
- One severe incident (fraud, sexual harassment, hate, threats)

### Removal process

- **Notice first.** Most issues warrant a private email, a chance to address, a clear consequence statement.
- **Removal is final.** Once a member is removed, they cannot rejoin under a different identity. We watch for this.
- **Sponsor is informed.** Especially in the first 90 days, the sponsor gets a heads-up.
- **No public shaming.** We don't post about removals. Quiet is the right posture.

### What removal feels like

A direct, calm email. Specifies the reason, references the standards, doesn't moralize. The member is told their listings will be archived and their account closed within 7 days.

Sample copy stub lives in `voice-and-copy.md` (the "removed listing" template adjusts upward for full removals).

---

## Edge cases worth thinking about now

### A sponsor and their sponsored member have a dispute

Manhattanite is not a court. We don't adjudicate disputes between members. If a transaction goes wrong, members handle it between themselves. If conduct on the platform crosses a line (harassment, fraud), normal removal rules apply.

### A member is acting inappropriately off-platform

If we get a credible report from another member, we look into it. We don't enforce against off-platform behavior generally — only when it directly affects another member's safety or trust.

### Multiple accounts

One person, one account. If we find multiple accounts, we remove all but the original and issue a notice.

### Banned for life

Yes. Once removed, never approved again. **[ASSUMPTION — confirm. Alternative: 12-month cooling-off, then reapply with sponsorship.]**

### A member offers to pay for an expedited approval

Decline. Not for sale.

### A press contact wants to join to write about us

Decline gracefully. Offer to talk to them as press, not as a member.

---

## What we don't moderate

Things that look like moderation but are actually editorial choices upstream:

- We don't moderate "is this listing good enough to be interesting" — that's a curation decision the network makes by what gets engagement
- We don't moderate political content unless it crosses into harassment or hate
- We don't moderate taste

If a listing is technically fine but feels off, that's a signal the application bar needs tightening, not that the listing needs removing.

---

## Operational mechanics at MVP

### The admin views needed (already in `mvp-spec.md`)

- Application review queue (sort by submission date)
- Listing moderation queue (sort by submission date)
- Member directory (filter by status: good standing / watch / probation / removed)
- Sponsor activity view (who's bringing people in, who isn't)

### The single source of moderation record

A spreadsheet or simple admin log records every approval, decline, listing removal, and member removal. Keeps the operational history for pattern detection. **[ASSUMPTION — confirm format. Alternative: notion database, or eventually a proper admin tool.]**

### Volume thresholds for adding help

| Trigger | Action |
|---|---|
| 20+ applications/week with George as sole reviewer | Add a second reviewer (founding member trusted with this) |
| 10+ listing moderations/day | Move to same-day SLA + co-reviewer |
| 100+ active members | Move to a proper admin tool, not spreadsheets |

---

## Where this file ends and `legal-and-policy.md` begins

This file covers norms and operational rules. The next file covers legal and regulatory questions: NYC fair-housing law for apartment listings, payments/banking once monetized, terms-of-service and privacy policy structure, dispute liability. They are related but separate.

---

*Last updated: 2026-05-16.*
