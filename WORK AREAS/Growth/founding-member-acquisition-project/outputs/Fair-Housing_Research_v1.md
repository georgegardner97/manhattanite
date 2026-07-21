# Fair housing + apartment listings — legality research (v1)

**Dated 2026-07-02.** Quick research on whether Manhattanite can legally host member-posted apartment listings as a free classifieds site. Not legal advice — a working summary to ground the moderation checklist.

## The short answer

Yes, you can run this. Money is irrelevant to fair-housing law, but federal law strongly protects platforms from liability for what *users* post — as long as the platform itself doesn't ask discriminatory questions. The risk is manageable with two design rules and one moderation habit.

## The four things that matter

**1. "No money changing hands" doesn't exempt anything.** The Fair Housing Act's advertising provision (§3604(c)) and the NYC Human Rights Law apply to housing ads whether or not anyone pays. A free classified is still a housing ad.

**2. But platforms are shielded for user content.** Section 230 of the Communications Decency Act means a website is not treated as the "publisher" of what users post. Craigslist won exactly this case — discriminatory user apartment ads, no platform liability (*Chicago Lawyers' Committee v. Craigslist*, 7th Cir. 2008). Good-faith moderation (our pre-approval queue) does **not** remove this protection.

**3. The trap is asking the wrong questions — the Roommates.com rule.** Roommates.com lost its immunity because its *own form* required users to state preferences (sex, family status, orientation) via dropdowns — the court said that made the platform a co-creator of the discriminatory content (*Fair Housing Council v. Roommates.com*, 9th Cir. 2008). **Design rule: the listing form must never ask for or offer tenant-preference fields.** Free-text a user writes is on the user; a field we build is on us.

**4. George's own listings get no shield.** §230 protects against *others'* content. The founder's listings and any seed listings are Manhattanite's own speech — they must be clean. Same if moderation ever *edits* a listing's text rather than approving/declining it: approve or bounce back to the member, don't rewrite housing ads.

## NYC-specific screening (the moderation checklist)

The most-enforced violation in NYC is **source-of-income discrimination** (illegal since 2008, applies to nearly all rentals regardless of building size). Screen every apartment listing for:

- "No Section 8" / "no vouchers" / "no DSS/SSI" / "no programs" — reject
- Preferences about family status, children, national origin, religion, age, disability, or any protected class — reject
- Steering language ("perfect for young professionals", "ideal for a single…") — bounce back for a rewrite; describe the apartment, not the tenant

## Licensing

Publishing classified ads is not real-estate brokering. No NY real-estate licence is needed to host listings or (later) charge a flat per-post fee — that's the Craigslist/StreetEasy publisher model. What would change this: taking commissions on transactions or negotiating deals. We don't and won't in this model.

## When to get an actual attorney

Rolled into the existing entity-formation triggers: first dollar taken, ~50+ members, or strangers joining. Nothing here blocks seed-phase apartment listings.

## Sources

- [Fair Housing Council v. Roommates.com — Wikipedia](https://en.wikipedia.org/wiki/Fair_Housing_Council_of_San_Fernando_Valley_v._Roommates.com,_LLC)
- [Ninth Circuit opinion (PDF)](https://cdn.ca9.uscourts.gov/datastore/opinions/2008/04/02/0456916.pdf)
- [Seventh Circuit CDA immunity for Craigslist — Lexology](https://www.lexology.com/library/detail.aspx?g=68a08dba-3e61-4188-8ff8-b3f51170427d)
- [NYC CCHR — Source of Income Discrimination](https://www.nyc.gov/site/cchr/media/source-of-income.page)
- [Fair Housing NYC — Real Estate Advertisements](https://www.nyc.gov/site/fairhousing/rights-responsibilities/real-estate-advertisements.page)
- [NYS DHR — Source of Income guidance (PDF)](https://dhr.ny.gov/system/files/documents/2022/05/nysdhr-soi-guidance-2020.pdf)
- [NY DOS — Real Estate Advertising regulations](https://dos.ny.gov/real-estate-advertising)
