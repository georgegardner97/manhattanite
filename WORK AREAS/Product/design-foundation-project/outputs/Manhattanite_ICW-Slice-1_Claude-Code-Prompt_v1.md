# Claude Code prompt — ICW redesign, Slice 1: tokens, actions, landing, browse

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). This is a styling slice — zero functional changes.*

---

Implement Slice 1 of the approved redesign: design tokens + the two-action system, the new dark landing page, and the new light browse page.

**The approved reference is in the repo:** open `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Mockup_v8_Dark-Outside-Light-Inside.html` in a browser before writing any code. It is the design contract for this slice — layout, spacing, type sizes, colors, and copy all come from it. The direction: **dark park-green landing ("outside"), light bone product screens ("inside")**, In Common With-style editorial grid throughout.

## Ground rules

- **Styling and copy only.** No new features, no route changes, no data-layer changes, no auth changes. Tier gating (guest teaser of 6, account full-browse, member actions) must behave exactly as it does today.
- American spelling in all product copy.
- The `EXAMPLE` label on example listings is a hard requirement — it must remain clearly visible in the new card design (small caps tag in the card kicker row). Do not drop it.
- Existing tokens in `app/globals.css` (`--color-bone`, `--color-ink`, `--color-slate`, `--color-park`) are the palette. Remember the `@theme inline` lesson from the font fix: any theme value that references another CSS variable must live in `@theme inline`, and raw `var(--font-sans)`-style references outside utilities are dead — use the next/font variables directly or Tailwind utilities.

## Stage A — foundation: hairline grammar + the two-action system

1. **Section grammar utilities** (globals.css or a small component): the editorial section = full-width 1px hairline rule on top (`ink` at ~16% opacity on light, `bone` at ~16% on dark), then a two-column grid: 220px label column (11px Inter 500, caps, +0.14em tracking) + content column, 40px gap, stacking to one column under 860px.
2. **`BoxButton` component** — the only boxed element in the system. 1px border, 13px/26px padding, 11px caps Inter 500 +0.14em tracking, transparent background. Light surface: ink border/text, hover fills ink with bone text. Dark surface: bone border/text, hover fills bone with park text. Prop for surface, or infer via a `dark` container class.
3. **`ArrowLink` component** — secondary action: `→ Label`, 14px Inter, park color on light / cream (#E9E2D3) on dark, underline on hover. 
4. Replace the CTAs on the pages this slice touches (landing, browse, nav) with these two components. The rest of the site migrates in later slices — do not sweep every page yet.

## Stage B — the landing page (dark, logged-out `/`)

Rebuild the logged-out landing to match the v8 mockup's dark "outside" view exactly:

1. **Hero:** full-viewport (~92vh) photograph, chrome overlaid — wordmark top-left (Instrument Serif, italic "ite", bone), nav links top-right (LISTINGS · MEMBERSHIP · SIGN IN, caps, bone), statement bottom-left in Instrument Serif ~46px ("A private marketplace for the people who define New York."), then a `BoxButton` ("Apply for membership" → `/signup` or `/apply` flow entry as currently wired) and an `ArrowLink` ("→ Browse the network" → `/listings`). Gradient scrim top and bottom for legibility, fading into park green at the base so the page continues seamlessly dark.
   - **Hero image:** pick the strongest interior/brownstone photograph already in the repo or seed assets and serve it from `public/` (no signed URLs on the landing). If nothing is good enough, use the best available and add a `TODO(phase-4): replace hero photo` comment.
2. **"On the network" section** (park bg): editorial section grammar, intro line ("From verified neighbors. Every listing is posted by a member, vouched for by a member, and reviewed before it goes live."), then a 2×2 grid of REAL listings pulled exactly as the current landing band pulls them (same query/anon access — do not change data access), rendered as the new card (see Stage C) in its dark variant. `ArrowLink` "→ All listings" bottom-right.
3. **Membership statement section:** serif statement ("Manhattan already trusts Manhattan. We just wrote it down."), supporting paragraph, then the boxed email input + Apply button row. Wire the form to wherever the current landing CTA leads (likely `/signup` with prefilled email if that exists — if not, the button just links to `/signup`; do NOT build new backend).
4. **Editorial footer, dark variant:** wordmark, `hello@manhattanite.com` + "Made in the East Village, New York, NY", link columns (Browse / Membership / Info per the mockup), legal line with Terms + Privacy links. Build it as a reusable `SiteFooter` component with dark/light variants.
5. Logged-in members hitting `/` keep the current redirect behavior. The old hand-drawn-skyline landing is replaced; keep the asset in the repo.
6. **Auth screens are NOT in this slice** — they stay as they are and move to the dark side in Slice 2.

## Stage C — the browse page (light, `/listings`)

Rebuild `/listings` to match the v8 "inside" view:

1. **Product nav (light):** wordmark left (ink), LISTINGS · POST A LISTING · avatar right, bottom hairline. This is the existing SiteNav restyled — same links and tier logic.
2. **Page head:** label-left grid — "LISTINGS" label; content column gets the serif page title ("The network, today.") and the filter row (All / Apartments / Furniture / Other / Services — same filters as today, caps text, active = ink with 1px park underline).
3. **The listing card** (the flagship — build as `ListingCard` component, light + dark variants):
   - Kicker row: neighborhood left, posted date right (11px caps, slate), plus the `EXAMPLE` tag when applicable; 1px hairline under the kicker.
   - Image: 4:3, object-cover, subtle scale-up on hover (1.025, ~1.2s ease-out curve).
   - Title row: Instrument Serif ~26px title + price right-aligned (Inter 500, tabular-nums).
   - One-line description (slate, clamp to ~2 lines).
   - `ArrowLink` "→ View listing".
4. **Grid:** two columns, 56px column gap, 72px row gap (single column on mobile). Replace the current single-column giant-image feed.
5. Guest teaser (6 listings + sign-in prompt) keeps its logic, restyled to match. Byline ("Listed by X · sponsored by Y") stays on the card or moves to detail — keep it wherever it currently renders, restyled small caps.
6. Light `SiteFooter` variant at the bottom.

## Verify (before commit)

1. `npm run dev` + browser: landing logged-out (private window), landing logged-in (redirect intact), `/listings` as guest (teaser + 6 cap), `/listings` as member, filters, a listing click-through.
2. Screenshot landing and browse at desktop and ~390px width — check nothing overlaps and the hero text stays legible.
3. Confirm the EXAMPLE tag renders on example listings in the new card.
4. No console errors; no changed API/data behavior.
5. Commit in logical chunks (foundation / landing / browse), push, verify on the Vercel deployment, and re-check the logged-out landing on prod in a private window.

## Report back

- Screenshots or a summary of landing + browse, desktop and mobile.
- Which hero image you used and whether it needs the Phase 4 replacement flag.
- Any place the mockup couldn't be followed exactly and why.
- Confirmation that gating behavior is unchanged.

Slices 2 and 3 (not now): listing detail (light, anchor rail), auth + apply (dark), forms/profile/mine (light), emails. One slice per session.
