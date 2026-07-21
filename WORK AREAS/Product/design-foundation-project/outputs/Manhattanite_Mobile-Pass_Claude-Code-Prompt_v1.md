# Claude Code prompt — the iPhone pass

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). Run after Phase 5. A dedicated mobile audit-and-fix slice: every screen at iPhone dimensions, plus the iOS-specific traps desktop testing never catches.*

---

Audit and fix the entire site at iPhone dimensions. Emulate **390×844, DPR 3** (iPhone 14/15 class) as the primary target, with a spot-check at **375×667** (SE class — the smallest real-world case). George will separately walk the site on his physical iPhone; your job is to catch everything catchable in emulation first, and fix what you find within the existing design system (`.mh-*` utilities, BoxButton, ArrowLink — no new patterns, no behavior changes).

## The iOS-specific traps — check every one explicitly

1. **Input auto-zoom.** iOS Safari zooms the whole page when a focused input's font-size is under 16px. `.mh-input` is currently ~14.5px — this WILL zoom. Fix: inputs at ≥16px on touch/small viewports (a media query bump is fine; desktop can stay as-is). Check every field: auth, apply, post form, profile edit, contact modal, landing email row.
2. **Viewport-height units vs the Safari toolbar.** The landing hero uses ~92vh; on iOS, `vh` ignores the collapsing toolbar, causing jumpy or overflowing heroes. Use `svh`/`dvh` (with a `vh` fallback) so the hero fills the *visible* screen on load without a jump.
3. **Safe areas.** Check the hero chrome and the footer against notch/home-indicator overlap in both orientations; apply `env(safe-area-inset-*)` padding where content touches screen edges.
4. **Hover has no meaning on touch.** The card image scale-up, `mh-link` underline animations, BoxButton fills — verify none of them get "stuck" after a tap (iOS applies :hover on first touch). Where a hover style causes a double-tap requirement or a stuck state, gate it with `@media (hover: hover)`.
5. **Tap targets.** Every interactive element ≥44×44px effective size: nav links, the category filter row, arrow links, card footer actions (EDIT / REMOVE), auth links, footer links. Small caps text links likely need padding, not font-size changes.
6. **The horizontal filter row** on browse: confirm it scrolls with momentum, the active item is visible on load for every `?type=`, and nothing clips at 375px.
7. **Turnstile at 390px** on the dark screens: fits the column, no horizontal overflow.
8. **Images:** the hero and listing photos at DPR 3 — flag (don't fix beyond what exists) anything noticeably soft; confirm `sizes`/responsive attributes aren't forcing oversized downloads on mobile data.

## The sweep

Every route, both palettes, logged-out and (using the Stage-0 localhost auth fix from Slice 3, if it landed) logged-in: landing, browse (each filter), listing detail, contact, login, signup, both resets, apply, profile, profile edit, post form, my listings, admin (quick look), terms, privacy. Screenshot each at 390×844; keep them in a folder and commit alongside the fixes so there's a mobile "after" set.

## Verify

1. Re-sweep after fixes; no horizontal scroll anywhere at 375 or 390; no input zoom on focus; hero stable during toolbar collapse.
2. Desktop spot-check that no mobile fix regressed the wide layouts (the `@media` gating should guarantee it — confirm on landing, browse, detail).
3. `npm run build` clean; commit, push, verify the key screens on prod at mobile size. **Commit doc/memory updates to git as well.**

## Report back

The trap-list verdict one by one (found/fixed/not-applicable), anything flagged-not-fixed (soft images), and the screenshot folder path. Note anything that genuinely needs a real device to judge — that's George's half of the pass.
