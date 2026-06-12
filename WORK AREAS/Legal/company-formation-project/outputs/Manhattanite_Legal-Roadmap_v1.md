# Manhattanite — Legal Action Plan (Pre-Launch)

*Last updated: 2026-06-09. This is a working plan, not legal advice. Anything money- or liability-related should be confirmed with a NY startup attorney and an accountant before you act on it.*

You asked: what do I actually need to do legally, and what's necessary right now, given I haven't registered a company yet.

Short version: **three things are genuinely "do it now," the rest can wait.** They are (1) form the company, (2) get Terms of Service + a Privacy Policy live before real users sign up, and (3) put fair-housing guardrails on apartment listings before anyone but you posts one. Everything else (trademark, sales tax, insurance) is real but not urgent at your stage.

---

## 1. Form the company — the big one you're missing

**Do this first.** You already have a live product with real listings and real users coming. Until there's a company, every legal risk lands on *you personally* — your savings, not the business's. Forming an entity puts a wall between "Manhattanite the company" and "George the person." That wall is the whole point.

Forming a company also unlocks the boring-but-necessary stuff: a business bank account, signing contracts in the company's name, and an EIN (a free tax ID number from the IRS, like a Social Security number for your business).

### Which structure? LLC vs C-Corp

These are the two realistic options. Here's the plain-English difference:

- **LLC (Limited Liability Company):** Simple, cheap to run, flexible. Profits/losses pass straight to your personal tax return (no separate company tax). Best for solo founders who are self-funding. The standard bootstrapper choice.
- **C-Corp (in Delaware):** The structure investors expect. More admin, more accounting cost, and "double taxation" (the company is taxed, then you're taxed again on what you take out). Only worth it if you're raising money or handing out equity soon.

**My recommendation, based on what you told me (self-funded, solo, NY-based):**

> Start as a **New York LLC** — *unless* you genuinely expect to raise investor money or give equity to a co-founder/employee within roughly the next 12–18 months. If that's likely, form a **Delaware C-Corp** now instead, because converting an LLC into a C-Corp later (which is what investors will force) is expensive and annoying. Better to skip the conversion.

You said you're "open to bringing someone on." That alone doesn't require a C-Corp — an LLC can add a member through its operating agreement. The trigger for C-Corp is *raising VC* or *giving formal equity/stock options*. If neither is on the horizon, LLC wins.

### The NY catch you need to know about: the publication trap

New York has a quirk no other state has. Within 120 days of forming an LLC, you must **publish a notice in two newspapers for six weeks** in the county where your business is registered. In **Manhattan, this costs roughly $1,200–$2,000** — far more than the actual filing fee. It's widely considered a pointless tax, but skipping it suspends your LLC's right to bring lawsuits in NY courts, so you can't just ignore it.

There's no clean way around it if you operate in NY (forming the LLC in Delaware doesn't help — you'd then have to register it as a "foreign LLC" in NY and still publish). So just budget for it.

This publication cost is the single biggest reason some NY founders go straight to a Delaware C-Corp instead — Delaware has no publication requirement. Worth weighing if the LLC-vs-Corp call is close for you.

### Rough costs (verified June 2026)

| Path | Upfront | Ongoing per year |
|---|---|---|
| **NY LLC** | $200 filing + ~$1,200–2,000 Manhattan publication + $50 cert + $25 beneficial-ownership filing | ~$25–100 (NY filing fee depends on income) + $9 biennial statement |
| **Delaware C-Corp** | ~$109+ filing | ~$175–400 franchise tax + ~$200–500 registered agent + higher accounting |

Note: a new federal rule (effective Jan 1, 2026) requires NY LLCs to file beneficial-ownership info (who really owns the company) with the state — a $25 filing. Your formation service or attorney handles this.

### How to actually do it

You have three ways, cheapest to priciest:
1. **DIY** through the NY Department of State website — fine for the filing itself, but you'd want a proper operating agreement, which is the document that actually governs the company.
2. **A formation service** (LegalZoom, Northwest, Stripe Atlas if you ever go C-Corp). A few hundred dollars, handles the paperwork and often the publication.
3. **A startup attorney** — the safest, especially because you'll need one anyway for the next items. A scoping call plus formation is usually a flat fee.

**Recommended next step:** Book a 60-minute paid consult with a NY startup attorney who knows marketplaces. Bring `COMPANY/legal-and-policy.md` and this file. Ask them to (a) confirm LLC vs C-Corp for your situation, (b) form the entity, and (c) quote you for Terms + Privacy Policy. This one conversation settles most of your open questions.

---

## 2. Terms of Service + Privacy Policy — needed before real users sign up

You're already collecting emails and passwords in production. The moment a real (non-test) user creates an account, you should have these two live:

- **Privacy Policy** — legally close to mandatory the second you collect personal data. Must say what you collect, why, who sees it, how long you keep it, and how someone deletes their data. New York's SHIELD Act applies to anyone holding a NY resident's personal info, and a single California or EU user pulls in their rules too.
- **Terms of Service** — protects you. The critical clause for a marketplace: **"Manhattanite is not a party to transactions between members."** You connect people; you don't broker the deal. Without that in writing, an angry user who got scammed by another member could try to make *you* the defendant.

You can start from a reputable template (Termly, iubenda, Termsfeed) to keep cost down, but have the attorney review them — generic templates miss the marketplace-specific and fair-housing pieces that matter most for you.

---

## 3. Fair housing on apartment listings — your single biggest risk

This is the one to take seriously. Federal and NYC fair-housing law makes it **illegal to publish a listing that signals a preference** based on protected characteristics (race, religion, sex, family status, disability, and — broader in NYC — source of income, like "no Section 8"). "No kids" or "professionals only" can be enough.

Here's the part that matters for you as the platform: **Section 230** (the law that normally shields websites from what users post) **does not reliably protect you if your own system shapes or filters listings in a discriminatory way.** Courts have carved out housing. So you can't fully hide behind "a user wrote it."

You don't need a lawyer to start reducing this risk. Practical guardrails, in order:
1. **Structured listing fields** instead of one big freeform box — fewer places for bad language to slip in.
2. **A pre-publication review** of apartment listings (you're doing this manually now anyway) with a checklist of banned phrases.
3. **Visible listing guidelines** telling members what they can't write.
4. **A way to report** a listing someone finds discriminatory.

Get a NY housing attorney to bless this **before the first apartment listing from someone other than you goes live.** Right now you're the only one posting, so you have a window — but it closes the moment you let members post apartments.

---

## What you do NOT need to worry about yet

So you can stop carrying these around:

- **Sales tax** — you're not charging anyone yet. NY generally doesn't tax services, and "pay-per-post" may not be taxable at all, but this is genuinely a v2 question. Revisit when you turn on payments.
- **Payment/banking setup** — Stripe when you monetize, not before.
- **Trademark** — "Manhattanite" is a common word, so protection would be narrow (specific to your marketplace category). Filing is ~$350/class with the USPTO. Worth doing once you have traction and a budget; not now. **USPTO search done 2026-06-09:** the only LIVE registration is in Class 025 (athletic apparel — a different category, unlikely to block a marketplace), and Class 035 (online marketplace / classified-advertising services — your actual lane) is DEAD/abandoned, i.e. currently open. Name looks usable for the service. Two cautions: (a) don't put the name on branded merch/apparel without clearing it first — that steps into the live Class 025 mark; (b) "Manhattanite" is a descriptive/geographic term, so it's a weak mark and coexistence across categories is normal. When you do file, it's a Class 035 application with a proper clearance search by a trademark attorney.
- **Insurance** (general liability, cyber) — relevant once you have revenue or real member volume.
- **Employment/contractor paperwork** — only when you actually bring someone on.

---

## Your next 3 moves, in order

1. **This month:** Book a paid scoping call with a NY startup attorney (marketplace experience preferred). Decide LLC vs C-Corp on that call, and have them form it. Budget ~$1,500–2,500 all-in including the Manhattan publication if you go LLC.
2. **Same engagement:** Get Terms of Service + Privacy Policy drafted or reviewed, live before real users sign up.
3. **Before non-George apartment listings go live:** Lock in your fair-housing guardrails (structured fields, review checklist, listing guidelines) and have a housing attorney confirm them.

Everything else on the list in `COMPANY/legal-and-policy.md` stays parked until its trigger arrives.

---

## Sources

- [NY tax — Partnership/LLC annual filing fee](https://www.tax.ny.gov/pit/efile/annual_filing_fee.htm)
- [NY LLC publication requirement & costs (2026)](https://www.bizreport.com/publication-requirement-new-york)
- [NY LLC cost / publication trap (2026)](https://llcformationcost.com/new-york-llc-cost/)
- [Delaware C-Corp vs LLC fees (2026)](https://www.doola.com/blog/delaware-llc-fees/)
- [Delaware C-Corp vs LLC decision guide (2026)](https://www.icanpitch.com/blog/delaware-c-corp-vs-llc-startups-guide)
- [Fair Housing advertising rules & platform liability](https://nationalfairhousing.org/responsibleadvertising/)
- [HUD guidance on advertising through digital platforms (2024)](https://www.fhcci.org/wp-content/uploads/2024/05/FHEO_Guidance_on_Advertising_through_Digital_Platforms-4-29-24.pdf)
- [NY SHIELD Act — NY Attorney General](https://ag.ny.gov/resources/organizations/data-breach-reporting/shield-act)
- [NY SHIELD Act small-business requirements](https://www.jacksonlewis.com/insights/new-york-shield-act-faqs)
- [NY sales tax guide for digital/SaaS (2026)](https://www.afternoon.co/blog/new-york-sales-tax-guide)
- [USPTO trademark fees (2026)](https://www.uspto.gov/trademarks/trademark-fee-information)
