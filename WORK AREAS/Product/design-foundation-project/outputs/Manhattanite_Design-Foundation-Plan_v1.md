# Manhattanite — Design Foundation Plan v1

**The goal:** take Manhattanite from "okay" to a brand a member would proudly screenshot. That's the bar your own brand guide sets.

**The sequence:** product screens first, brand lock second. This is the order the brand guide itself asks for — "decide on a screen, not a swatch." The screens now exist, which means the identity work the guide deferred is finally unlocked.

**The shape:** 5 phases, roughly 10–14 working sessions. Each session is one sitting with one clear output and one decision. Runs alongside the member-acquisition track; neither blocks the other.

---

## Where we actually are

The honest read first: this is not a rebrand from zero.

What's already good:

- A real design system exists in code: warm paper background, soft near-black ink, a dark "jewellery-box" green accent, Instrument Serif for display, Inter for body.
- The landing page has character — the hand-drawn skyline, hairline underline links, restrained fade-ins.
- The brand guide already knows what the brand should feel like (Soho House, Mr. Porter, Le Labo, The New Yorker).

Why it still reads "okay, not amazing":

1. **No wordmark.** The name is set in Instrument Serif, a free Google font used by thousands of sites. Nothing ownable yet.
2. **The palette isn't locked.** The code uses park green; the brand guide reserves brick red; the decision was deferred and never made.
3. **The listing card was never designed.** It's the single most-seen unit on the site and it's currently a plain image-plus-text stack.
4. **Inner screens got function-first treatment.** Forms, profile, auth and admin don't match the care in the landing page.
5. **No photography treatment.** Listing photos carry all the visual weight with no art direction applied.
6. **The finishing details are missing.** Empty states, loading states, favicon, share images, email design. These are what separate good from expensive-feeling.

None of this is a taste problem. The styling pass was deferred on purpose while the product got built. It's now due.

---

## The method (used in every phase)

The same loop, one screen or component at a time. You are taste and decisions. Claude is hands: research, mockups, code, QA.

1. **Collect.** Pull 3–5 reference screens from Mobbin into the project collection. One line each on what we're taking from it.
2. **Mock.** Claude builds 2–3 directions in the Claude Design project so you compare real rendered screens, not descriptions.
3. **Pick.** You choose one direction. One decision per session — never a pile.
4. **Build.** Claude implements the winner in the actual codebase.
5. **Check.** Screenshot review against the brand guide's do/don't table, plus a contrast and tap-target check.
6. **Log.** The decision goes in this project's memory.md so it never gets relitigated.

The two tools you named, and where each sits:

- **Mobbin** is the inspiration bank. Real screens from real products, organised by pattern (onboarding, cards, detail pages). Free account to start; upgrade only if the free viewing cap gets in the way after the first session.
- **Claude Design (claude.ai/design)** is where mockups and the component library live. We create one "Manhattanite Design System" project there and keep it in sync with the codebase, so what you approve visually is exactly what ships. Claude has a direct connection to it from these sessions.
- **The repo** is where it becomes real. Claude does the code; you never touch it.

---

## Phase 0 — Baseline audit (1 session)

You can't fix what you haven't looked at side by side.

1. Claude screenshots every screen in the product — landing, browse, listing detail, all five auth screens, new-listing form, profile, apply, invite, and the four admin screens. Desktop and phone widths.
2. Every screen gets a grade (A–E) against the brand guide's do/don't table, with one sentence on the biggest gap.
3. Together we set the rework order for Phase 3.

**Output:** `Manhattanite_Design-Audit_v1.md` plus a before-screenshots folder (this becomes the before/after proof at the end).
**Done when:** you've seen every grade and signed off the order.

## Phase 1 — Inspiration bank (1–2 sessions)

Build the reference library before touching a single pixel. This is the Mobbin phase.

1. Create a Mobbin account and a collection called "Manhattanite".
2. Search two ways:
   - **By brand**, mapped from your reference set: Soho House, Airbnb (listing detail and photo handling), 1stDibs and The RealReal (premium marketplace patterns), Aesop and SSENSE (editorial restraint in commerce). Anything not on Mobbin we pull from the live site instead — Mr. Porter and Gens de Confiance included.
   - **By pattern**, which is where Mobbin earns its keep: "listing card", "product detail", "onboarding", "application form", "member profile", "empty state".
3. For every screen you save, one line: what specifically we're taking. A card layout. A type scale. The way whitespace is spent. Never "I like this".
4. Claude compiles the result into a steal sheet: 12–15 concrete patterns, each mapped to a named Manhattanite screen.

**Output:** `Manhattanite_Steal-Sheet_v1.md` plus the Mobbin collection.
**Done when:** every screen in the Phase 0 priority list has at least two references against it.

## Phase 2 — Design foundation (2–3 sessions)

The system everything else gets assembled from. Two big deferred decisions get made here, both from screens rather than swatches.

Session A — type and colour:

1. **The serif decision.** Instrument Serif is free and decent; the brand guide's preference (GT Sectra) is a paid licence. Claude mocks the landing page and listing card in three serifs — Instrument as control, one paid contender, one stronger free option — and you pick from rendered screens. If the paid font wins clearly, the licence cost is a known, one-off spend. If it doesn't win clearly, we keep the free one and move on.
2. **The accent decision.** Park green (current) vs brick red (reserved in the guide) vs no accent at all. Same method: identical screen, three ways.
3. Lock the type scale, spacing scale and colour roles as named tokens in the code.

Session B — the component kit, built in Claude Design:

4. Create the "Manhattanite Design System" project and load the locked tokens into it.
5. **Design the listing card properly.** Flagship unit, most-seen thing on the site, gets the most time. Editorial entry, not classified ad.
6. Build out the rest: buttons, inputs, nav, footer, badges, modals, empty and loading states.

**Output:** locked tokens in the codebase plus a living component library in Claude Design.
**Done when:** every [ASSUMPTION] flag in brand-guide.md for type and palette has been replaced by a decision.

## Phase 3 — Screen-by-screen rework (4–6 sessions)

The method loop, applied in most-seen-first order:

1. **Browse (/listings) with the new listing card** — the heart of the product
2. **Listing detail** — where the editorial feel pays off most
3. **Landing** — already the strongest; gets a polish pass, not a rebuild, and picks up the "example listings need labelling" fix from the build checklist
4. **Nav and footer** — the frame around everything
5. **Auth screens** — signup, login, both reset screens, and making the Turnstile widget sit comfortably
6. **New-listing form and image upload** — a member's first act of contribution should feel considered
7. **Profile and apply** — where the trust mechanic is visible
8. **Admin console** — functional tidy-up only; you're its only user

Pace: one or two screens per session, always through the full loop.

**Done when:** every public screen re-grades at B or better against the Phase 0 audit. Admin exempt.

## Phase 4 — Brand lock (2 sessions)

The identity decisions the brand guide deferred, now made in context on strong screens.

1. **Wordmark.** Three concepts — the guide's direction (serif with the italic "ite"), a variation, and one wildcard — dropped straight onto the real landing page and nav. Pick one. This is the moment the brand stops being a font choice.
2. **The mark everywhere it needs to be:** favicon, share/OG image (what shows when someone texts a link — currently nothing), email header.
3. **Photography rules for listings:** what we ask posters for, and a light standard treatment so member photos sit together as one magazine.
4. **Paperwork:** brand-guide.md updated from working defaults to locked decisions; the stale CTA copy in voice-and-copy.md reconciled at the same time (existing checklist item).

**Output:** brand-guide v2, wordmark files in the repo, favicon and share image live.
**Done when:** a screenshot of any screen reads as an identity, not a nicely-styled template.

## Phase 5 — Spread and final QA (1–2 sessions)

1. **Transactional emails** (Resend): application received, approved, contact forwarded. Same magazine, different page. Right now these are the least-designed surface a member actually sees.
2. **Full walkthrough** on desktop and phone, screenshotted and diffed against the Phase 0 set.
3. **Accessibility pass:** contrast on the cream palette, focus states, tap targets, alt text.
4. **Close the loop:** re-grade every screen, archive the before/after, log the final state.

**Done when:** the Phase 0 audit re-run scores A/B across the board and you'd screenshot any screen for Instagram without wincing.

---

## What this project deliberately doesn't touch

- The legal/launch-blocker track (entity, terms review, fair housing) — separate project, unchanged.
- Instagram templates and print (invite cards, welcome packs) — after launch, generated from the locked brand. Cheap to do once Phase 4 exists.
- New features. Zero. This is styling and identity only — scope discipline applies here too.

## Budget exposure

Two possible spends, both optional and both decided in context: Mobbin Pro (monthly, only if the free cap bites) and a serif licence (one-off, only if the paid font clearly beats the free options on screen). Everything else is time.

## Next step

Say the word and Phase 0 starts — Claude can screenshot and grade every screen in one session. The only thing to do on your side before Phase 1 is creating the Mobbin account.
