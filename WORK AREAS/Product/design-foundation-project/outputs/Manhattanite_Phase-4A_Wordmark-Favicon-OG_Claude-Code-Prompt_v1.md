# Claude Code prompt — Phase 4A: the wordmark, the favicon, and the share card

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). Small, high-visibility slice. Styling/assets only — no behavior changes.*

---

George has locked the wordmark: **"Manhattanite." — Instrument Serif roman, italic "ite", followed by a period.** (Concept D in `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Mockup_v11_Wordmark-Concepts-Round-2.html` — open it to see the approved rendering in all four contexts.) Ship it everywhere the brand signs its name.

## 1. One wordmark, one source of truth

Create a `Wordmark` component (size + color via props or className) rendering exactly: `Manhattan<em>ite</em>.` — the period is part of the mark. Replace every hand-rolled wordmark with it: the dark landing hero, light `SiteNav`, `AuthShell`, both `SiteFooter` variants, and anywhere else `Manhattan` + `ite` appears as a logo. Rules: the period is never dropped, never italic (it follows the roman); "ite" always italic; no letter-spacing changes from the current treatment.

**Scope guard:** the period belongs to the *wordmark only*. Running text that mentions Manhattanite (terms, descriptions, meta descriptions) does NOT gain a period.

## 2. Favicon

Replace the default favicon using Next's file conventions (`app/icon.tsx` with `ImageResponse`, or a pre-rendered PNG set if simpler): **"M." — with the period** (George's call: the favicon carries the wordmark's full stop). Instrument Serif roman, bone `#F5F0E8` on park `#13241B`, subtly rounded corners are fine. Details that matter:
- **Optically center the pair**: the period pushes the visual mass right, so nudge "M." left until it reads centered (roughly the period's width).
- At **16px**, if the period drops below a rendered pixel or reads as noise, enlarge the dot slightly (a touch bigger than the type's own period) rather than removing it — the period stays at all sizes.
- Check against both light and dark browser chrome.

## 3. The share card (OG image)

Create `app/opengraph-image.tsx` (Next ImageResponse, 1200×630): park `#13241B` ground, centered bone wordmark "Manhattanite." (~120px, serif, italic "ite"), and beneath it the tagline in letterspaced caps at ~24px, bone at 65% opacity: `NEW YORK'S TRUSTED PRIVATE MARKETPLACE`. Load the Instrument Serif font data properly for satori (fetch the TTF or read it from the repo — whatever's reliable at build time; commit the font file to the repo if fetching is fragile).

Also add complete `openGraph` and `twitter` metadata in `app/layout.tsx` (title, description, url, siteName, card type `summary_large_image`) so the image actually appears when a link is shared. Keep the existing title/description text.

## 4. While you're in the hero

The hero photo `public/hero-brownstone.jpg` carries a `TODO(phase-4)` for retina sharpness. If `seed-images/` or the repo has a higher-resolution version of the same or a comparable brownstone exterior, swap it in (≥2400px wide, re-encoded ~quality 70). If nothing better exists, leave the TODO and say so — do not substitute a different subject without George seeing it.

## Verify

1. Wordmark renders identically-structured in all five locations, light and dark, desktop + ~390px. The period never wraps to its own line (use a non-breaking join if needed).
2. Favicon visible in-tab locally; OG image route returns the card (hit `/opengraph-image` directly) and validates (correct dimensions, fonts rendering — not fallback sans).
3. After deploy: check the live favicon, fetch the OG tags from prod (`curl -s https://manhattanite.com | grep og:`), and view the OG image URL on prod.
4. `npm run build` clean; commit code, push, verify. **Commit doc/memory updates to git as well** (project rule).

## Report back

Screenshots or confirmation per surface, what mechanism you used for favicon/OG, the 16px favicon verdict, and whether the hero photo got its retina upgrade.

Not in this slice: photography rules and brand-guide v2 (Cowork is drafting those), emails (Phase 5).
