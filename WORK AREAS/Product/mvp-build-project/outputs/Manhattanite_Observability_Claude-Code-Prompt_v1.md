# Add error alerting and visitor analytics

**Date:** 2026-08-27
**Written by:** Cowork, for a Claude Code session
**Run after:** the Classifieds merge has landed on `main` and the production deploy is green.

Two small installs. Neither changes anything a member sees.

**Why now:** the site is about to have real people on it, and today if it broke for one of them George would only find out if they emailed him. There is also no way to know whether anyone visited at all.

---

## Before you start — George does two things

Both need an account, so they are his to do, not yours:

1. **Sentry** — sign up, create a project for a Next.js app, and hand over the DSN (the connection string it gives you). Free tier is fine: 5,000 errors a month against a site with twenty listings is not a constraint.
2. **Plausible** — sign up, add `manhattanite.com` as a site. 30-day trial, no card. $9/month after.

If either key is missing when you start, stop and ask for it rather than installing half of this.

---

## 1. Sentry — tell us when it breaks

Install the Next.js SDK and wire it for server and client errors. Put the DSN in the environment, never in the source.

Three things that matter more than the install:

- **Do not send personal data.** No email addresses, no names, no listing contents in the error context. A member's name in an error report is the same leak as a member's name on a public page, and Slice 3a just spent a whole step closing that class of hole. Scrub request bodies.
- **Alert to email, not a dashboard nobody opens.** One email per new error type. Not one per occurrence.
- **Turn off session replay.** It records what people do on screen, it is on by default in some setups, and on a members-only site it is a privacy liability nobody asked for.

Verify by deliberately throwing an error on a scratch route, confirming it arrives, and then deleting the route.

## 2. Plausible — tell us if anyone came

Add the script sitewide. It sets no cookies and collects no personal data, which is why it does not need a cookie banner and why it fits a site whose whole pitch is not being creepy.

Do not add Google Analytics. It would require a consent banner and a longer privacy policy, and it undoes the reason for choosing this.

Set up these goals so the numbers answer a question rather than just counting:

- Someone reached `/apply`
- Someone submitted an application
- Someone reached a listing detail page
- Someone hit the members-only wall

That last one is the interesting number. It tells George how many strangers are bouncing off the gate, which is the closest thing he has to demand.

## 3. Put the privacy page back

Slice 3a removed the claim that the site runs analytics, because it did not. Now it will. Restore an accurate version: name Plausible, say it sets no cookies and collects no personal data, and say Sentry receives error diagnostics with personal data stripped.

Keep the working-draft notice. Counsel has still not reviewed the page.

---

## Verification

1. `npm run build` clean.
2. A deliberate error reaches Sentry, and the report contains no member name or email.
3. Plausible registers a pageview from a real visit to production.
4. `npm run audit:rls` and `npm run audit:gates` still green — neither tool should touch a gate, and this proves it.
5. Both scripts load on a Classifieds page and neither throws in the browser console.

---

## Don't

- Don't put either key in the source. Environment variables, and Vercel's project settings for production.
- Don't enable Sentry session replay.
- Don't add Google Analytics or any advertising tag.
- Don't send request bodies, form contents, or user identifiers to Sentry.

---

## Before you finish

Log it in the session log and mvp-build memory, commit the docs, and push. Note that Sentry and Plausible had been named in three separate morning briefings since 13 August without moving — they are now done.
