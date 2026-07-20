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

## 2026-07-20 — Slice 2 SHIPPED and verified (incl. member paths via George's session)

- Claude Code shipped Slice 2, two commits, live on prod: listing detail + contact in the editorial grid (rail, kicker with EXAMPLE tag, serif title + price, wide capped lead photo, hairline metadata table, boxed action), dark threshold (login, signup, both resets, apply) via a shared `AuthShell`, `.mh-input` shared form grammar (auto-flips on `.mh-dark`), Turnstile `theme="dark"`, signup `?email=` prefill, footer email → info@.
- New primitives: `AuthShell`, `.mh-input`, `ArrowLink direction="back"`, BoxButton class export for the ContactModal (Server Component can't pass onClick). NavGate now also hides SiteNav on the threshold routes.
- **Cowork member-path QA via George's signed-in Chrome (all pass):** non-owned listing → boxed MESSAGE THE LISTER + modal (CONTACT kicker, "Message Anna.", boxed textarea, SEND — not sent); owned listing (Studio · Soho) → boxed EDIT LISTING; /apply as member → correct redirect to /profile; member footer shows the Membership column.
- **Still visually unverified: the dark /apply form** — only a Tier-1 (account, non-member) session can see it, and none exists. Low risk (it shares AuthShell + .mh-input with verified screens). Check when the first real Tier-1 account applies, or via a disposable account someday.
- **Two findings worth their own line:**
  1. **Localhost auth is dead** (pre-existing since 30 June): `.env.local` uses Cloudflare's always-pass test Turnstile key while Supabase validates against the real secret — every local sign-in/up/reset fails. One-line fix (put the real public site key in `.env.local`) queued as a separate task.
  2. **Local dev talks to the production database** — no separate dev DB. Fine at seed scale; becomes real risk once non-George members exist. Logged as a build-backlog candidate: separate Supabase dev project.
- Observed during QA, for existing open decisions: profile page body values now render in the serif, numeral-1-as-l visible ("June l, 2026") — direct evidence for the Phase 2 serif decision. /listings/mine untouched as planned (archived QA listing still leads; EDIT/REMOVE still old text links) — Slice 3 scope.

## Next steps

- ~~Font wiring fix~~ — DONE 2026-07-17, live on prod.
- **PALETTE DECIDED 2026-07-17: dark outside, light inside.** George chose the split after walking the interactive `outputs/Manhattanite_Mockup_v8_Dark-Outside-Light-Inside.html` (dark park landing → click through → light bone browse; wordmark returns you outside). Landing + (from Slice 2) auth/apply live on park-dark; all product screens on bone-light. v7 (all-dark) and v6 (all-light) remain in outputs as the road not taken.
- **Slice 1 implementation prompt delivered:** `outputs/Manhattanite_ICW-Slice-1_Claude-Code-Prompt_v1.md` — tokens/section grammar, BoxButton + ArrowLink (the two-action system), dark landing rebuild, light browse rebuild with the new ListingCard. Hard requirements in the prompt: EXAMPLE tag stays on cards, gating logic untouched, hero photo from public/ (flag for Phase 4 if weak), auth screens deferred to Slice 2.
- ~~Slice 2~~ — SHIPPED + verified 2026-07-20. **Slice 3 prompt delivered 2026-07-20** (`outputs/Manhattanite_ICW-Slice-3_Claude-Code-Prompt_v1.md`): Stage 0 = the localhost Turnstile key fix; then post-form, profile ×2, /listings/mine (archived → compact rows), admin tidy, smart-quotes sweep + form states. Doc-git-commit rule baked into the prompt. Then Phase 4 brand lock (wordmark, favicon/OG, photo rules, brand-guide v2 with the split-palette rule) and Phase 5 emails.

## Decisions still open (to be made on screens, in phase order)

- Serif: keep Instrument Serif vs paid licence (GT Sectra-class) vs stronger free option — Phase 2. (Fix shipped 2026-07-17 — Instrument Serif now visible on prod; judge on the live screens. Watch the numeral-1-as-l quirk and the serif-body-copy question.)
- Accent: park green vs brick red vs no accent — Phase 2. (Audit confirmed the live site is 100% monochrome in practice.)
- Wordmark concept — Phase 4.
- Mobbin Pro: only if the free cap bites — Phase 1.

## 2026-07-20 — Slice 3 SHIPPED: the last of the screen rework

Live on prod. Commits `eb7f91b` (groundwork) → `5aa045c` (post a listing) → `83c3c56` (profile) → `7f4d71f` (my listings) → `c898603` (admin) → `5798e10` (polish), plus four fixes found on the prod pass. **Phase 3 of the design plan is complete** — every product screen now sits on the same system.

**Groundwork.** Three things Slices 1–2 hand-built per page became components once five more screens needed them: `PageShell` (the light frame — editorial grid, label column with the way back, serif statement closed by a hairline), `MetaRows` (the hairline label/value pairs; listing detail now renders through it rather than keeping a second copy), and an optional `href` on `ListingCard` so a card with no public page renders unlinked instead of pointing at a 404.

**The audit's C+ pages, both fixed structurally rather than cosmetically:**
- `/listings/mine` — the archived QA test listing out-shouted the live ones. Muting it wasn't enough because it was still the same object at the same size. Active listings now use the standard `ListingCard`; **archived ones are compact hairline rows under their own heading** — no image, no card. An archived listing can't outweigh a live one because it is no longer the same kind of element on the page. Status moved into the card kicker's left slot (on your own listings, "In review" is what you came to check).
- `/profile` — out of the centered stack into the grid: tier + avatar in the label column, name as the statement, fields as `MetaRows`. Sponsorship became a small-caps line ("Sponsored by …") rather than its own centered section: trust is the product, but it's a credential, not a chapter. **No new query** — the connections rpc was already on the page.

**Forms.** `/listings/new`, `/listings/[id]/edit` (same component, so it moved with it) and `/profile/edit` all take `.mh-input` + `BoxButton`. The photo and avatar controls got a **dashed** hairline — solid means "a control you act on", dashed means "a space something goes into"; as solid boxes they competed with the real submit. Submit reads "Submit for review" now, because that's what it does under pre-moderation, and the moderation notice sits with the button rather than up the page.

**Admin** got the same frame and the two-action system (queue verbs as ArrowLink-weight text, the CONFIRM step taking the box). Minimal effort by design — George is the only user.

**Four things only the prod pass caught**, all worth remembering as a checklist for future screens:
1. The type-radio row needed 431px inside a 346px column, so "Service" sat **outside the column and could not be tapped at all** on a phone — not merely cropped. Any non-wrapping flex row inside the content column is a mobile risk.
2. `PageShell`'s title closes with a hairline and `MetaRows` opens with one; two rules seven pixels apart read as an empty row. Hence `omitFirstRule`.
3. The admin stat grid draws its hairlines as the container showing through a 1px gap, so an **unfilled trailing cell renders as a grey block**.
4. A `type="date"` input draws its own picker icon, so `mh-select` gave it two chevrons.

**Smart quotes:** swept `&apos;` → `&rsquo;` across 46 occurrences, all verified to be in JSX text rather than attributes before the sweep. **Placeholders were deliberately left alone** (the slice's rule was text, not attributes) — they still contain straight apostrophes and are visible copy, so they're worth a later pass.

**Stage 0 — local auth: attempted, BLOCKED at Cloudflare.** The real site key (`0x4AAAAAADtg85GOzu0Ueq50`, public, lifted from the live bundle) was put into `.env.local` and Cloudflare **rejected the localhost hostname** — the widget renders "Unable to connect to website" and offers no challenge at all, which is worse locally than the test key. Reverted to the test key with the real one recorded in a comment above it. **To finish: add `localhost` to the widget's allowed hostnames in the Cloudflare Turnstile dashboard, then swap the two lines.** Until then no local sign-in, and every gated screen has to be verified on prod against George's session.

**Known blemish, not touched (pre-existing, shipped in Slice 1):** a listing with no photo renders the card's empty beige 4:3 media block, which reads as broken. Visible on `/listings` and `/listings/mine`. Changing it alters the shipped browse layout, so it's flagged rather than fixed.
