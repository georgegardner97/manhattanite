# GDC mechanics, decoded — and what to apply to Manhattanite (v1)

**Date:** 2026-06-12. Researched from inside a live GDC member account (Emma's, with George's access), read-only — no actions taken on her account.

This answers your five questions and grounds each in what Gens de Confiance actually does.

---

## Part 1 — How GDC actually works (the parts that matter)

### Sponsorship is the whole engine — and it's "three sponsors"

- To become a validated member, you need **at least 3 sponsors** ("parrains"). A sponsor is an existing member who certifies to everyone else that you're trustworthy.
- You sign up first (real name only — pseudonyms rejected), *then* go find your 3 sponsors. Your account is validated by moderators once you have them.
- You find sponsors three ways: (1) connect your **address book / Facebook** so GDC shows which of your contacts are already members → ask them to sponsor you; (2) search the **member directory**; (3) **invite** close contacts to join, who then sponsor you.
- GDC is explicit that they never sell your contacts or email on your behalf — the address-book match is just to surface who you already know.

### Trust is a status ladder, driven by sponsoring others

- Every member has a **status**: Emma is "Débutante" (Beginner). The next rung is "Confirmée" (Confirmed).
- You climb by **sponsoring other people** ("filleuls" = the people you vouch for). Emma has 5 sponsors but 0 filleuls; she needs to sponsor 3 people to reach Confirmée.
- Status **gates power**: a Débutante can only sponsor **2 new people per month**. Higher status = more. This is how they keep quality as the network scales — your ability to pull people in is rationed by how trusted you are.
- So sponsorship is **two-directional and ongoing**: parrains vouch for you coming in; you become a filleul-maker (sponsor) to climb. Even sponsoring an existing member "reinforces their profile."

This maps almost exactly onto the graded trust score already sketched in your `strategy-blueprint.md` (Explorer / Verified / Trusted / Connector). GDC's Débutante → Confirmée → … is the same idea, live.

### Categories are broad — utility first

GDC is nothing like "two categories." Their tree: Real estate (rent + sale), Vacation rentals, Furniture & Decor ("Home"), Vehicles, Jobs, Services & Benefits, Babysitting, Clothing & Accessories, Leisure & Sports, Ticketing & Events, Associations. Plus a **separate "Services & Professionals" track** (paid pro profiles) sitting alongside the peer classifieds. The breadth is the point — it's genuinely useful for daily life, which is what earns the invite.

### Login lands on discovery, not a profile

Signing in drops you on a search-first home: *"Hello Emma — what are you looking for today?"* with the category tiles and fresh local listings. Your profile and account management are tucked away, not the landing.

### The nav puts actions up top, "my stuff" under the avatar

Top bar: **Post an ad · Invite a loved one · Announcements ▾ · Directory ▾**, then icon shortcuts (favorites, sponsorship, notifications, messages), then your **avatar ▾**. Everything personal — *your profile, manage your ads, messages, your trips, settings, log out* — lives inside the avatar dropdown. "Manage your ads" is **not** a top-level nav item. There's no admin link in sight for a normal member.

---

## Part 2 — Your five questions, answered

### 1. Login should go to /listings, not /profile — agree

GDC does exactly this, and it's right for a marketplace: the listings *are* the value, so show them the second someone's in. **Recommendation: change the post-login redirect (and the signed-in redirect on `/`) to `/listings`.** Easy change, clear win. A brand-new account browsing the network immediately is also better for conversion to membership.

### 2. More categories (apartment / furniture / other / service) — agree, with a nuance

Your architecture is already built for this: one `listings` table with a `type` and a flexible `details` field, designed to extend without a schema rebuild. GDC's breadth shows the strategic value — utility earns the invite.

- **"Other"** (a catch-all for any second-hand good — clothes, electronics, bikes, baby gear) is the highest-value, lowest-effort add. It reuses the furniture layout almost exactly and instantly makes the network feel alive (GDC's biggest volume is exactly this miscellaneous second-hand stream).
- **"Service"** is worth adding but is a slightly different shape — a service isn't a one-off priced object (think hourly rates, "offering" vs "looking for"). GDC even separates services/pros into their own track. It can launch simple (title, description, optional rate) and get richer later.
- **Recommendation:** add **Other** and **Service** to the type set now, keeping both on shared simple fields; treat service-specific fields and a Jobs category as fast-follows. This is one focused build slice (extend the type, the post form's toggle, the browse filter, and the detail layout).

### 3. Declutter the top nav — agree; and Admin is already safe

- **Admin is NOT shown to everyone** — the nav only renders it when `role === 'admin'`. You see it because you're the admin; a normal member never does. So that's already correct; we can also tuck it under the avatar menu just to tidy your own view.
- **"My listings" should move** off the top bar. GDC's pattern is the answer: a small **avatar dropdown** holding Profile, My listings, (Admin, if admin), Log out. Top nav then reads: **Listings · Post a listing · [Apply for membership for accounts] · avatar ▾**. This needs a small dropdown component but is a clean, self-contained nav refactor.

### 4 & 5. The sponsor mechanism — the real prize

Today Manhattanite has: sponsor defaults to George (seed), a floor of 1, and **no member-facing way to get or give a sponsorship**. GDC shows the destination. Here's a phased path that fits your stage:

**Phase A — make sponsorship real, member-to-member (next meaningful slice).**
Two flows: (a) a member can **invite** someone by email; (b) an applicant can **request sponsorship** from existing members (start with: name your sponsor / pick from the member directory, rather than address-book matching). Approval still passes through your moderation, but the sponsor is now a real member, not George-by-default.

**Phase B — raise the floor as the network grows.**
GDC requires 3 because it has millions of members. You have 5. **You can't require 3 sponsors when there aren't enough members to give them** — the floor has to scale with density: 1 now → 2 soon → 3 once there's a real crowd. This is already your stated direction; just make it an explicit, adjustable setting.

**Phase C — the trust-status ladder (the strategy-blueprint vision, made concrete).**
Mirror GDC's Débutante → Confirmée: a member's status rises as they sponsor others, and status gates power — e.g. how many people you can bring in per month, or eventually posting privileges. This is the graded trust score from `strategy-blueprint.md`, and GDC proves it works. It's a bigger build — right after A and B.

**Phase D — address-book / contact matching.** Powerful for finding sponsors, but privacy-heavy and a large build. Defer until the network is big enough that "who do I already know here?" is a real question.

**One strategic caution:** sponsorship is GDC's *entire* moat, and it's also their biggest friction — needing 3 sponsors is a real wall to entry. For a brand-new NYC network, that wall could stall you before you have density. Lean toward a **low floor early** (1–2), seeded generously by you, and tighten as you grow. Trust is the product, but an empty network is no product at all.

---

## Suggested order of work

1. **Login → /listings** (tiny, do anytime).
2. **Nav refactor** — avatar dropdown, move My listings/Admin in (small, self-contained).
3. **Categories** — add Other + Service (one focused slice).
4. **Sponsorship Phase A** — member invite + request-a-sponsor (the meaningful one; 2–3 sessions).
5. Phases B–D as the network grows.

Numbers 1–3 are quick wins that make the product feel more finished and more useful. Number 4 is the strategic centerpiece — it's what turns Manhattanite from "George approves everyone" into a self-propagating trust network like GDC.
