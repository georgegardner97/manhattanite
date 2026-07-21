# Claude Code prompt — Font wiring fix

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). One session, no design decisions.*

---

Fix the site-wide font bug. The whole deployed site renders in the OS system font even though Instrument Serif and Inter are loaded. No visual redesign — this is a wiring fix only.

## The diagnosis (already confirmed on prod — trust this, but verify locally)

- `app/layout.tsx` loads Inter and Instrument Serif via `next/font` and puts their CSS variables (`--font-inter`, `--font-instrument-serif`) on `<body>` via classes. That part works.
- `app/globals.css` maps them in the Tailwind theme:

```css
@theme {
  --font-serif: var(--font-instrument-serif);
  --font-sans: var(--font-inter);
}
```

- **This is the bug.** In Tailwind v4, a plain `@theme` emits these as custom properties on `:root`. At `:root`, `var(--font-inter)` can't resolve (the variable only exists on `<body>`), so `--font-sans` and `--font-serif` compute to guaranteed-invalid. Every `font-family` that references them collapses, and the page inherits Tailwind preflight's default `ui-sans-serif` stack. Confirmed in the live DOM: `--font-sans`/`--font-serif` are empty and zero elements render Inter or Instrument Serif.

## The fix

1. In `app/globals.css`, move the two font mappings out of the main `@theme` block into an **`@theme inline`** block (Tailwind v4's documented pattern for `next/font` variables):

```css
@theme inline {
  --font-serif: var(--font-instrument-serif);
  --font-sans: var(--font-inter);
}
```

Leave the color variables in the existing plain `@theme` block — they're literals and are fine.

2. Grep the codebase for `font-serif` usage. If components already use the `font-serif` utility on display headings (the `Listings` h1, listing titles, "Welcome back." etc.), the serif will now appear there automatically — good, change nothing. If almost nothing uses `font-serif`, stop and report which headings exist and where — do NOT go applying serif across components on your own; that styling pass is a separate project.

3. While you're in there, one small bug check (fix only if it's trivially a bug, otherwise just report): on the listing detail page (e.g. `/listings/[id]`), a full-width empty beige block renders between the hero image and the description — it looks like an empty second gallery slot being rendered when a listing has only one image. If the gallery maps over image slots without filtering empties, filter them.

## Verify

1. `npm run dev`, open the browse page, a listing detail, and `/login`. In the browser console run:

```js
JSON.stringify({
  fonts: [...document.fonts].map(f => f.family + ':' + f.status),
  body: getComputedStyle(document.body).fontFamily,
  h1: getComputedStyle(document.querySelector('h1')).fontFamily
})
```

Pass = body computed font-family starts with Inter, at least one Instrument Serif face reports `loaded`, and (if `font-serif` is used on headings) the h1 reports Instrument Serif.

2. Eyeball the pages — the only expected change is typefaces (and the placeholder fix if applied). Layout, spacing, and colors must be untouched.

3. Commit with a clear message (e.g. `Fix Tailwind v4 font wiring: @theme inline for next/font variables`), push, wait for the Vercel deploy, then re-run the same console check on manhattanite.com and confirm there too.

## Guardrails

- Touch `app/globals.css` and (only if the gallery bug is real) the listing detail component. Nothing else.
- No new fonts, no font swaps, no styling opinions — the serif-vs-serif decision happens later in the design project, on screens that finally render the current fonts correctly.
- Report back: what changed, the before/after console output, and whether `font-serif` was already in use on headings (this tells us whether the serif is now visible sitewide or still needs applying — a key input for the next design session).
