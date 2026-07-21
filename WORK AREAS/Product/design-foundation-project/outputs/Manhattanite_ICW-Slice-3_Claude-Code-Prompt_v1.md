# Claude Code prompt — ICW redesign, Slice 3: forms, profile, mine, admin, polish sweep

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). Final screen-rework slice. Styling and copy only — zero functional changes, no new data queries.*

---

Implement Slice 3 — the last of the screen rework. Slices 1–2 are live; reuse their system throughout: `.mh-rule`, `.mh-section-grid`, `.mh-label`, `.mh-input`, `.mh-dark`, `BoxButton`, `ArrowLink` (incl. `direction="back"`), `SiteFooter`, `AuthShell`. Design references: the steal sheet (steals 2, 3, 5, 7, 9) and the shipped browse/detail pages — these screens should feel like more pages of the same magazine, no new patterns needed.

## Stage 0 — make local member testing possible (the queued task)

Put the real Turnstile site key into `.env.local` (it's public — it ships in the live site's JS). If Cloudflare then rejects the localhost hostname, report it and stop trying — George would need to add `localhost` to the widget's allowed hostnames in the Cloudflare dashboard, and this slice's forms get visual-only verification instead. Do not create test accounts or post test listings on prod.

## Stage A — post-a-listing form `/listings/new` (light)

1. Editorial grid: label column gets "POST A LISTING" + back ArrowLink; content column gets the serif headline (keep "What have you got?") and the form.
2. All fields to `.mh-input`; labels to the small-caps pattern; keep the existing `mh-checkbox` category row (it already fits the system). Textareas, selects (`mh-select`), and the image-upload control get the same hairline treatment — the upload dropzone may use a dashed hairline (same convention as the Turnstile placeholder).
3. Submit = `BoxButton` ("Submit for review" or the current label). Helper/hint text in slate at 12–13px.
4. The moderation notice ("reviewed before it goes live" or current equivalent) stays — restyle, don't cut.

## Stage B — profile `/profile` and `/profile/edit` (light)

1. `/profile`: move from centered-stack to the editorial grid — label column "MEMBER"; content column: name in serif (~44px), then the existing fields as the same label/value hairline rows used on listing detail. **Do not add data** — if the sponsor's name is already in the page's fetched data, surface it as a small-caps line ("Sponsored by …"); if it isn't, leave a `TODO(slice-4?)` comment instead of adding a query.
2. Actions ("Edit profile", "Apply for membership" for Tier-1, sign out) — primary as `BoxButton`, secondary as ArrowLinks.
3. `/profile/edit`: same form treatment as Stage A. The "ADD A PHOTO" control becomes system-consistent (hairline box button, not the current one-off).

## Stage C — my listings `/listings/mine` (light) — the audit's C+ page

1. Editorial grid with a "MY LISTINGS" label column; serif page title.
2. **Live listings**: the standard `ListingCard`, with EDIT / REMOVE as quiet ArrowLinks in the card footer (boxes stay reserved for primary actions; these are secondary).
3. **Archived listings — the audit fix**: compact rows, not full cards. Small caps "ARCHIVED" status, title, price, date, restore/delete actions as text links, muted (slate), separated by hairlines. An archived QA test listing must never again outshine a live listing.
4. Status kickers (LIVE / IN REVIEW / ARCHIVED) as small caps in the card kicker row.

## Stage D — admin `/admin/*` (light, functional tidy only)

George is the only user; spend minimal effort. Wrap the pages in the editorial grid + label pattern, keep the stat tiles (they work), convert buttons to the two-action system, and make queue rows hairline-separated. No layout inventions.

## Stage E — polish sweep

1. **Smart quotes:** sweep static UI strings for straight apostrophes/quotes → typographic (’ “ ”). UI copy only — do not touch code strings, attributes, or member-entered data. ("Today's listings." already uses ’; this makes the rest match.)
2. Form success/error states on the screens this slice touches: same voice, `.mh-input` error state = the border going ink + a short slate message (no red unless it already exists).
3. Quick pass that every touched screen uses the light `SiteFooter`.

## Verify

1. If Stage 0 unlocked local sign-in: full visual pass of every touched screen as a member locally, desktop + ~390px, including form validation states — but never submit a real listing/profile change on prod.
2. If not: visual verification per screen locally where reachable, and on prod for what needs a session, coordinated with George.
3. `npm run build` clean. Commit in stages, push, verify on prod.
4. **Commit the doc/memory changes to git as well at the end** — project rule after the doc-wipe incident.

## Report back

Per-screen summary (desktop + mobile), the Stage 0 outcome (localhost auth fixed or blocked at Cloudflare), anything the system couldn't express, and confirmation that no data behavior changed.
