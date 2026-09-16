# Brand Guide — Manhattanite

The visual identity and brand attitude. Works alongside `voice-and-copy.md` (verbal identity) and `product-vision.md` (positioning).

Everything here is a default. Items marked **[ASSUMPTION — confirm or revise]** are calls I made that you should specifically react to.

> **The wordmark and the type are locked as of 2026-09-16 (see below). The final palette is still deferred.** George's call on the palette: hard to lock without seeing it on a real page. Treat the palette below as a working default, not a final spec.

---

## Brand essence

**Quietly confident. Curated. Manhattan.**

Manhattanite should feel like the inside of a Soho House, the cover of The New Yorker, and the smell of Le Labo Santal 33 in the same breath. Refined without being precious. Modern without being trendy. Selective without being snobby.

If a member screenshots Manhattanite onto Instagram, they should feel proud to be associated with it. That's the bar.

## The reference set — what we take from each

| Reference | What we take |
|---|---|
| **Mr. Porter** | Editorial sophistication. Serif wordmark. Restrained luxury without being stiff. Magazine-grade product pages. |
| **Soho House** | Member-aware tone. Confident exclusivity that never has to say it's exclusive. Editorial layout choices. |
| **Raya** | Minimalist UI. Dark, moody, anti-flashy. The aesthetic of "we don't need to sell to you." |
| **Casa Magazines** | Insider Manhattan-ness. Newsstand culture. The texture of being local. |
| **Le Labo** | Restraint. Typography-as-design. Warehouse paper aesthetic. Less is more. |
| **The New Yorker** | Editorial confidence. Civic identity. The red. The serif. Cultural belonging. |

## Brand attributes — do / don't

| Do | Don't |
|---|---|
| Refined | Fussy |
| Confident | Loud |
| Local | Parochial |
| Curated | Elitist |
| Modern | Trendy |
| Warm | Chummy |
| Selective | Snobby |
| Sparing | Sparse |

When in doubt: pretend you're naming a Soho House newsletter, not selling sneakers.

## Wordmark

**Locked 2026-09-16 (George).** "Manhattanite." in handwritten script, drawn in Claude Design. The letterforms were outlined from Cedarville Cursive (OFL 1.1), which allows logo and commercial use. The mark is a drawing: no font is loaded or shipped for it. It replaces the serif Concept D mark (Instrument Serif with an italic "ite", 2026-07-21, reaffirmed 2026-08-18).

**Master files:** `WORK AREAS/Product/design-foundation-project/outputs/script-wordmark-v2/`. The full wordmark and the small "M." in ink, cream, white and black, plus the favicon tile. In the product, the mark is `app/components/Wordmark.tsx`, which renders the same outlines as inline SVG.

**Colors:**

- **Ink #26231F on light grounds.** On the site it takes the page's text color.
- **Cream #FAF6F0 on dark green #13241B.** Green is the mark's own ground and appears in exactly three places: the favicon tile, the apple touch icon and the social share card. Never in the site UI.
- **White or black** for one color use (print, embossing, a partner's page).

**Rules:**

- **The full stop is part of the mark.** Always included. The favicon tile is the one place it is left off, because at 16px it reads as noise.
- **Below 20px tall, use the "M." mark** instead of the full wordmark.
- **Clear space:** at least the height of the M on all sides.
- **Never** stretch it, recolor it outside the four colors above, add effects (shadow, outline, gradient), or drop the full stop.
- **Size by height, not type size.** The script capital M is much taller than its lowercase, so the mark needs more height than a typeset name would to read at the same weight. On the site: 34px in the header (28px on a phone), 32px on cards, 28px on document footers, up to 96px on the landing.

The handwriting is the only expressive element in the identity. Everything around it stays quiet.

## Typography system

**One font: Instrument Sans.** Locked 2026-09-16 (George). Everything on the site and in email is set in it: display, body, UI, labels, numbers. There is no serif. Newsreader and Instrument Serif were both retired when the handwritten mark arrived, because with the mark doing the expressive work a second face has nothing left to do.

- **Display / hero:** Instrument Sans, medium weight, slightly tight tracking.
- **Body:** Instrument Sans, regular. Generous leading on long reads (Terms, Privacy).
- **UI / functional:** Instrument Sans, regular and medium. Buttons, forms, navigation, listing metadata.
- **Caps / labels:** Instrument Sans, uppercase, wide letter spacing, small. Category headers, section labels, the tagline on the share card.
- **Numbers:** Tabular figures where alignment matters (prices, dates).
- **Email:** asks for Instrument Sans and falls back to Helvetica and Arial, since email clients are not sent the font.

## Color palette

**Working base: black + cream.** George's preference. The product should be able to stand on these two alone before any accent is introduced.

### Core (use these freely)

| Role | Name | Hex | Notes |
|---|---|---|---|
| Primary text | Lampblack | #1A1A1A | Warm soft black. Never pure black. |
| Background | Paper | #F8F5EF | Soft warm off-white. Newsprint, not sterile. |
| Secondary | Slate | #4A4A4A | Secondary text, dividers. |
| Subtle | Stone | #E8E2D6 | Backgrounds, borders, hover states. |

### Reserve (use only when an accent is needed)

| Role | Name | Hex | Notes |
|---|---|---|---|
| Reserve accent | Brick | #8C2D2D | Brownstone red. Held back. Open to revisit. |
| Success | Olive | #5C6B3E | Used minimally. Listing confirmed, etc. |

**[ASSUMPTION — Brick is reserved, not the working accent. George is open to it but wants to see the product breathe in black + cream first. Alternatives if Brick gets cut: navy, tobacco/ochre, or no accent at all.]**

Rule of thumb at MVP: 75% Paper, 22% Lampblack, 3% Stone. Brick may appear on the wordmark or a single hero CTA — nowhere else until we see it in context.

## Photography and imagery

**What we show:**

- Real Manhattan interiors. Lived-in, slightly imperfect, specific. Actual books on actual shelves.
- Editorial portraits. Members or members-as-cast. Mr. Porter style, natural light, considered.
- Street photography of the city. Recognizable Manhattan, not generic city.
- Detail shots. A door buzzer. A neighborhood sign. A handwritten label.

**What we don't show:**

- Stock photography of any kind
- Smiling-at-camera lifestyle clichés
- Generic skylines and Empire State Building hero shots
- Heavy filters or saturated color grading
- Anyone we don't have permission to photograph

**Photo treatment:**

- Slight grain, natural color
- Slightly cooler than warm, never Instagram-amber
- No vignettes, no heavy contrast
- Crop tight when in doubt

## Layout principles

- **Generous whitespace.** A page should feel like the front of a magazine, not a feed.
- **Editorial grid.** 12-column with wide gutters. Use the grid; don't fight it.
- **Sentence-case headings.** Like New Yorker headlines, not advertising.
- **Numbers feel important.** Dates, counts, prices — tabular nums, slightly heavier weight.
- **Hairlines, not boxes.** Use 1px Stone dividers before reaching for backgrounds or borders.
- **One thing per screen.** If the page needs to do two things, it's two pages.

## Iconography

- Outline icons, 1.5px stroke. No filled icons unless functional (favorites, saved).
- Use one set consistently. Recommend Phosphor (regular weight) or Lucide.
- Always pair with a text label until the brand is established. Drop labels later only on muscle-memory items (search, profile).

## Tone in design

- Print culture, not app culture.
- Slightly slower than expected. Pages should reward reading, not skimming.
- Listings should feel like editorial entries, not classifieds. Each one has weight.

## What "off-brand" looks like

If something looks like one of these, redo it:

- Bright primary colors
- A second typeface brought in "for character". The handwritten mark is the character; the type stays one quiet sans
- Stock photography of any kind
- Heavy use of emoji in UI copy
- Pop-up modals, promo banners, "Limited time" anything
- Drop shadows, glassmorphism, gradient buttons
- Engagement-bait formatting, urgency badges, animated counters

## Where the brand lives

The brand shows up in five places:

1. **Web app** — the product itself
2. **Marketing site** — landing, about, join page
3. **Email** — invites, member comms, notifications
4. **Social** — Instagram primarily
5. **Print** *(eventually)* — invite cards, member welcome packs, neighborhood guides

Each surface should feel like the same magazine, different pages.

---

## Next steps for visual identity

This file specifies. It doesn't design. To make the brand real:

1. **Build the first product screens in plain black + cream first.** Resist styling. Get the layout right before bringing wordmark and palette in. This is the trigger for unlocking the visual identity work.
2. ~~**Mock the wordmark once screens exist.**~~ Done. Locked as the handwritten script mark on 2026-09-16 (see Wordmark).
3. **Decide on accent.** Either commit to Brick (in context) or replace it. Don't decide on a swatch in Figma — decide on a screen.
4. ~~**Build the type system.**~~ Done. One font, Instrument Sans, 2026-09-16 (see Typography system).
5. **Source the photography.** Either commission a photographer for a launch shoot, or build an initial mood board from licensed editorial sources.
6. **Design the listing card.** This is the single most-seen unit. Worth designing carefully before product build hits styling.

---

*Last updated: 2026-09-16 (handwritten wordmark and one font).*
