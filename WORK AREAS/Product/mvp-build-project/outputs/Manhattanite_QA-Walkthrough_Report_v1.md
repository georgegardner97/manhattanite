# Manhattanite — QA walkthrough report (v1)

**Date:** 2026-06-12
**Tested on:** production (manhattanite.com), live database.
**Method:** logged-out (true guest, via server fetch) + logged-in as founder/admin (via browser). Every flow clicked end to end.

---

## Verdict

The core product is demo-ready. Every page loads, every flow works, and the trust gate holds at every layer. **Two things to fix before you show anyone**, then a short polish list.

- **Fix before showing anyone:** the legal pages (P0) and the fake sponsor name (P1).
- Everything else is polish you can do at your own pace.

---

## What works (verified live)

**Guest (logged-out):**
- Landing page renders — hero, the new image band (photos load), all sections.
- `/listings` teaser: 6 listings with photos, then the "create an account" wall.
- Listing detail page: full render — photo, price, beds, tags, neighborhood, byline.
- `/login`, `/signup`, password reset all render correctly.
- Trust gate holds: `/apply` and the contact page both bounce a logged-out visitor to sign-in.

**Member + admin:**
- All pages load with no errors: `/profile`, `/listings`, `/listings/mine`, `/admin`, `/admin/moderation`, `/admin/applications`, `/admin/members`.
- Admin console stats are correct (6 accounts, 5 members, 20 listings).
- Member directory shows all members with sponsors, neighborhoods, occupations.

**The big one — post → moderation → contact (tested end to end with a throwaway listing):**
- A member's new post lands as **"In review"** — it does NOT go live on its own. The member sees "Your listing is in review. We'll email you once we've taken a look."
- The post appears in the admin moderation queue with full detail.
- **Approve** has a two-step confirm ("Put it on the network? It goes live for every member right away") → publishes the listing → fires the outcome email to the lister.
- **Remove** has a two-step confirm → archives the listing (off the network, reversible — not a hard delete).
- The **contact form** sends a member's message to the lister, confirms "Your message is on its way," and logs it.

This is the trust layer working exactly as intended. Nice touch: the confirm steps on approve and remove.

---

## Issues to fix

### P0 — broken, fix before anyone sees it

**1. `/terms` and `/privacy` are dead pages (404).**
Every page's footer links to both "Privacy" and "Terms." Clicking either gives a "This page could not be found" error. A visitor who checks the footer hits a broken link — and these are also a legal must-have before real users (per your legal roadmap).
*Fix:* either build the two pages with real content, or remove the footer links until the content exists. Removing the links is a 2-minute change if the content isn't ready.

### P1 — looks unfinished, fix before a demo

**2. Fake "John Robinson" sponsor is still live on two of your listings.**
The Ceccotti walnut dining table and the "Sunny one-bedroom in the West Village" both show "sponsored by John Robinson" — a placeholder name. Anyone who makes an account and browses sees it. (Memory already flagged this: replace before any non-founder sees the network.)
*Fix:* update or clear the sponsor on those two listings.

### P2 — polish, nice before launch

**3. Guests see a "Message the lister" button that just bounces to login.**
The gate works (they can't actually message), but the button tempts a click that dead-ends at sign-in. Cleaner to hide it for guests or relabel it "Sign in to message."

**4. Copy inconsistency on `/signup`.**
The signup heading says "Join the network" while the call-to-action everywhere else says "Create an account." Pick one. (Matches the known "stale CTA library" note.)

**5. Contact email delivery to seed members is unverified.**
The contact flow works and logs correctly, but the test message went to a seed example member (Lila). If the seed accounts have placeholder emails, that message won't actually land in a real inbox. Worth one real send (member → one of your own listings, or a real address) before relying on it in a live demo.

**6. Leftover QA artifact.**
The walkthrough created a test listing ("QA TEST — ignore"), which is now **archived** (invisible to the public, so harmless). I can't hard-delete data, so if you want it gone entirely, delete the archived row from your side. Otherwise it sits harmlessly in your "My listings" as Archived.

---

## Suggested order

1. Remove the footer Terms/Privacy links (or ship the pages) — kills the only truly broken thing.
2. Fix the two John Robinson sponsors.
3. Then the P2 polish whenever.

Items 1 and 2 are quick. After those, the site is clean enough to walk someone through.
