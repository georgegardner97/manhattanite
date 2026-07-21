# Claude Code prompt — ICW redesign, Slice 2: listing detail + the dark auth side

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). Styling and copy only — zero functional changes.*

---

Implement Slice 2 of the approved redesign. Slice 1 (tokens, BoxButton/ArrowLink, dark landing, light browse) is live — reuse its components and utilities (`.mh-rule`, `.mh-section-grid`, `.mh-label`, `.mh-dark`, `ListingCard`, `SiteFooter`, `BoxButton`, `ArrowLink`).

**The design contract for this slice is `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Mockup_v9_Detail-and-Dark-Auth.html`** — George-approved; open it in a browser and use its bottom switcher to see all three screens (Listing detail / Sign in / Apply). It supersedes the prose below wherever they differ. Notes from the approval round: the Apply screen has NO subhead under "Introduce yourself." (removed at George's request); the referral hint line ("A referral helps, but it isn't required.") is approved copy. v8 (`Manhattanite_Mockup_v8_Dark-Outside-Light-Inside.html`) remains the contract for the already-shipped pages, and the steal sheet (`Manhattanite_Steal-Sheet_v1.md`, steals 2, 6, 7, 9, 10) covers the reasoning.

## Ground rules (unchanged from Slice 1)

- Styling and copy only. No auth logic changes, no data-access changes, no new routes.
- American spelling. EXAMPLE tag stays wherever example listings appear.
- Tier gating untouched: who can see and do what does not change on any screen.
- The Turnstile widget on auth screens must keep working — restyle around it, never modify its integration.

## Stage 0 — one-line fix first

The `SiteFooter` contact email currently reads `hello@manhattanite.com`, which doesn't exist. Change it to `info@manhattanite.com` (the real, receiving address). If George has since set up hello@ as an alias, he'll say so — otherwise info@ is the decision.

## Stage A — listing detail `/listings/[id]` (light side)

Apply steal 10 (anchor rail + statement) in its light form:

1. **Lead:** the primary photo goes wide and confident — full content-width, generous height (not a squeezed 4:3). Title moves above it in the label-left grid: label column gets "LISTING" + the back ArrowLink ("← Listings"); content column gets the serif title (~44px) with price right-aligned (Inter 500, tabular), and the kicker row (EXAMPLE tag if applicable · category · neighborhood · posted date) in small caps above a hairline.
2. **Body in the editorial grid:** description paragraphs in the content column (keep the serif body if that's what currently renders — do not change the type choices this slice). Metadata (beds, tags, neighborhood, available from) as small-caps label + value pairs, hairline-separated.
3. **The action:** "Message the lister" becomes a `BoxButton` (light surface) — the page's single primary action, sitting after the byline. Byline ("Listed by X · sponsored by Y") stays, small caps.
4. **Gallery:** additional photos (when present) stack below the lead at content width with consistent spacing. Keep the existing signed-URL logic exactly.
5. Light `SiteFooter` at the bottom. Contact page `/listings/[id]/contact` gets the same treatment: editorial grid, boxed input/textarea, `BoxButton` submit ("Send"), ArrowLink back.

## Stage B — the dark side: auth + apply

These screens are the threshold — they join the landing's world (park ground, bone type, `.mh-dark`):

1. **`/login`, `/signup`, `/reset-request`, `/reset-password`:** park background, centered column. Serif wordmark up top (links back to `/`), kicker + serif headline (keep the existing voice: "Welcome back.", "Join the network.", "Forgotten it?"). Inputs: boxed hairline (bone at ~75% border), dark-surface `BoxButton` for the submit — **the submit must finally read as pressable.** Secondary paths (e.g. "Forgot password?", "Already have an account?") as ArrowLinks or underlined text links, muted bone.
2. **Turnstile:** keep the widget functional; if it supports a dark theme prop, use it; otherwise leave its default rendering and give it comfortable spacing.
3. **`/signup` email prefill:** the landing's membership form submits GET to `/signup` with `?email=` — read it and prefill the email field (client-side is fine). This is the one tiny behavior addition in this slice; it completes a loop Slice 1 opened, adds no new capability.
4. **`/apply`:** dark side too — it's part of the threshold. Editorial grid, same field styling, `BoxButton` submit ("Submit application"). The reassurance copy and confirmation state keep their current text unless it's obviously stale.
5. On success, the existing redirects stay exactly as they are — arriving into the light product after signing in IS the door-to-room moment; do not add any transition logic.

## Verify

1. Full auth loop on local dev: signup (with and without `?email=`), login, both reset screens, logout. Turnstile renders and passes.
2. Listing detail + contact as each tier that can currently reach them; EXAMPLE tag, byline, signed images all render.
3. Desktop + ~390px width screenshots for every touched screen — no overlap, no horizontal scroll.
4. `npm run build` clean; commit in two chunks (detail+contact / auth+apply), push, verify the deployed screens on prod in a private window.

## Report back

- Screenshots or summary per screen, both widths.
- Turnstile behavior on the dark ground.
- Any spot the system didn't stretch cleanly (first real test of the components beyond the two launch pages).
- Confirmation the auth flows behave identically.

Not in this slice: forms (`/listings/new`, `/profile/edit`), profile, `/listings/mine`, admin, emails. Those are Slice 3 and Phase 5.
