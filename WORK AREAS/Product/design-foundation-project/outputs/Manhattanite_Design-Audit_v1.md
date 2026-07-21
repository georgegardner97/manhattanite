# Manhattanite — Design Audit v1 (Phase 0)

**Date:** 2026-07-17. Screens captured from prod via George's Chrome (desktop, 1440px). Before-screenshots saved alongside this file.

---

## The headline finding: the fonts never load

The single biggest reason the site reads "okay, not amazing" is a bug, not a taste problem.

**The site's two fonts — Instrument Serif (headlines) and Inter (body) — are loaded by the code but never applied to anything.** Checked in the live page: every element on every screen renders in the operating system's default font. The font files sit there marked "unloaded" because no style ever asks for them.

In plain terms: the kitchen bought the good ingredients and then cooked with whatever was lying around. Every headline you've been looking at — "Welcome back.", "What have you got?", "The state of the network." — was designed to be set in an editorial serif and is showing up in the same font as a system dialog box.

Technical note for the fix (one small change in `app/globals.css`): the fonts are wired in via Next's font loader, which sets CSS variables on the body — but the Tailwind theme never maps its `font-sans` / `font-serif` settings to those variables, so Tailwind's default (system font) wins everywhere.

**Recommendation: fix this before anything else.** It's a bug fix, not a design decision — no Mobbin, no mockups needed. One session with Claude Code, and every screen on the site changes character at once. It also resets the baseline: there's no point grading typography choices we've never actually seen rendered.

## The good news

The bones are genuinely strong, and consistent:

- The layout system is disciplined everywhere: warm paper background, hairline dividers, letterspaced caps labels, one column, generous whitespace. Nothing violates "hairlines, not boxes" except the admin stat grid (which is exempt).
- The voice is doing its job. "What have you got?" / "Forgotten it?" / "The queue is clear." — every screen sounds like Manhattanite.
- The kicker-plus-headline pattern (small caps label above a big headline) is used on every page. That's an identity waiting for its typeface.
- The wordmark treatment (italic "ite") already exists in the nav and on auth screens — in the wrong font, but the idea is in place.

Nothing here needs tearing down. It needs the intended type, a real action system, and per-screen care.

## Grades (A–E, against the brand-guide do/don't table)

| Screen | Grade | Biggest gap |
|---|---|---|
| Browse `/listings` | B− | Every listing gets identical full-width treatment — a feed, not an edited page; no neighbourhood/category on the card itself. |
| Listing detail | B− | A large empty beige placeholder block sits mid-page (missing second image?); "MESSAGE THE LISTER" — the page's whole point — looks like a label, not an action. |
| Contact | B | The nicest screen captured ("Message Anna." + reassurance line); fields and submit still read as unstyled. |
| Post a listing | B | Strong headline, coherent form; long single scroll with no sense of progress. |
| My listings | C+ | An archived QA-test listing leads the page at full editorial size — archive deserves a compact, greyed row. |
| Profile | C+ | Reads as a receipt, not a membership card: no photo, sponsor line not surfaced, nothing that says "you're in". |
| Profile edit | B− | Fine form; the boxed "ADD A PHOTO" button is the only boxed button on the site — inconsistent. |
| Login / signup / reset | B− | Centered wordmark + headline pattern is right; the submit ("SIGN IN", "SEND THE LINK") renders as grey letterspaced text that looks disabled. |
| Admin dashboard | B | Stat tiles work; boxed grid is off-system but admin is exempt. |
| Admin moderation | B | Good empty state. Functional tidy-up only. |
| Terms | B | Reads well; box notice is acceptable here. |

No screen fails outright, and no screen is above B. That's the signature of a solid structure rendered in the wrong type with no action system.

## Cross-cutting issues (these are the real Phase 2/3 targets)

1. **Typography bug** — see headline finding. Fix first.
2. **Actions have no affordance.** Every button on the site is letterspaced caps text, usually grey. Primary actions (sign in, send, message the lister) are visually indistinguishable from section labels — several look disabled. The site needs one designed action set: a primary (ink-filled or firmly underlined), a secondary, and a text link. This is the "easy to navigate" half of your brief.
3. **The listing card was never designed.** Confirmed. Image + title + price + paragraph + byline, identical for a $4,200 apartment and a $250 coffee table. The plan's Phase 2 flagship task stands.
4. **Detail page has a broken-looking placeholder** — a full-width empty beige block where a second image should be. Looks like a bug; worth checking alongside the font fix.
5. **No accent colour appears anywhere captured.** The site is 100% monochrome in practice. Fine as a baseline — but it means the Phase 2 accent decision (green vs brick vs none) is genuinely open; nothing is visually committed yet.
6. **Archived listings get the same visual weight as live ones** on `/listings/mine`.

## What this session couldn't capture (carry to next)

- **The logged-out landing page** — you're signed in on this Chrome, and signing you out to screenshot it wasn't worth it. It redirects straight to `/listings` for members. Next session: capture it from a private window (or I'll grade it from the deployed code). It's Phase 3 item anyway.
- **Phone widths.** The window resize wouldn't take through the browser extension this session. The phone pass moves into each Phase 3 screen session, where it belongs.
- **Favicon / share image** — already a known Phase 4 gap.
- **Emails** — Phase 5, unchanged.

## Proposed rework order (for Phase 3, after Phases 1–2)

1. ~~Font wiring~~ — do now, before Phase 1. Bug fix.
2. Browse + the new listing card (Phase 2 designs it, Phase 3 ships it)
3. Listing detail (incl. placeholder bug + a real "Message the lister" action)
4. Landing (needs the logged-out capture first)
5. Profile + My listings (the membership-feel pair)
6. Auth screens (mostly inherit the button system — cheap once tokens exist)
7. Post-a-listing + profile edit forms
8. Admin (functional tidy only)

## Next step

Say go and the font fix happens first — one Claude Code session, every screen changes at once. Then Phase 1 (your Mobbin account + the steal sheet) starts on top of a site that finally looks like what the code intended.
