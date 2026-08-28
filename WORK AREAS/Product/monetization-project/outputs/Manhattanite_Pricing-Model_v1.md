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

## 6. What 20,000 members looks like

Asked separately by George on 2026-08-27. Short version: revenue of roughly **$600k to $1.2m a year, and a profit somewhere between nothing and $650k**, because at that size the 97% listing margin gets eaten by salaries. The product at 20,000 members is human judgement, and human judgement has a payroll.

### Revenue

Everything turns on how often a member posts. That single assumption swings the answer by a factor of two, so both ends are shown.

| | Cautious (2% of members post a place per month) | Current assumption (4%) |
|---|---|---|
| Apartment listings / month | 400 | 800 |
| At $99 | $475k / year | $950k / year |
| At $149 (defensible at that size) | $715k / year | $1.43m / year |

Add roughly $135k a year if jobs are live at $75 and 150 get posted a month, plus a modest amount from featured slots. Call the realistic band **$600k to $1.2m**.

The price rise is honest at that scale, by the way. A listing seen by 20,000 vouched New Yorkers is worth more than the same listing seen by 500, and you'd still be under StreetEasy.

### Costs

| | Per year |
|---|---|
| 3 ops people reviewing listings, applications and disputes | $195k |
| One engineer (contract at the low end) | $80–150k |
| Your own salary | $120k |
| Infrastructure at 20,000 members with images | ~$15k |
| Legal, insurance, accounting | ~$50k |
| Tools | ~$10k |
| **Total** | **~$470–540k** |

Three-quarters of that is people. The work is 3,200 listings a month to read at five minutes each (267 hours), plus around 600 applications and 400 support tickets. That's about 2.7 full-time people on judgement alone, before anyone builds anything.

**Break-even sits at roughly 470 paid listings a month**, which is 2.4% of members posting. The cautious column above is 2%. So the difference between a comfortable business and a treadmill is one percentage point of how often members post — which is the same lever as at 200 members, just louder.

### What actually changes at that size

**The vouch stops being personal.** 20,000 members is one in every eighty people living in Manhattan, and the median member is four or five introductions away from you. Gens de Confiance's answer at two million members was to keep the vouch and bolt on reporting and insurance (they cover up to €100,000 of damage). Trust becomes a system with a claims process rather than your judgement. That is a real change to what Manhattanite is, and it should be a decision rather than a drift.

**Fair-housing exposure scales with volume.** 800 apartment listings a month is enough to attract organised testing. Section 230 still shields you for what members write, but only if the moderation stays approve-or-decline and the listing form never asks about who the tenant is. At that volume this needs a written standard and a lawyer on retainer, not a checklist in your head. Related and concrete: the FARE Act requires every rental listing to disclose the fees a tenant would pay, so the posting form needs fee fields before you're big enough to be noticed.

**The temptation arrives.** At 20,000 verified, well-off Manhattan residents, the valuable asset isn't the listing fee — it's the audience. That's precisely when advertising, data deals and broker packages start to look sensible, and all three are currently ruled out by decisions you've already taken. Holding that line is defensible. Just know it costs perhaps a third of the achievable revenue, and decide with the number in front of you rather than on instinct.

### How far away is it

From 100 members at the end of this year, 20,000 needs about seven and a half doublings. At 5% growth a month that's nine years. At 10% it's four and a half. At 15% it's three. So 20,000 is a 2030-and-later question on Manhattan alone, and it probably implies opening up beyond Manhattan, since one in eighty residents is a very high share for an invite-only network.

---

## 7. What it would be worth at 20,000 members

Asked by George on 2026-08-27. Not financial advice, and a broker or banker would price the real thing against real books. But three methods converge, which is usually a sign the range is about right.

**Roughly $2m to $6m, most likely low single-digit millions.**

### Method one: a multiple of earnings

Under $5m of revenue, buyers price on owner's earnings rather than EBITDA. Strip out your salary and the business throws off $210k at the cautious end and around $750k at the top.

FE International puts two-sided marketplaces with real liquidity and 20%+ growth at 4.5 to 8 times adjusted earnings, and everything else lower. Manhattanite would sit at the bottom of that band on the numbers as modelled, for reasons worth naming: the revenue is one-off rather than contracted, it's one city, and every listing passes through you.

| | Owner earnings | Multiple | Value |
|---|---|---|---|
| Cautious | $210k | 3x | ~$630k |
| Middle | $430k | 4.5x | ~$1.9m |
| Strong | $750k | 6.5x | ~$4.9m |

### Method two: a multiple of revenue

Nextdoor is the cautionary comparison. As of August 2026 it's worth $890m on $260m of revenue, so 3.4 times — and it's down 71% from its 2021 peak, with over a hundred million users. Neighbourhood networks are not automatically valuable. Profitable classifieds businesses trade at 3 to 6 times revenue, which on $600k–$1.2m gives **$2m to $7m**.

### Method three: what the members are worth per head

Zillow paid $50m for StreetEasy in 2013, when it had 1.2 million monthly visitors in New York. That's about $42 a visitor for anonymous traffic. Twenty thousand named, vouched, well-off Manhattan residents are worth considerably more each — plausibly $100 to $300 — which lands at **$2m to $6m** again.

### The four things that actually move the number

**Recurring revenue is the big one.** Pay-per-post is transactional and stops the day people stop posting. Buyers pay roughly double for revenue that renews on its own. Gens de Confiance's rental subscription (€119 for six months) is about 60% of their revenue and it renews. Every version of "make this worth more" runs through some form of subscription, which collides directly with the confirmed decision that membership is free forever. That decision is defensible. It probably also halves the exit, and it should be made with that in front of you.

**Owner dependency is the largest single discount buyers apply.** Today every listing is approved by you personally. If the answer to "what happens when George leaves" is "nothing works", the multiple falls to two or three. Written standards, a trained reviewer and a documented moderation policy are not admin. They are the thing that converts a job into an asset.

**Growth at the moment of sale.** A network at 20,000 that has stopped growing is worth less than one at 12,000 growing 40% a year. Buyers pay for the curve, not the count.

**One city is a single-market asset.** Proving the model travels — Brooklyn first, another city after — is what changes the buyer set from "someone buying cash flow" to "someone buying a platform".

### Who the buyers actually are

Zillow, who already bought the New York incumbent once; a brokerage such as Compass, chasing supply that never reaches the open market; a members' club or a New York media brand buying the audience rather than the software; or a private buyer or search fund buying the cash flow at three or four times earnings. The last of those is the most likely and the least glamorous.

### The honest summary

At 20,000 members this is an excellent small business worth a few million pounds that pays you well while you own it. It is not a venture outcome. The moves that would make it one — advertising, selling data, broker packages, loosening the gate — are the four you have already ruled out. That's a coherent position. Just hold it deliberately rather than by default.

One prerequisite worth starting early: nobody buys a business without two years of clean, verified accounts, and there is currently no entity. Whenever the company gets formed, the bookkeeping from day one is part of the eventual sale price.

---

## Next step

Confirm two things and the rest follows: the apartment price ($99 unless you want to test $75), and whether furniture stays free permanently or only through v1. Once those are settled the Stripe slice can be specced.
