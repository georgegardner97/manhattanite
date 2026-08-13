# Brand Guide — Manhattanite (v2 DRAFT)

**Dated 2026-08-01. Status: draft for George's approval — on approval this replaces `COMPANY/brand-guide.md`.** v1 (2026-05-16) was written before any screen existed and was full of [ASSUMPTION] flags. Every one of those has since been decided on real screens, which is exactly how v1 said it should happen. v2 records what shipped. The design system it describes is live on manhattanite.com as of 2026-07-22.

---

## Brand essence (unchanged)

**Quietly confident. Curated. Manhattan.** Soho House interior, New Yorker cover, Le Labo restraint. Refined without precious, selective without snobby. The bar: a member screenshotting Manhattanite onto Instagram feels proud of the association.

The living reference is now concrete: **In Common With** (incommonwith.com) — a Manhattan studio whose editorial, hairline-led, photography-forward site is the structural model for ours (see `design-foundation-project/outputs/Manhattanite_Steal-Sheet_v1.md`). We take structure, never skin.

## Wordmark — DECIDED 2026-07-20

**"Manhattanite." — Instrument Serif roman, italic "ite", with a terminal period.** The period joins the house voice (headlines end with full stops). Chosen from 8 concepts across two rounds (v10/v11 mockups). GT Sectra licensing: dead — no paid font needed.

Rules: rendered only by the `Wordmark` component — the period is part of the mark and never appears in running text ("Manhattanite" unpunctuated in prose). Capital M, lowercase rest. Never all-caps, never lowercase.

**Favicon:** serif M dead-centre, period hanging lower-right as a satellite, bone on park (no period at 16px). **OG card:** park ground, wordmark + tagline, generated via `app/opengraph-image.tsx`. **Email wordmark:** retina PNG of the true mark at `/email/wordmark.png` (email clients can't be trusted with webfonts).

## Typography — DECIDED (with one open review)

- **Display / headlines:** Instrument Serif. Sentence case, terminal periods.
- **Body / UI:** Inter. (In email: Instrument via @font-face where supported, Georgia fallback; body Arial.)
- **Caps labels / kickers:** Inter medium, all caps, letterspaced — the section grammar.
- Open review (formally Phase 2, low priority now the system ships): Instrument's numeral "1" reads as lowercase "l" at body sizes ("June l, 2026"). Either restrict serif to display sizes or revisit the face if it grates in live use.

## Color — DECIDED 2026-07-17: dark outside, light inside

The trust wall is expressed in light. **Outside surfaces** (landing, login, signup, resets, apply) live on **park dark**; **inside surfaces** (browse, detail, forms, profile, admin) live on **bone light**. Crossing the threshold is visible.

| Role | Token | Hex |
|---|---|---|
| Dark ground (outside) | park | #13241B |
| Light ground (inside) | bone | #F5F0E8 |
| Primary text | ink | #0F0E0C |
| Text on dark | bone | #F5F0E8 |
| Secondary text | slate | #5A5A5A |
| Subtle / borders on dark | cream | #E9E2D3 |
| Pure white (sparingly) | paper | #FFFFFF |

v1's Lampblack/Paper/Stone palette is superseded. **Brick (#8C2D2D) remains reserved and unused.** The accent question (park-as-text-color vs none) is formally open but the shipped site is effectively monochrome-plus-park-ground; no accent has been missed in practice.

## Layout and action system — the shipped grammar

- **Label-left editorial grid** (`.mh-section-grid`): full-width hairline rule, small caps label in the left column, content right. Master layout on every screen.
- **Hairlines, not boxes** — with one deliberate exception: **boxes are reserved exclusively for actions and form fields.** Primary action = hairline-boxed button (`BoxButton`); form field = boxed input (`.mh-input`, auto-flips on dark); photo/avatar uploaders = *dashed* hairline (a space something goes into, not a control). This exclusivity is what makes boxes read as pressable — protect it.
- **Links:** forward links are plain underlined text (persistent hairline underline, ~45–50% strength at rest) — the "→" glyph is retired from forward links sitewide (2026-07-22). Back links keep "←" (direction, not decoration).
- **Cards:** the listing card is the dated-editorial-entry pattern — kicker line above its own hairline, photo, serif title with price, byline. EXAMPLE tag at full contrast on seed listings, always.
- Sentence-case headings with terminal periods. Generous whitespace. One thing per screen.

## Photography

Now its own document: `design-foundation-project/outputs/Manhattanite_Photography-Rules_v1.md` (brand imagery rules, member-photo standards moderation applies, the lead-photo rule). Summary: real Manhattan, no stock ever, chrome stays quiet and photos carry the warmth; design for the B-grade member photo. Open asset task: licensed ≥2400px brownstone hero (current is 1400px, soft on retina).

## Tone in design (unchanged)

Print culture, not app culture. Pages reward reading. Listings are editorial entries, not classifieds.

## What "off-brand" looks like (unchanged, plus shipped clarifications)

Bright primary colors; stock photography; emoji in UI; pop-ups, promo banners, "limited time" anything; drop shadows, glassmorphism, gradients; urgency badges and animated counters. Additions from the build: no boxes on non-actions; no "→" on forward links; no category tiles while there are only two categories (parked 2026-07-17 — revisit at 4+).

## Where the brand lives

Web app · marketing/landing · email (all restyled to the system, Phase 5, 2026-07-21) · social (Instagram, dormant until Cohort 2 per gtm-playbook) · print (eventually — invite cards, welcome packs). Same magazine, different pages.

---

## Changelog v1 → v2

- Wordmark: GT Sectra assumption → **Instrument Serif "Manhattanite." decided** (2026-07-20).
- Palette: black+cream working base → **park/bone dark-outside-light-inside decided** (2026-07-17), real tokens documented.
- Typography: GT Sectra assumption → Instrument Serif + Inter, live sitewide since the 2026-07-17 font fix.
- Action system: none specified → boxes-for-actions-only + underlined links, shipped.
- Photography: section → standalone rules doc with member-photo standards.
- All v1 [ASSUMPTION] flags resolved; remaining opens: serif numeral review, accent formalization, hero asset.
