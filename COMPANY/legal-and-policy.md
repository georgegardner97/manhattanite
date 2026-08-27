# Legal and Policy — Manhattanite

> **Important:** This file is not legal advice. It's a working map of the open legal questions Manhattanite needs to resolve, in the order it needs to resolve them. Once a lawyer is engaged, this file gets updated to reflect their guidance. Until then, treat every section as "the question we haven't answered yet."

Works with `trust-and-moderation.md` (operational rules) and `mvp-spec.md` (where these questions touch the product).

---

## Posture for the seed phase

At the seed-phase MVP, Manhattanite is:

- Not advertised publicly
- Not transacting through the platform (no payments processed)
- Making listings public, but not the people behind them — anyone can read the most recent few listings without an account; member names and sponsor names are shown only to signed-in readers *(corrected 2026-08-26; the old line here said listings were not public to non-account-holders, which stopped being true with the D1 decision of 9 June 2026)*
- Not accepting paid promotion or ads

This posture significantly reduces (but does not eliminate) legal exposure during the seed phase. It does not eliminate the obligations described below.

**[ASSUMPTION — confirm with counsel before any public surface goes live, before the first dollar moves through the platform, and before the network passes ~100 members.]**

---

## Legal questions, ordered by urgency

### Tier 1: Must resolve before MVP goes live (even in seed phase)

These can't wait.

#### 1. Entity formation

- **Question:** Is Manhattanite incorporated? If not, when, where, and what structure?
- **Default to consider:** Delaware C-corp if any external funding is on the horizon. NY LLC if founder-funded and simple. **[ASSUMPTION — confirm with counsel and accountant. Don't take this default as advice.]**
- **Why now:** Liability shield, contracts can be signed in the company's name, banking, future cap table.

#### 2. Terms of service

- **Question:** What are the platform's terms of use?
- **Minimum coverage:** Eligibility (membership tiers), acceptable use, listing standards, dispute liability (Manhattanite is not party to transactions), account termination, intellectual property, governing law.
- **Why now:** Every account holder accepts terms when signing up. Members need to know what they're agreeing to.

#### 3. Privacy policy

- **Question:** What data is collected, how is it used, who can access it, how long is it kept, how is it deleted?
- **Minimum coverage:** Personal data collected during account creation and application, member-visible profile data, moderation logs, analytics.
- **Why now:** Required to be live before any account is created. NY SHIELD Act applies, and any member from California, EU, etc. triggers further obligations.

#### 4. Founder identity vs entity

- **Question:** Are George's personal name and email exposed as the public-facing reviewer? Should it be a generic email or his name?
- **Default to consider:** Personal warmth at seed phase (George's name on emails). Move to "Manhattanite team" once a second reviewer exists. **[ASSUMPTION — confirm appetite for personal exposure during seed.]**
- **Why now:** Brand and operational decision with legal implications.

### Tier 2: Resolve before cohort 1 / first real listings

These have ~3 months to be settled.

#### 5. NYC fair-housing compliance for apartment listings

- **Question:** What does NYC fair-housing law require for apartment listings on a platform like this?
- **What we know:** NYC has strong fair-housing protections under the NYC Human Rights Law and the Fair Housing Act. These apply to housing providers, brokers, and *platforms* that publish housing listings. Source of income discrimination is illegal in NY. Protected classes are broader than federal law.
- **Operational implications worth flagging now:**
  - Listings cannot include discriminatory language ("no kids," "professionals only," "no Section 8")
  - The platform may need a clear non-discrimination policy and a complaint mechanism
  - Moderation needs to catch discriminatory listing language before it goes live
- **Why now:** This is the largest unaddressed regulatory question. A single bad listing is a real risk.
- **Next action:** Consult a NY housing attorney before the first apartment listing from a non-George account goes live publicly.

#### 6. Identity verification scope

- **Question:** How far do we go in verifying identity at the membership review?
- **Default to consider:** Visual confirmation via LinkedIn or established social presence is the bar. No government ID. **[ASSUMPTION — confirm. Going further (ID verification, address proof) raises real privacy and storage obligations.]**
- **Why now:** What we verify drives what we store and how we have to protect it.

#### 7. Liability for member conduct

- **Question:** What is the platform's exposure if a transaction goes wrong (scam, no-show, fraud) between members?
- **Working principle:** Manhattanite is not a party to transactions. Members transact peer-to-peer. The platform connects, doesn't broker.
- **What needs to be written:** Terms of service must clearly establish this. Listing pages should reinforce ("Manhattanite is not party to this transaction").
- **Why now:** Without this in writing, an aggrieved member could try to make the platform a defendant.

### Tier 3: Resolve before cohort 2 / public surface

These have ~6+ months but should not be left until needed.

#### 8. Marketing site and public-facing claims

- **Question:** What can we say in marketing? "Trusted," "verified," "every member is vouched for" — are these claims defensible?
- **Why later:** Public surface doesn't go live until cohort 2.
- **What to flag:** Any claim about safety, verification, or trust will be scrutinized if something goes wrong. Hedge accordingly.

#### 9. Press and PR posture

- **Question:** What do we tell press, and what do we not tell press?
- **Why later:** Press conversations happen at cohort 2 earliest.

### Tier 4: Resolve before monetization

These have ~9+ months.

#### 10. Payments and banking

- **Question:** Once pay-per-post is introduced, what's the payment infrastructure, and what tax/reporting obligations apply?
- **Default to consider:** Stripe for processing, standard merchant setup. **[ASSUMPTION — confirm.]**
- **Why later:** Monetization is v2.

#### 11. Sales tax

- **Question:** Does NY sales tax apply to listing fees? To peer-to-peer transactions facilitated through the platform?
- **Why later:** First listing fees won't move until v2.

#### 12. Refund and dispute policy

- **Question:** What happens if a paying member is dissatisfied? What's the refund posture?
- **Why later:** No payments until v2.

### Tier 5: Worth thinking about, no rush

#### 13. Trademark

- **Question:** Trademark "Manhattanite" as a brand? When?
- **Consideration:** "Manhattanite" is a common-English word. Trademark scope would be specific to the marketplace/services category.
- **Why later:** Costs money, becomes more important as brand recognition grows.

#### 14. Insurance

- **Question:** General liability, cyber/data breach, errors & omissions.
- **Why later:** More relevant once revenue or significant member count.

#### 15. Employment / contractors

- **Question:** First hire (full-time, contractor, advisor with equity)?
- **Why later:** Not relevant pre-cohort-2 in most cases.

---

## Specific risk areas worth naming

### Apartment listings + fair-housing language

The single highest-likelihood incident type. A member writes "looking for a young professional roommate" — borderline. A member writes "no kids" — illegal. Mitigations:

- Listing template with structured fields, not just freeform text
- Pre-publication moderation pass with fair-housing flagging
- Clear listing guidelines visible to members
- A complaint mechanism for members who see something they consider discriminatory

### Sponsor liability

If a sponsor brings in someone who commits fraud, is the sponsor exposed? Probably not legally, but reputationally yes within the network. Worth a TOS clause clarifying that sponsorship is a social vouching, not a legal guarantee.

### Off-platform behavior reports

A member is reported for off-platform conduct. What's the platform's obligation? What's its right? Worth structured handling in trust-and-moderation, with legal review.

### Data deletion requests

Required under CCPA, GDPR for EU members, and others. The "delete my account" flow needs to actually delete (or anonymize) — not just hide.

---

## Things this file is not doing

- It is not making legal claims about what the law says
- It is not specifying terms-of-service or privacy-policy language
- It is not a substitute for counsel
- It is not exhaustive — when a lawyer gets engaged, they'll surface more

---

## Next actions for George

In rough order:

1. **Find a NY-based startup attorney.** Ideally one with experience in marketplaces and platform liability. Make the introduction in the next 4–6 weeks. **[ASSUMPTION — confirm appetite and budget.]**
2. **Have a 60-minute scoping conversation with that attorney.** Walk them through this file. Ask: "What from this list must we resolve before MVP goes live? What can wait?"
3. **Engage on Tier 1 items first.** Entity, TOS, privacy policy. Likely a few thousand dollars total. Treat as table stakes.
4. **Add NYC housing law specifically to the scope.** This may need a specialist beyond the general startup counsel.
5. **Log every legal decision in this file.** Once a question is resolved, replace the "open question" with "resolved: [answer], confirmed by [counsel name] on [date]."

---

## Status snapshot

| Tier | Items | Status |
|---|---|---|
| Tier 1 — Pre-MVP | 4 items | All open. Need counsel. |
| Tier 2 — Pre-cohort-1 | 3 items | All open. |
| Tier 3 — Pre-public surface | 2 items | All open. |
| Tier 4 — Pre-monetization | 3 items | All open. |
| Tier 5 — Worth thinking about | 3 items | All open. |

Nothing here is settled. That's the honest state. The first move is the lawyer call.

---

*Last updated: 2026-05-16.*
