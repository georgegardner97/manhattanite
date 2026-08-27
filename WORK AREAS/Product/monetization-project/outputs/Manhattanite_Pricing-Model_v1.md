# Manhattanite pricing model, v1

Prepared 2026-08-27. Internal. Answers three questions: what a listing is worth, whether to charge for all of them, and what the margins actually look like.

---

## The short version

A Manhattanite apartment listing is worth roughly **$75–125**. Furniture is worth close to nothing, so don't charge for it. Margins are about **96%**, which sounds spectacular and isn't the interesting number. The interesting number is that you need roughly **2,500 members** before this pays you a salary, and moderation time breaks before the maths does.

---

## 1. What a listing is worth

Price is set by what a New Yorker already pays to advertise the same thing. Here is the actual ladder, checked today.

| Where they'd go instead | What it costs |
|---|---|
| Facebook groups, Nextdoor | Free |
| Craigslist NYC apartment | $5 per post |
| Listings Project (NY/NJ/CT property) | $47 per week, +$50 to feature |
| Listings Project (jobs and gigs) | $65 for 4 weeks |
| Listings Project (services) | $42 for 4 weeks |
| StreetEasy, for rent by owner | $249 for 2 weeks ($299 featured) |
| StreetEasy, via an agent | $7–22 a day, so $210–660 a month |
| Gens de Confiance holiday rental | €119 for 6 months, stays free until it's rented |

Listings Project is the closest cousin: curated, New York, no brokers, per-listing fee, a community that trusts the person running it. It charges $47 a week, so a month costs about $188.

**Recommended price: $99 for a 30-day apartment listing, and it stays up free until the place is taken.**

That is half of Listings Project and a fifth of StreetEasy, while being the only one of the three where every poster has a name attached to them. The free-until-rented guarantee is lifted straight from Gens de Confiance and it is the single best part of their model: you're charging for a result, not for permission to speak.

### One correction to the July thinking

The 2026-07-14 note priced apartments high because a broker fee makes $149 look cheap. That argument is now dead. NYC's FARE Act came into effect on 11 June 2025 and moved broker fees off tenants and onto landlords, so the tenant isn't paying 12% any more.

The conclusion survives on better grounds. The person paying you is the *lister*, not the renter, and the lister's alternative is $249 a fortnight on StreetEasy. The FARE Act arguably helps: landlords now carry a cost they used to pass on, which makes a cheap direct-to-renter channel more attractive to them than it was in 2024.

---

## 2. Should you charge for all listings?

No. Charge for two of the four categories.

| Category | Charge? | Price | Why |
|---|---|---|---|
| Apartments | Yes | $99 / 30 days, free until rented | High value to the poster, expensive alternatives, low volume, easy to justify |
| Furniture | **No, free forever** | — | It's why people open the site each week. A $10 fee on a $60 chair nets $6.70 and costs you the listing |
| Jobs (v1.5) | Yes | $75 / 30 days | The most valuable classified there is, and no fair-housing exposure |
| Services (later) | Yes | $40 / 30 days | Matches the market, and the poster is running a business |

Two things follow from that table.

**Furniture free is a strategic choice, not a concession.** Furniture is the browse habit. It's what makes someone check Manhattanite on a Tuesday when they aren't moving house. Kill the habit and the apartment listings stop getting seen, which is what you're actually selling.

**Jobs may end up out-earning apartments.** Craigslist charges $5 for an NYC apartment and $45 for an NYC job. Listings Project charges more per month for a job than for a property. Jobs are cheap to moderate, carry none of the fair-housing risk, and a hiring manager barely notices $75. Worth pulling forward if apartment supply is slow to arrive.

Featured or bumped slots ($15–25) are worth adding later, once there are enough listings that position on the page matters. Not before.

---

## 3. Margins

Per paid listing at $99:

| | |
|---|---|
| Price | $99.00 |
| Card processing (2.9% + 30¢) | −$3.17 |
| **Net per listing** | **$95.83** |
| **Gross margin** | **96.8%** |

Running costs are about $10 a month today and land around $70–100 once you're on paid tiers for the database, hosting and email. So **one paid listing a month covers every bill Manhattanite has.** Break-even is not a milestone worth tracking here.

The cost that matters isn't money, it's you. Every listing gets read by a human, and applications need reviewing on top.

---

## 4. What it earns, by size

Assumes 4% of members post a place in a given month (one in twenty-five) and 12% post furniture. Moderation at 5 minutes a listing, applications at 10 minutes each.

| Members | Paid listings / mo | Revenue / mo | Net / year | Free listings / mo | Your hours / mo |
|---|---|---|---|---|---|
| 200 | 8 | $792 | ~$9,000 | 24 | ~3 |
| 500 | 20 | $1,980 | ~$22,000 | 60 | ~7 |
| 1,000 | 40 | $3,960 | ~$45,000 | 120 | ~13 |
| 2,500 | 100 | $9,900 | ~$114,000 | 300 | ~33 + applications |
| 5,000 | 200 | $19,800 | ~$229,000 | 600 | ~67 + applications |

Read it as a shape, not a forecast. Three things it tells you:

1. **Below 500 members this is not income.** At 200 it's about $750 a month, which pays for the tools and buys you the right to say people pay for this. That is the whole point of charging early, and it's a good point, but don't confuse it with a business.
2. **A salary needs roughly 2,500 members.** The plan targets 50–100 by the end of this year. Even at healthy referral growth that puts a full-time income somewhere in 2028.
3. **Around 5,000 members the operation breaks before the money does.** Sixty-seven hours of listing review plus perhaps forty of applications is more than half a full-time job. That forces a decision you should make deliberately: hire a reviewer, or loosen approval and lose the thing people are paying for.

### The lever is frequency, not price

Doubling the price to $199 doubles the revenue and risks the supply you don't yet have. Doubling how often members post does the same thing with no downside. Every extra listing per member per year is worth more than a price rise, so activation is where the money is hiding.

---

## 5. Three things to sort before the first dollar

**Charge on approval, not on submission.** You review every listing by hand. If people pay when they submit, you'll be issuing refunds on every rejection and arguing about them. Take a card authorisation on submit and only capture it when you approve. This changes the Stripe build, so it needs deciding before it's built, not after.

**Publish the standards page first.** A paying poster who gets declined behaves very differently from a free one. Written rules turn "you rejected me" into "I broke rule four."

**The first dollar triggers the legal work you deferred.** Company registration, an attorney over the terms, and a tax question worth asking specifically: whether a per-listing advertising fee is taxable in New York. That's roughly three weeks of admin, so the decision to charge needs making about a month before money starts arriving. There's already a project folder for it at `WORK AREAS/Legal/company-formation-project/`.

---

## Next step

Confirm two things and the rest follows: the apartment price ($99 unless you want to test $75), and whether furniture stays free permanently or only through v1. Once those are settled the Stripe slice can be specced.
