# Project Memory — Design Foundation

## 2026-07-16 — Project created

- George's verdict on the current design: okay but not amazing. The bar: chic, eye-catching, elegant, easy to navigate, very professional. Design work had been on the backburner; now it's the active workstream.
- Scope decision: **product-first, then brand** (chosen over "full brand system at once" and "marketing surfaces only"). Matches the brand guide's own sequencing — the first real screens now exist, which is exactly the trigger the guide set for unlocking the identity work.
- Tools locked: Mobbin for inspiration, Claude Design (claude.ai/design) for mockups + component library, implementation in the repo by Claude.
- Delivered `outputs/Manhattanite_Design-Foundation-Plan_v1.md` — 5 phases, ~10–14 sessions: audit → inspiration bank → foundation (serif + accent decisions, component kit, listing card) → screen-by-screen rework → brand lock (wordmark, favicon/OG, photography rules) → emails + final QA.

## 2026-07-17 — Phase 0 done: baseline audit shipped

- Captured 16 desktop screenshots of prod through George's Chrome; graded every screen A–E against the brand guide. Outputs: `Manhattanite_Design-Audit_v1.md` + `outputs/before-screenshots/` (the before half of the end-of-project before/after).
- **Headline finding: the fonts never load.** Instrument Serif + Inter are wired via next/font (their CSS variables sit on `<body>`) but the Tailwind theme never references them — every element on prod renders in the OS default font. It's a bug, not a design decision; fix is a small change in `app/globals.css`. **Agreed order: font fix first, before Phase 1.**
- Grades: everything B−/B except My listings and Profile (C+). Structure is consistently good (paper, hairlines, caps kickers, whitespace, strong copy voice); what drags: system-font typography everywhere, no button/action system (primary CTAs read as disabled grey labels), undesigned listing card, empty beige placeholder block on listing detail (check as possible bug), archived listings at full visual weight on /listings/mine, no accent colour appearing anywhere in practice.
- Phase 3 rework order set in the audit: browse+card → detail → landing → profile+mine → auth → forms → admin.
- Not captured this session (carried forward): logged-out landing page (George's Chrome is signed in — capture from a private window next time) and phone widths (extension window-resize didn't take; phone pass folds into each Phase 3 screen session).

## 2026-07-17 — Font fix shipped (same day as the audit)

- Live on manhattanite.com. Two-part fix in `app/globals.css` only: font mappings moved to `@theme inline`, and the `body` rule repointed from the dead `var(--font-sans)` to `var(--font-inter)` directly (raw var references don't survive `@theme inline` — worth remembering for future token work).
- `font-serif` was already used in ~50 places, so Instrument Serif now renders sitewide — including **body copy on listing detail**, not just headings. The serif decision in Phase 2 should look at whether serif-for-body stays or body reverts to Inter.
- Quirk logged for Phase 2: Instrument Serif's numeral "1" reads like a lowercase "l" at body sizes ("August l"). A serif with better numerals may matter more than aesthetics alone.
- The detail-page beige block from the audit was a transient image lazy-load placeholder, not a bug — confirmed on prod (single image, loads fine, no empty DOM blocks). Struck from the fix list; optional polish: a nicer loading treatment in Phase 3.
- `.claude/launch.json` (dev-only preview config) was created by Claude Code and left uncommitted — advice given: keep it, add `.claude/` to `.gitignore`.

## 2026-07-17 — Phase 1 opened: In Common With chosen as the primary reference

- George found **In Common With** (incommonwith.com) via Mobbin and wants Manhattanite "very similar, with our colour scheme and font." Exceptional fit: Manhattan studio (383 Broadway showroom), editorial, hairlines-not-boxes, photography-led — a living version of the brand guide's reference set.
- Delivered `outputs/Manhattanite_Steal-Sheet_v1.md` — 12 named patterns mapped to screens. Headliners: label-left editorial grid as master layout; the dated "Lately" card becomes the listing card; **boxes reserved exclusively for form controls/actions** (solves the audit's CTAs-look-disabled finding); accent as text colour only (route for park green); full-bleed photographic hero.
- Explicitly NOT taken: ICW's grotesque typeface (Inter + Instrument Serif stay), carousel-first layout, the dark bottom bar in screenshots (Mobbin's chrome, not theirs).
- Caveat logged: ICW leans on art-directed photography; Manhattanite photos are member-supplied — grid and hairlines must carry B-grade photos; Phase 4 photo rules matter more for us.
- Delivered `outputs/Manhattanite_Landing-Mockup_v5_ICW-Direction.html` — full landing in ICW structure with Manhattanite tokens and real listing photos.
- **George's verdict on v5: approved, except categories.** Two category tiles advertise the narrow launch focus ("only two categories") — his call: **no category tiles anywhere for now, just listings**. Steal 4 (serif-over-imagery category tiles) parked until 4+ categories exist. Delivered `outputs/Manhattanite_Landing-Mockup_v6_ICW-Direction.html`: categories section removed, "On the network" expanded to a 2×2 editorial card grid (mixed apartments + furniture, so breadth reads implicitly), footer Browse column de-categorised. **v6 = the approved landing direction** pending George's final look.

## 2026-07-20 — Slice 1 SHIPPED and verified on prod

- Claude Code built and deployed Slice 1: foundation utilities (`.mh-rule`, `.mh-section-grid`, `.mh-label`, `.mh-dark`, `--color-cream`), `BoxButton` + `ArrowLink`, `ListingCard` (light+dark), `SiteFooter` (tier-aware, not surface-keyed — its good call), dark landing at `/`, light browse at `/listings`. Three commits (b998215, 10412d7, 8a5bda3). Full detail in `mvp-build-project/memory.md` (Claude Code logged there).
- Notable implementation notes: SiteNav hidden on `/` via an `x-pathname` header set in `proxy.ts` (server-overwritten, not spoofable); old skyline preserved as `SkylineMark.tsx`; hero = `public/hero-brownstone.jpg` (1400px — soft on retina, carries `TODO(phase-4)` flag).
- Cowork QA on prod (logged-out; George's browser session had expired): landing and browse match the v8 mockup; EXAMPLE tags at full contrast on all seed cards; guest chrome correct on both pages.
- **Open verifications (George, ~30s):** logged-in `/` → `/listings` redirect + member view of browse.
- **Open decisions:** footer email says `hello@manhattanite.com` (mockup's invention) but the real address is `info@` — either create the hello@ alias in Resend/DNS or switch the footer back. Hero photo retina replacement in Phase 4.
- Slice 2 prompt delivered: `outputs/Manhattanite_ICW-Slice-2_Claude-Code-Prompt_v1.md` — listing detail + contact (light, steal 10), auth + apply (dark side), signup `?email=` prefill. Slice 3 after: forms, profile, mine, admin.

## 2026-07-20 — Slice 1.1: founder review feedback + a real bug

- George reviewed Slice 1 on prod. Three changes, delivered as `Manhattanite_ICW-Slice-1.1_Claude-Code-Prompt_v1.md` (run before Slice 2):
  1. **Nav bug (found via his screenshot):** top nav missing on /listings when arriving by client-side navigation from `/` — the x-pathname header approach doesn't survive SPA transitions; fix = client-side `usePathname()` visibility.
  2. **Title:** "The network, today." → **"Today's listings."** (sentence case per brand guide; George's suggestion was "Today's Listings").
  3. **Browse layout:** categories move from a horizontal filter row to a **sticky left category rail** (ICW All Products pattern — George supplied the reference screenshot). Desktop only; mobile keeps the horizontal row. Behavior (`?type=` links) unchanged.
- (Bridge restored 2026-07-20 — all pending files synced to the Mac.)

## 2026-07-20 — Slice 1.1 SHIPPED + doc-revert incident

- Claude Code shipped Slice 1.1 (commits c544566, 409efb2), verified on prod: **nav bug fixed** (`NavGate.tsx` client wrapper with `usePathname()`, x-pathname plumbing removed, click path verified both directions with no hard refresh); title now **"Today's listings."** (with a typographic apostrophe — rest of site uses straight quotes; smart-quotes sweep queued for Slice 3); **sticky category rail** live (pinned at 96px, park dot marker, mobile falls back to the horizontal row).
- Implementation lessons logged by Claude Code, reusable in Slices 2–3: (1) any `nowrap`/horizontal-scroll child inside a grid or flex track needs `min-w-0` on the track; (2) `position: sticky` must go on a child of a stretched grid item, not the item itself; (3) inactive rail dots stay in layout (transparent) so labels never shift.
- **Doc-revert incident:** design-foundation `memory.md` and `COMPANY/memory/session-log.md` on disk were found reverted to their last git-committed state — all 2026-07-17 Cowork entries and Claude Code's session-log entries were wiped (uncommitted doc changes lost to a git operation somewhere between the sessions). Restored from Cowork's copies on 2026-07-20. **Guard going forward: commit COMPANY/ + WORK AREAS/ doc changes to git at the end of every session** — ask Claude Code to include a docs commit, or George runs `git add -A && git commit -m "docs"` after design sessions.

## 2026-07-20 — v9 mockup approved, Slice 2 cleared to build

- Built `outputs/Manhattanite_Mockup_v9_Detail-and-Dark-Auth.html` (3 screens with switcher: listing detail light / sign-in dark / apply dark) at George's request — see before commit.
- **George's verdict: approved with one change — no subhead on the Apply screen** ("Introduce yourself." stands alone; the tell-a-neighbor line cut). Referral hint copy ("A referral helps, but it isn't required.") approved. Slice 2 prompt updated to name v9 as the design contract. Ready for Claude Code.

## Next steps

- ~~Font wiring fix~~ — DONE 2026-07-17, live on prod.
- **PALETTE DECIDED 2026-07-17: dark outside, light inside.** George chose the split after walking the interactive `outputs/Manhattanite_Mockup_v8_Dark-Outside-Light-Inside.html` (dark park landing → click through → light bone browse; wordmark returns you outside). Landing + (from Slice 2) auth/apply live on park-dark; all product screens on bone-light. v7 (all-dark) and v6 (all-light) remain in outputs as the road not taken.
- **Slice 1 implementation prompt delivered:** `outputs/Manhattanite_ICW-Slice-1_Claude-Code-Prompt_v1.md` — tokens/section grammar, BoxButton + ArrowLink (the two-action system), dark landing rebuild, light browse rebuild with the new ListingCard. Hard requirements in the prompt: EXAMPLE tag stays on cards, gating logic untouched, hero photo from public/ (flag for Phase 4 if weak), auth screens deferred to Slice 2.
- Slices queued after 1: **Slice 2** = auth + apply (dark side) and listing detail (light, anchor rail); **Slice 3** = forms, profile, mine, admin tidy; then Phase 4 brand lock (wordmark, favicon/OG, photo rules, brand-guide v2 with the split-palette rule) and Phase 5 emails.

## Decisions still open (to be made on screens, in phase order)

- Serif: keep Instrument Serif vs paid licence (GT Sectra-class) vs stronger free option — Phase 2. (Fix shipped 2026-07-17 — Instrument Serif now visible on prod; judge on the live screens. Watch the numeral-1-as-l quirk and the serif-body-copy question.)
- Accent: park green vs brick red vs no accent — Phase 2. (Audit confirmed the live site is 100% monochrome in practice.)
- Wordmark concept — Phase 4.
- Mobbin Pro: only if the free cap bites — Phase 1.

## 2026-07-20 — Slice 2 SHIPPED: listing detail (light) + the dark threshold

Live on prod, commits `d7f1605` (detail + contact) and `085c0bb` (auth + apply). Design contract was **v9** (`Manhattanite_Mockup_v9_Detail-and-Dark-Auth.html`), which turned out to exist in outputs/ and cover this slice exactly — the brief named v8, but v9 is the specific artifact and won where the two differ.

**Listing detail (steal 10, light form).** Label column = anchor rail (LISTING + "← Listings"); content column = kicker (EXAMPLE tag · category · neighborhood · posted date) → serif statement title with tabular price right → hairline → lead photograph → description → metadata as hairline-separated label/value rows → byline → one boxed action → light footer. The lead photo deliberately drops the card's 4:3 for full content width capped at 640px tall: the detail page is the one screen that exists to show the thing properly. `created_at` joined the select for the kicker date (same row, same RLS, no new reach).

**The dark threshold.** `/login`, `/signup`, `/reset-request`, `/reset-password` and `/apply` moved onto the landing's park ground via a new shared `AuthShell`. These are the door, not a room behind it. SiteNav now stands down on all five (added to `NavGate`'s set) — a tier-aware product nav on a park page was both a visual seam and a contradiction. No transition logic: the existing redirect into light `/listings` IS the door-to-room moment.

**Where the system didn't stretch (first real test beyond the two launch pages):**
- `ContactModal` couldn't consume `BoxButton` — its trigger needs an `onClick`, which a Server Component parent can't pass. Exported `boxButtonClass()` so the one caller that must own its element still matches. Worth remembering as the general shape of this problem.
- `ArrowLink` only pointed forward; every back link was hand-rolled per page. Added `direction="back"`.
- Field styling was duplicated across four files. Now one `.mh-input` utility that flips palette under `.mh-dark`, same pattern as `.mh-rule`. This is what let the auth screens and the light contact form share a definition.

**Decided:** footer contact address is `info@manhattanite.com` (hello@ doesn't exist and never did).

**Verified on prod:** listing detail (guest + member + owner), contact modal, `/listings/[id]/contact`, login, signup incl. `?email=` prefill, both reset screens; desktop and 375/390px. Turnstile renders dark and passes on the park ground — `theme` is the only lever we have (Cloudflare's chrome is in an iframe CSS can't reach); its integration is untouched.

**NOT verified — carried forward:** `/apply`'s dark layout. It requires a logged-in NON-member, and George's account is a member+admin, so it redirects to `/profile`. Everything it's built from (AuthShell, `.mh-input`, dark BoxButton) is verified on the four auth screens, so risk is low, but the field labels and the confirmation state have not been seen. **Check when a Tier-1 account next exists.**

**Environment gotcha found (pre-existing, not from this slice):** no auth flow can be tested on localhost. `.env.local` holds Cloudflare's TEST Turnstile site key while Supabase verifies against the REAL secret, so every sign-in/sign-up/reset dies at the captcha with "Couldn't verify you're human" *while the widget itself shows Success* — two different checks. True since 2026-06-30. Spun out as its own task.

**Tooling gotcha:** a dev server already running before a `globals.css` edit served a STALE stylesheet — new utilities silently absent, `touch` didn't fix it, restart did. Also: the browser pane's screenshots repeatedly returned blank or half-painted frames after a programmatic resize; measuring the DOM disproved each one. Trust measurements over screenshots when they disagree.
