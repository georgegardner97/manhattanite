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

## 2026-07-20 — Slice 3 done (per George); PHASE 4 OPENED — wordmark concepts delivered

- George reports Slice 3 complete (forms, profile, mine, admin, polish sweep — full report in Claude Code's session / mvp-build memory). Every product screen is now in the ICW system. Phase 3 of the design-foundation plan: done.
- **Phase 4 opened with the wordmark decision.** Delivered `outputs/Manhattanite_Mockup_v10_Wordmark-Concepts.html` — three concepts, each shown in all four contexts (dark hero, light nav, favicon at 32/16px, OG share card):
  - **A — The incumbent:** roman serif, italic "ite" (the live treatment, presented deliberately).
  - **B — The signature:** full-italic serif masthead.
  - **C — The wildcard:** letterspaced Inter caps (the Le Labo/Söhne quiet route).
- Once George picks: same-session ship of favicon + OG share image + any wordmark refinement, then photography rules + brand-guide v2 close Phase 4. Phase 5 (emails) after.

## 2026-07-20 — WORDMARK DECIDED: "Manhattanite." (Concept D)

- After two rounds (v10: A incumbent / B full-italic / C sans caps; v11: D full stop / E lowercase / F engraved caps / G Fraunces / H Playfair), **George chose D — Instrument Serif roman, italic "ite", with a period.** "I like D for now" — the period joins the house voice (headlines all end with full stops). The typeface question (G/H would have reopened it) is settled: Instrument Serif carries the mark.
- This closes the brand guide's oldest [ASSUMPTION]: the wordmark is no longer a default. GT Sectra licence question: dead for now — no paid font needed.
- **Phase 4A implementation prompt delivered:** `outputs/Manhattanite_Phase-4A_Wordmark-Favicon-OG_Claude-Code-Prompt_v1.md` — single `Wordmark` component (period part of the mark, never in running text), favicon (serif M, bone on park, no period at 16px), OG share card via `app/opengraph-image.tsx` (park ground, wordmark + tagline) + full OG/twitter metadata, and the hero retina swap if a better asset exists.
- Remaining in Phase 4 after 4A ships: photography rules + brand-guide v2 (Cowork drafts both). Then Phase 5 (emails) and the final re-grade.

## 2026-07-20 — Phase 5 designed and approved; favicon amended to "M."

- **Favicon amended at George's request: "M." WITH the period** at all sizes (optically centred, dot enlarged at 16px if needed). Phase 4A prompt updated; comparison in `outputs/Manhattanite_Favicon_M-vs-Mdot.html`.
- **The three emails designed and approved** (`outputs/Manhattanite_Mockup_v12_Emails.html`, final): Georgia headlines (inbox-safe serif — web fonts don't load in Gmail), Arial body, bone card, hairlines, one boxed CTA max. George's copy edits applied: application received opens "Your application is in. Every application is read by a person…" (no CTA, deliberate); welcome ends "Welcome to the network." (dash and "whole system" line cut); contact forward is "Someone has messaged you." with the sender's note as a serif pull-quote and the reply line reduced to **"Replies go straight to {name}."**
- Reply mechanics documented: contact email carries Reply-To = sender; lister's address revealed only when they reply. Phase 5 prompt requires verifying/setting that header (the one sanctioned behavior fix — makes existing modal copy true).
- **Phase 5 prompt delivered:** `outputs/Manhattanite_Phase-5_Emails_Claude-Code-Prompt_v1.md` — shared table-based layout helper, three templates + plain-text parts, reviewer ping gets header/footer only (action block untouched), test sends to info@ only, George checks Gmail before done. **This is the final build slice.** Remaining: photography rules + brand-guide v2 (Cowork), final re-grade.

## 2026-07-20 — iPhone pass queued (after Phase 5)

- George's next focus: how the site feels on an iPhone. Two-part plan:
  1. **Emulated audit-and-fix by Claude Code** — prompt delivered (`outputs/Manhattanite_Mobile-Pass_Claude-Code-Prompt_v1.md`): 390×844 DPR-3 primary + 375×667 spot-check, with the iOS trap-list spelled out — **input auto-zoom (.mh-input is ~14.5px, under iOS's 16px threshold — will zoom until fixed)**, vh-vs-Safari-toolbar on the 92vh hero (use svh/dvh), safe-area insets, stuck :hover states on touch (gate with `@media (hover:hover)`), 44px tap targets, filter-row momentum scroll, Turnstile fit, DPR-3 image softness.
  2. **George on his real iPhone** — walks the flows, screenshots anything that feels off into Cowork for taste-level review (the same loop that caught the nav bug).
- Run order: Phase 4A → Phase 5 → mobile pass → then Cowork's paperwork (photo rules, brand-guide v2, final re-grade — the re-grade will now include the mobile screenshot set as the phone-width "after" the original audit never captured).

## 2026-07-21 — Phase 5 SHIPPED: transactional emails restyled to v12

- Claude Code rebuilt every send in `lib/applications/emails.ts` on one shared v12 layout (the `Manhattanite_Mockup_v12_Emails.html` contract): table-based, all-inline styles, no web fonts; Georgia wordmark "Manhattan*ite*." + headlines, Arial body, 600px bone card, hairline rules, bulletproof boxed CTA. Copy for the three v12 emails lifted verbatim, typographic apostrophes included.
- The three: **application received** ("We've got your application." — no CTA, deliberate), **welcome** ("You're in." — one boxed CTA → /listings), **contact forward** ("Someone has messaged you." — sender name + neighborhood bolded, message in the serif left-hairline pull-quote, "Replies go straight to {first name}", mailto CTA "Reply to {first name}").
- **Reply-To finding: already set.** `sendListingContact` had `replyTo: senderEmail` from the contact slice — the modal's "can reply to you directly" promise was already true. No behavior fix needed.
- Reviewer ping kept its load-bearing action block verbatim (npm run approve / SQL fallbacks), now inside the shared header/footer. The other sends (invite, sponsorship request, moderation trio) moved onto the same bones with copy unchanged.
- Every send now carries a **plain-text alternative** (deliverability), built from the same render functions as the HTML.
- Two things beyond pure styling, both flagged: (1) contact.ts now also selects `neighborhood` from the sender's own accounts row (needed for the "(West Village)" credit — RLS read-own, no policy change); (2) interpolated user data (names, titles, messages, notes) is now HTML-escaped — the old templates interpolated raw strings.
- Dark-mode check: bone card + dark text throughout, `color-scheme: light` meta, no white text anywhere — the combination that survives Gmail's dark-mode transform. Verified in-browser at 700px and 360px; one test of each (three emails + reviewer ping) sent to info@manhattanite.com only. **Awaiting George's Gmail check (desktop + phone) before the slice is called done-done.**
- Remaining in the project: photography rules + brand-guide v2 (Cowork), mobile pass, final before/after re-grade.
- **Amendment (same day): the wordmark now matches the site exactly.** The header is a retina PNG of the real Instrument Serif "Manhattan*ite*." (ink on transparent, 180px display at 2x), generated with the same next/og + committed-TTF pipeline as the OG card, hosted at `/email/wordmark.png` (alt="Manhattanite.", Georgia alt-treatment for images-off). Headlines + pull-quotes declare Instrument Serif via `@font-face` (woff2 converted from the committed TTF, hosted at `/email/instrument-serif-regular.woff2`) with Georgia fallback — Apple Mail renders the true serif, Gmail strips `@font-face` and falls back. Both faces verified at 700px and 360px; assets confirmed live on prod (200s) before the three tests were re-sent to info@.


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
