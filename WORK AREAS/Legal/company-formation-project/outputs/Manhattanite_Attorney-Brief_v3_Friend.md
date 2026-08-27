# Attorney brief v3 — the version for a friend

*2026-08-26. v2 was written as a cold quote request to a stranger. This is the same substance rewritten for someone who has offered to help, and refreshed to match where the product actually is. Keep v2 for cold outreach.*

**What changed from v2, and why it matters:** the product has moved on, and one change is material to the legal read. See the note at the foot before you send this.

---

## The email

Subject: Picking your brain on Manhattanite — the legal groundwork

Hi [Name],

Thanks for offering — I'm going to take you up on it, and I'd rather be organised about it than send you questions in dribs and drabs.

**What it is.** Manhattanite is an invite-only classifieds site for Manhattan residents. Apartments to rent, furniture to sell, a few services. People apply, I approve them by hand, and existing members can vouch for new ones. Browsing is open; posting and contacting people requires membership. The site never takes payment or sits in the middle of a deal — it just connects two people who then sort it out themselves. I plan to charge a small fee per listing eventually, not at launch.

**Where it actually is.** The product is built and running at manhattanite.com. Twenty listings are live, but they're all seed data that I created and they're labelled as examples on the page. No third party has posted anything yet. I'm a few weeks from inviting a first real cohort, which is why I'm finally doing this properly.

**A bit about me, since it shapes the answer.** Solo founder, funding it myself, based in New York. I might bring someone in later but there's no raise and no share scheme planned. Not a lawyer, not especially technical, so plain English is genuinely appreciated.

Here's what I think I need, in the order I think it matters. Tell me if you'd sequence it differently.

**1. Form the company.** Nothing exists yet, which is the thing that most needs fixing before real people start transacting through something with my name on it. My assumption is a New York LLC, but I'd like your view on whether a Delaware C-corp is worth it given I might raise one day. Then the operating agreement, an EIN, the NY publication requirement and the beneficial-ownership filing.

**2. Review the terms and privacy policy.** These already exist and are live — I wrote them in plain English and they carry a visible notice saying they're working drafts pending a proper review. So this is a read-and-mark-up job rather than a write-from-scratch one. The line I care most about is the one establishing that the site isn't a party to deals between members. I'd also like to know whether the notice itself is doing me any good or whether it's just an admission.

**3. Fair housing on the apartment listings — and honestly, I mostly want a name.** This is the part that worries me. NYC's protections are broader than the federal ones and cover source of income, and I'm about to become a place that publishes apartment listings written by other people. I've drafted rules for members that ban discriminatory language outright and give them somewhere to report it. What I'd like is either your read on whether that's the right shape, or a referral to someone who does housing law properly. I'd rather pay a specialist for an hour than have a generalist guess, and that includes you.

**Two specific things I'd like your eye on.**

First, I've contradicted myself on age. The live terms say you must be 18. My own internal standard says 22, on the basis that it's the contracting age in NY for the kind of transactions members do. I don't know which is right and I'd rather fix it before anyone signs up under the wrong one.

Second, the member rules I mentioned are doing double duty as my non-discrimination policy. I'll send them over — the apartments section is the paragraph that matters.

**Things I think can wait.** Trademark, sales tax, payment setup, insurance, anything to do with hiring. None of it feels live, but say so if I'm wrong.

**One last thing.** I don't want to burn a friendship on free legal work, and I don't want this to be the kind of favour that quietly never happens. If it's easier to keep it professional and bill me for the formation at least, that suits me fine. What I'd really like out of it is a date by which the company exists.

Thanks again.

George

---

## Before you send this — one thing that changed and isn't reflected anywhere yet

`COMPANY/legal-and-policy.md` opens with a "posture for the seed phase" section that the whole risk assessment rests on. One of its four bullets says Manhattanite is **"not making listings public to non-account-holders."**

That stopped being true on 9 June, when the D1 decision moved the trust gate from the viewing layer to the action layer. A logged-out visitor now sees the six most recent listings, and after the design migration they will also see member profiles and search results. Published listings are anonymously readable at the database layer, the images bucket allows anonymous reads, and the site carries full metadata inviting search engines in.

**So the site is publicly readable and crawlable, and the legal file still says it isn't.** That is exactly the fact that changes a lawyer's read on fair-housing exposure, because the question shifts from "a private members' board" to "a public housing-listings publisher."

Two consequences worth acting on:

1. **Update that bullet in `legal-and-policy.md`** so the brief and the file agree. A lawyer working from the stale version would give you the wrong answer confidently.
2. **The timing is actually in your favour, and it's worth saying to him.** No third party has posted an apartment yet. Every listing on the site is your own seed data. So the guardrails can go in *before* the risk exists rather than after, which is a much better conversation to have. That is the real argument for doing this in the next fortnight rather than after the first cohort.
