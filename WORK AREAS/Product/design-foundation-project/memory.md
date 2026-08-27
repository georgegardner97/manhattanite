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

## 2026-07-21 — Phase 4A live + two founder refinements

- **4A verified live by George:** wordmark "Manhattanite." with the period now on prod (his screenshot confirms the nav); Slice 3's rail alignment and "Everything else" label also confirmed live.
- **Email wordmark mismatch caught by George** (site = Instrument, email mock = Georgia). Phase 5 prompt amended: the email wordmark ships as a retina PNG of the real Instrument Serif mark (generated via the OG pipeline, hosted at /email/wordmark.png), and headlines use Instrument via @font-face with Georgia fallback (Apple Mail renders the true serif — the audience's client; Gmail falls back). Body stays Arial.
- **Favicon refinement (George):** shipped version centred the "M." pair, pushing the M left — read as off-centre. Comparison built (`outputs/Manhattanite_Favicon_Centring.html`): current vs M-dead-centre-with-hanging-period vs uncased park-on-transparent (shown failing on dark chrome; adaptive SVG noted as the rescue). **Decision: Option 1 — M dead centre, period hangs lower-right as a satellite.** Amendment snippet provided for the Claude Code session.
- Queue unchanged: favicon amendment → Phase 5 (emails, with font amendment) → iPhone pass → Cowork paperwork (photo rules, brand-guide v2, final re-grade).

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

## 2026-08-01 — Close-out paperwork drafted (Cowork); prod verify done

- The three remaining Cowork deliverables are drafted in outputs/, awaiting George's review: `Manhattanite_Photography-Rules_v1.md` (brand imagery + member-photo standards moderation applies + lead-photo rule), `Manhattanite_Brand-Guide_v2_Draft.md` (replaces COMPANY/brand-guide.md on approval — records wordmark/palette/type/action-system decisions with real tokens), and `Manhattanite_Design-ReGrade_v1.md` (before/after: B−/C+ screens → B+/A− across the board; desk-based, fresh screenshot pass optional).
- Prod verified 2026-08-01: "Manhattanite." wordmark, OG card (1200×630) + full metadata live on manhattanite.com. Favicon-in-tab still wants George's 5-second look.
- Project state: **done pending sign-off** on the two paper docs + the optional re-shoot. Backlog items (not project scope): ≥2400px hero asset, serif numeral review, srcset slice, dark /apply form eyeball, hello@ vs info@ decision.

## 2026-08-17 — Project handed to a human designer; shortlist delivered

- **George's call: branding and look get perfected before any outreach at scale.** This is the operational consequence of the 2026-08-13 "too AI" verdict. The open decisions in this project (serif, accent, further polish) stay **frozen** — do not spend more cycles on a direction a professional may redirect.
- **Delivered: `outputs/Manhattanite_Designer-Shortlist_v1.md`.** Five verified candidates (Practical People, RoAndCo, Rudy, Order, Gretel), budget calibration by tier, where to find the independent tier, five first-call questions, and next-step dates.
- **The scope decision that matters:** buy **identity + art direction + three key screens as Figma files, and a short handover spec. Do NOT buy implementation.** The build is the expensive half of a studio website quote, and this repo already implements its own screens. Expected landing zone: a strong independent at **$6–15k**; a small studio at $20–45k. Ask for the typeface *licence* cost as a separate line item.
- **The three key screens to commission:** landing, listing card / browse grid, listing detail. The rest follow the system.
- **Blocking dependency, flagged not solved:** a designer's first question is "who is this for?", and the audience question (strategy session §2) is open until the friend interviews land. **Approaching studios doesn't need the answer; briefing them does.** Sequence: enquiries now → audience decided post-Newport → one-page brief → engage.
- **The brief package is ready and is this project's main asset:** brand-guide v2 draft, design audit + re-grade, steal sheet, photography rules, mockups v5–v12, before-screenshots + the July mobile set. Send only three things in a first email though (live site, steal sheet, one-page brief) — handing a stranger twelve mockup rounds reads badly.
- **Still to write:** the one-page designer brief. Blocked on the audience answer.

## 2026-08-17 (later) — Independent-designer search done

- **Delivered: `outputs/Manhattanite_Independent-Designers_v1.md`.** Nine verified individuals/duos, the credit-mining method, dead ends, and engagement terms. All names verified by fetching their own site or a credited project page; unverified items flagged in place.
- **Geography reality check:** almost no independent brand designers keep East Village studios — that population moved to Brooklyn years ago. Practical People is the only EV design outfit found, and it's a studio. **Right filter is whose *work* is downtown, not whose desk is.**
- **Top five to contact:** **James Anderson** (independent NYC, Apollo Bagels / Café Triste / Psychic Wines / Kalei at 159 Bowery — best fit on price, register and neighbourhood; his site blocked automated fetch, verify manually), **Triboro** (Heasty + Weigler, Williamsburg duo, Tigre on the LES, Jupiter, Sauvage, Narcissa — does digital too, may price above $15k), **Javas Lehn Studio** (20 W 20th; **the only members-club credit found anywhere — The Twenty Two, Mayfair hotel + private members' club**; upper-end), **Elana Schlenker** (Greenpoint, independent, A24/Aperture/Phaidon — likely most affordable, no hospitality work), **Anna Polonsky / Polonsky & Friends** (Brooklyn, hospitality-only practice, Santo Taco + Bar Miller; site blocks fetching, verify manually).
- **Deliberate exclusion logged: Louise Fili.** Branded Via Carota, Pisellino, Claudette, Mermaid Inn — the obvious downtown hospitality name — but her register is ornate vintage-European lettering and Manhattanite is restrained modernist. Wrong on style, right on sector. Don't call her.
- **Also excluded:** Jingqi Fan (excellent MáLà Project work but she's a senior designer at COLLINS alongside her practice), Crown Creative (Irish-pub specialists, multi-city).
- **THE BIG PROCESS DECISION TO ADOPT: open with paid discovery, not the full project.** 5–10% of project value or a flat $500–$2,500, credited against the full engagement if you proceed within 2–6 weeks. Lets George trial two candidates cheaply and see who *understood* Manhattanite vs who just liked the brief. **Never ask for free concepts or a pitch round** — AIGA's position paper discourages spec work and asking for it filters out exactly the designers worth having.
- **Terms:** 50% deposit under $5k with a new client (25–33% above), 30/40/30 milestones, Net 15, kill fee written down, **8–12 weeks for identity + three key screens**. Assumes 48–72hr feedback turnaround from George — flag Newport and the pending audience decision up front. AIGA Standard Form of Agreement is free and a fair neutral starting contract.
- **Sourcing method that works (keep this):** don't search for designers, find identities you like and read the credit. Fonts In Use (Food/Beverage topic filter, credits *individuals*), The Brand Identity (curated + **free-to-post jobs board with a freelance filter and live NYC listings**), Brand New, SiteInspire (for screens), Are.na (profiles public, personal site link is the bridge to an email), Instagram Places tab on venues whose branding you admire.
- **Dead ends confirmed dead — do not use, and distrust any advice recommending them:** Working Not Working (Fiverr-acquired, shut 30 Jun 2025), Read.cv (wound down Jan 2025, team to Perplexity), Polywork (shut end-2024). Plus the usual: Upwork/Fiverr/Toptal/Twine are alive and wrong register.
- **Two free moves:** post the brief on The Brand Identity's board; **CreativeMornings NYC, Fri 28 Aug, 8:30am at the Museum of Arts and Design** (free, monthly, full of these people — and of potential members).

## 2026-08-17 (later still) — Classifieds design import, screens 03/04/06/11/12 built

- **Imported the rest of `Manhattanite Classifieds.dc.html`** from the Claude Design project into `app/design/`, on top of the earlier screens 01 (Components) and 02 (Browse). Now built against the real listings table: **03 Listing detail, 04 Search, 06 Saved, 11 Loading/members-only/404, 12 Mobile.** Production build green; verified in the browser logged-out at desktop and 375px.
- **`/design` now has a contents page** — the route previously 404'd under its own layout. It lists what was built and, in a second panel, **the five screens that were not, each with its reason**. That panel is the deliverable as much as the screens are.
- **Five screens deliberately NOT built, and these are product blocks, not time:** 05 Post (the wizard writes real listings to prod — the live `/listings/new` already works); 07 Messages (out of v1; the design file marks it "not built yet" itself); 08 Member profile (`accounts` is read-own under RLS — a public profile is a data-exposure decision needing a new policy or denormalized columns); 09 Sign in (a non-submitting sign-in form invites a real password); 10 Settings (most rows have no column behind them).
- **The rule that drove every call: no dead controls.** Inherited from the Slice-1 note in `filters.ts` ("the third is left out rather than faked"). A faked control in a preview is how a design gets approved for something the product cannot do.
- **One funnel change to watch on screen:** a guest opening a listing outside the 6-row teaser gets the design's **members-only wall** (`ClGate`) instead of the live page's `redirect("/signup")`. Same refusal, same rows withheld — but the reason and both doors are on screen. The redirect probably converts harder; the wall explains better. **George's call.**
- **Saving is localStorage, not a table** (`saved-store.ts`). A real saved list needs `saved_listings` + an RLS policy making it private to its owner. The Saved screen filters client-side over the already-gated read, so a saved id can never surface a listing the viewer wasn't allowed to see.
- **The teaser gate is now written once** (`app/design/listings-read.ts`) and shared by Browse, Search and Saved — three screens that each need "the listings this viewer may see". Three copies would have been three chances to get the trust gate wrong.
- **Standing tension, flagged not resolved:** this project is frozen pending the human designer, and this preview is a direction a professional may redirect. It stays safe on that footing — noindex, scoped to `.cl-root`, zero live-surface changes, and reverted by deleting `app/design/` plus two lines in `NavGate.tsx`. **Do not promote any of it to the live system before the designer engagement lands.**

## 2026-08-17 (later still, cont.) — Landing v3 imported to /design/landing

- **Built `Manhattanite Landing v3.dc.html`** at `/design/landing`: one-screen hero (wordmark, "A private marketplace for New York.", Request access + Sign in), the listings grid, hairline footer. Build green, verified logged-out at 1280px and 375px.
- **NOT put on the live `/`, deliberately.** The live landing is the approved **dark-outside/light-inside** split (decided 2026-07-17) — park-green photographic hero, plus a redirect sending signed-in visitors to `/listings`. Landing v3 is light, typographic and has no photograph at all. Swapping it would replace the primary marketing surface *and* reverse the palette decision, which is George's call to make on purpose. **Promoting it later is a route move; the page itself is finished.**
- **The six cards are the real teaser.** The design draws six invented listings and six is exactly what a logged-out visitor may see (the D1 cap). So it renders the actual six, and every card opens a detail page that same stranger can actually reach — the landing leads somewhere without signing in.
- **THE FINDING WORTH ACTING ON: the landing names nobody, browse names everybody.** Landing v3's card reads "Vouched by a member since 2023" — the trust signal without the person. `/design/browse` shows the *same logged-out visitor* the *same six listings* with "Listed by Lila · sponsored by George Gardner" on them. **One of the two is wrong about how public a member's name is**, and the landing is the page that gets indexed and shared. Flagged, not settled — it is a product/privacy decision, not a styling one.
- The "since 2023" year is dropped: a join date lives on `accounts`, read-own under RLS, so it isn't available to a logged-out reader. Line keeps the shape, loses the number rather than inventing one. Same constraint as the missing avatar on screen 03.
- Small things worth keeping: the hero is `calc(100dvh - var(--cl-strip-h))` so the preview strip can't detune the one screen that must fill exactly one screen (set the var to 0 when promoting); the copyright year is read at request time, not hardcoded to 2026 as the design file has it; the mobile tab bar is suppressed on the landing, since Saved/Post/Profile are three locked doors to a stranger.

## 2026-08-17 (later still, cont. 2) — Landing v3: sign-in leads, request access moved to the foot

- **George's direction, applied to `/design/landing`:** sign-in is now the hero's single primary action and **opens a real form in place** (no navigation, no modal); **"Request access" moved to a closing band above the footer** ("Not a member yet? / A member has to vouch for you.").
- **The form is WIRED, not drawn** — same `supabase.auth.signInWithPassword`, same Cloudflare Turnstile gate, same error rewriting as the live `/login`. A sign-in form is the one screen that cannot be mocked: people type real passwords into anything shaped like one.
- **Forgot-password is earned, not displayed.** It appears only after credentials are actually rejected — and deliberately **NOT** on a captcha failure, since "couldn't verify you're human" says nothing about the password and a reset link there sends people to change a password that was fine.
- **THE FUNNEL TRADE, flagged and accepted:** most landing traffic has never been here, and above the fold they now meet only a members' door. The listings still argue the case and the way in waits at the end of them. That is the intended reading of "members only"; it is not the higher-converting arrangement. Worth watching if the landing is ever promoted.
- **VERIFICATION GAP WORTH KNOWING ABOUT — the localhost Turnstile key.** `.env.local` holds Cloudflare's always-passes **TEST** site key, so every local sign-in dies at the captcha *before* a password is checked. The credentials branch — and therefore the forgot-password reveal — **cannot be exercised from localhost**, only where the real site key is set. (Same root cause as the Slice-3 prompt's "Stage 0 = the localhost Turnstile key fix", still open.)
  - **Mitigation shipped:** the classifier is extracted to `app/design/auth-error.ts` as a pure function with `scripts/test-auth-error.ts` asserting all four cases (`npm run test:auth-error`, 4/4 passing). The branch that can't be clicked is at least tested. **The visual reveal still wants one eyeball on a deploy preview.**
- Interaction details: `grid-template-rows: 0fr → 1fr` so the panel animates to its real height (it changes height when the error line and reset link appear); collapsed content is `inert` so it's out of the tab order; Escape closes; the password is cleared from state on close.

- **Closing band shrunk (same session, after review):** the "Not a member yet?" section went from a heading + subline + large pill (~230px tall) to one line with a standard pill beside it (~91px), wrapping to two rows on a phone. At full size it read as a second hero and made the listings look like filling between two pitches; it now sits closer to the footer's register, and the size gap is what keeps the two asks in the right order.

## 2026-08-17 (later still, cont. 3) — Wordmark entrance on the Classifieds landing

- **The gesture: the period lands last.** Mark rises 12px and settles (700ms), subline follows at 130ms, sign-in at 260ms — then the period fades in on its own at 520ms. The name assembles, then punctuates itself. Chosen because the period is the *locked* part of the mark (Concept D), so it is the part worth landing separately; everything else is a plain staggered fade-up.
- **Register was the whole constraint.** Soho House and Le Labo don't animate their logos, they let them arrive. Anything with more personality — letters typing on, a shimmer, a draw-on stroke — reads as an effect, and **an effect is precisely what a brand already carrying the 2026-08-13 "too AI" verdict cannot wear.** If in doubt later, delete it; it is 40 lines of CSS.
- **`Wordmark.tsx` gained `periodClassName` — an additive change to a LIVE shared component.** The period was a bare text node and unaddressable. It is now wrapped in a span unconditionally (a classless span is inert in rendering and semantics, so every existing caller renders identically — verified on the live `/`: mark reads "Manhattanite.", zero animations). One code path beats a saved element.
- **CSS only, no JS, and deliberately no font gate.** The classic failure is fading in wearing the fallback serif then snapping to the real face; the usual fix is holding until `document.fonts.ready`. Not needed — next/font self-hosts and preloads, so the mark is drawn in Instrument Serif on first paint. A JS gate would also mean the hero starts invisible and depends on JS to ever appear, which is a bad trade on a marketing page.
- **700ms, not the 900 it wants:** the wordmark is the hero's largest text and therefore the LCP element, and an element fading from zero isn't "painted" until legible. Past ~0.75s the animation shows up in the metric rather than in the room.
- `prefers-reduced-motion` drops to `animation: none`, which also clears the fill, so everything sits at natural opacity — no state left holding anything at zero.

## 2026-08-17 (later still, cont. 4) — The remaining screens: 05, 08, 09, 10 built

- **Four of the five "not built" screens are now built.** Only **07 Messages** remains, and it stays unbuilt because the feature doesn't exist and is out of v1 — building it means inventing a threads table, a read model and a notification story to illustrate a picture.
- **09 Request access + sign in** (`/design/access`) — both cards wired. The left card is **state-aware, which the mockup isn't**: guest → the two-step explanation and signup (you cannot apply without an account; the design's cold form has nowhere to post); Tier 1 → the real application form; already applied → what happens next; member → nothing to ask for. Dropped the design's "Email me a link" — magic-link was overridden in Phase 1 Slice 2, there is no passwordless path to point it at.
- **05 Post a listing** (`/design/post`) — **three visual steps, ONE real form.** Fields are hidden with CSS, never unmounted: an unmounted input posts nothing, so conditionally rendering step 1 would silently drop the title and price on the way to step 3. Writes a genuine row as `pending`; the 0017 trigger pins that server-side, so nothing posted from the preview can reach the network without passing `/admin/moderation`. Built `ClImageUpload` over the real `uploadListingImage` rather than reusing the live one, which is dressed in the editorial system. Cap is the real 6 photos, not the design's 8.
- **08 Member profile** (`/design/members/[id]`) — **built entirely from `listings`, which is the interesting part.** `accounts` is read-own, so the obvious implementation isn't available and shouldn't be made available casually. The page shows only what every card already says out loud (`author_name`, `sponsor_names`) gathered in one place — **no new disclosure**. Verified on real data (Lila, 2 listings, vouched by George).
  - Omitted with reasons: avatar/"member since"/bio (need an accounts read), "members vouched" (sponsorships is RLS-locked; `get_my_connections` is keyed on `auth.uid()` and answers only for yourself — and it's the most socially loaded number on the screen), "usually replies" (nothing measures reply time).
  - **`supabase/migrations/0026_member_profile.sql` is WRITTEN, NOT APPLIED, and nothing calls it.** It's a `SECURITY DEFINER` function exposing a fixed public slice for members only, to `authenticated` (not `anon`). Chosen over a SELECT policy deliberately: a policy makes every *future* column on accounts public by default; a function exposes a list someone had to type out. Applying it is inert until the follow-up wiring lands. **George's call, and George runs it.**
- **10 Account settings** (`/design/settings`) — only rows with a column behind them (name, email read-only, neighborhood, bio, LinkedIn, password reset, your vouching web via `get_my_connections`, sign out, and an honest "no self-serve delete yet"). **Two of the design's controls deliberately cut:** the weekly digest (no notifications system, no column, no sender) and "show my name on listings" (the byline is denormalized onto every listing at write time and named sponsorship IS the trust mechanic — turning it off would rewrite history *and* contradict the product's central claim; that's a strategy change, not a toggle). A settings screen is the worst place to draw a control that does nothing.
- **VERIFICATION GAP, same root cause as before:** 05 and 10 both require a member session, and local sign-in is captcha-blocked by the TEST Turnstile key. Their **gates** are verified (both redirect to `/design/access` logged out) but **the post form and the settings rows have never been rendered**. They want a look on a deploy preview.

## 2026-08-18 — Branch pushed, preview deployed; verification is George's to finish

- **Branch `design/classifieds-preview` is pushed** (GitHub `georgegardner97/manhattanite`). Vercel preview built green: **https://manhattanite-g983p3g53-georgegardner97s-projects.vercel.app**
- **BUG FOUND AND FIXED while waiting on the build** — the post form's three-step layout keeps every field mounted and hides inactive steps, so a `required` input could be invalid *off screen*. The browser then refuses to submit AND refuses to focus a hidden control to explain why: pressing Submit from step 3 with an empty title did **nothing at all**, no message, no movement. `onInvalid` now maps the field back to its step, switches to it, and re-reports validity on the next frame. Worth remembering as a general trap in any hide-don't-unmount wizard.
- **THE VERIFICATION GAP CANNOT BE CLOSED BY CLAUDE, for two independent reasons** — recording both so this isn't retried:
  1. **Vercel deployment protection.** Preview URLs 302 to `vercel.com/sso-api`; they need a logged-in Vercel session.
  2. **Even past that, `/design/post` and `/design/settings` need a MEMBER session**, and signing in needs a member's password — which Claude does not have and must not handle.
- **Local workarounds tried and rejected, don't repeat them:** `admin.generateLink` works (`http://localhost:3000/auth/callback` *is* allow-listed in Supabase — the bare path only; adding a `?next=` query makes Supabase fall back to the Site URL). But the verify endpoint returns an **implicit-flow `#fragment`**, and `/auth/callback` reads `?code=`, so fragments never reach the server. Hand-forging the `@supabase/ssr` cookie was started and **deliberately abandoned** — version-fragile, and a subtly-wrong session renders something *misleading*, which is worse than an honest gap.
- **What George needs to eyeball on the preview, signed in as himself:** `/design/post` (the three steps and the photo picker), `/design/settings` (the rows and the vouching lists), and the **forgot-password reveal** on `/design/landing` — sign in with a deliberately wrong password; the link should appear only then, and NOT on a captcha failure.

## 2026-08-18 (cont.) — Navigation rewired to stay inside the preview

- **The header's primary action was dropping people into the other design system.** "Post a listing" pointed at the live `/listings/new` and Profile at `/profile`, because neither screen existed when the header was written. Both exist now (05 and 10), so the header, the mobile tab bar and every gate now point in-system. Profile → `/design/settings`, which is how the design file itself reads it (screen 10 is drawn with `active="profile"`).
- **The policy, for future screens:** navigation and gates stay inside; *leaf flows with no designed counterpart* stay outside. Still deliberately pointing at the live editorial system: `/signup` (the design has no signup screen), `/reset-request`, `/profile/edit`, `/listings/[id]/edit`, `/privacy`, `/terms`.
- **Crawled all 27 distinct internal links across every preview route — all resolve.** The only non-200s are `/design/post` and `/design/settings` returning 307 to `/design/access`, which is the member gate working.
- **George's strategic read, recorded because it should outlive this session:** the Classifieds system is **better for the product screens and weaker for the marketing surface** — more legible and denser, but more conventional (rounded pills, sans-serif, card grid) where the live editorial system is far more distinctive and closer to the Soho House register. That maps onto the existing **dark outside / light inside** decision: Classifieds is a strong candidate for *inside*, a weak one for *outside*. **Its highest value is as input to the designer's brief — the product shown on real data — not as the thing to ship.**

## 2026-08-18 — Direction reversed: the Classifieds system becomes the site

- **George: "This is the design direction now."** The `/design` preview stops being a proving ground. This reverses the strategic read logged that morning (Classifieds as input to the designer's brief) and, in practice, supersedes the 13 Aug freeze — he was told the preview is itself Claude-generated and chose it anyway. The designer shortlist and independent-designer research stay on file; engaging a studio is now an open question, not the plan.
- **Correction he needed, and the reason this session produced a plan rather than a merge:** committing and pushing the preview branch would not have changed the site. Diffed against `main`, the branch touches five files outside `app/design/` — `NavGate.tsx` (two lines), `Wordmark.tsx` (an optional prop, existing callers identical), `package.json`, a test script, and unapplied migration 0026. Zero live pages. Merging puts the preview on the real domain at `/design` and nothing else.
- **The design file is exhausted.** All twelve Classifieds screens plus Landing v3 are accounted for: eleven built, 07 Messages deliberately not (no messaging in v1). "More screens" now means designing, not porting — roughly fourteen live routes have no Classifieds treatment at all.
- **Delivered: `outputs/Manhattanite_Classifieds-Migration_Claude-Code-Prompt_v1.md`.** Three slices. Slice 1 (specified in full) is the plumbing plus the logged-out experience: Next route groups so the two systems coexist by layout rather than URL prefix, `classifieds.css` and the Newsreader/Instrument Sans pair promoted out of the preview layout, components moved to `app/components/cl/`, landing + browse + detail + member profile repointed, every `/design/*` link rewritten. Slices 2 and 3 (member screens, then admin and edges) get their own prompts.
- **Slice 0 in that prompt is not optional:** the `.env.local` Turnstile test key still blocks local sign-in, which is why `/design/post`, `/design/settings` and the forgot-password reveal have never been rendered by anyone. Migrating member screens nobody can see is how a broken screen reaches production.
- **Four decisions block Slice 1** (all in the prompt with recommendations): landing byline anonymity vs browse naming everyone — the landing becomes `/` and gets indexed, so this has to settle; Instrument Serif wordmark against Newsreader body; whether Saved and Search ship, which is an `mvp-spec.md` change; migration 0026, recommended to stay unapplied.

## 2026-08-18 — Slice 1 shipped: the Classifieds system is the public face

- **Branch `design/classifieds-live`, pushed, one commit (85 files).** `main` also pushed — it had been two commits behind on this laptop with production running 22 July code. Rollback is a revert of the merge, not a deleted directory.
- **Route groups did the job cleanly.** `app/(cl)` and `app/(ed)` split the two design systems by *layout*, and every URL stayed exactly where it was. `/listings` (Classifieds) and `/listings/mine`, `/listings/new`, `/listings/[id]/edit`, `/listings/[id]/contact` (still editorial) coexist across the two groups with no redirect — Next resolves them because they are different paths, and the docs' only prohibition is two groups resolving to the *same* URL.
- **The font trap the plan missed, worth remembering.** The root `<body>` was supplying the next/font CSS variables that `globals.css` *and* the shared `Wordmark` both read. Stripping fonts out of the root layout naively collapses Inter to system-ui on every editorial page and kills the wordmark in both systems. Fix: `app/fonts.ts` as one source, `.ed-root` as the editorial scope mirroring `.cl-root`, and Instrument Serif imported by *both* group layouts because the mark lives in both.
- **A stale Turbopack cache faked a bug for twenty minutes.** After editing `globals.css`, the dev server kept serving the *old* compiled stylesheet, so computed styles showed the pre-migration rules and the fonts looked broken. `rm -rf .next/dev .next/cache` and restart. Check the served CSS, not just the source, before believing a CSS bug.
- **THE FINDING THAT MATTERS: `/members/[id]` was walking around the teaser cap.** It ran its own `.eq("author_id", …).limit(24)` query. The six-row guest cap is enforced in *application code*, not RLS — migration 0010 permits anonymous reads of published rows — so a logged-out visitor saw up to 24 of a member's listings, including ones whose own detail page answers with the members-only wall. Fine as a noindex preview; a public, crawlable route around the trust gate once promoted. Now goes through `readMemberListings()` in `lib/cl/listings-read.ts`, which narrows the permitted set rather than querying around it. **The RLS audit passed 59/59 before and after — this class of bug is invisible to it.**
- **Decisions applied:** landing stays anonymous (George explicitly *undecided*, held not settled — one function to reverse); wordmark stays Instrument Serif; Search + Saved ship and `mvp-spec.md` was updated; migration 0026 to be applied by George (his call, against the recommendation).
- **Slice 0 is still open and it is a Cloudflare dashboard task.** The real Turnstile site key is now in `.env.local`, but Cloudflare returns **error 110200 — domain not allowed** and renders no challenge at all. `localhost` must be added to that widget's allowed hostnames. Until then the signed-in Tier 1 and member screens remain unrendered by anyone, and Slice 2 should not start.
- **Evidence:** `outputs/classifieds-migration-screens/` — seven screens × desktop and 390px.

## 2026-08-26 — Slice 2: the member-only screens, migrated and actually looked at

**The blocker cleared first.** Cloudflare Turnstile now allows `localhost` — the widget renders, challenges and verifies. Slice 1 died at error 110200 with no challenge at all, which is why its signed-in states shipped unverified. This slice's did not.

**What moved.** `/login`, `/signup`, `/apply` (screen 09 → `ClAccess`, one state-aware component across four cases); `/listings/new` (screen 05); `/profile` (screen 10). `/profile/edit` collapsed into `/profile` and left behind as a redirect.

**What was designed rather than ported**, because no screen existed: `/listings/mine`, `/listings/[id]/edit`, `/listings/[id]/contact`.

**Judgement calls worth keeping.**
- **The profile photo stays.** Screen 10 doesn't draw one. Shipping it as drawn would have deleted `AvatarUpload` and reversed the 2026-06-08 identity decision by omission. A mockup that predates a decision does not get to overturn it.
- **`/signup` needed a real form.** The design's guest card links to `/signup`; rendering the same screen there would have pointed that link at itself.
- **Edit drops the three-step pills.** The steps stop a blank form feeling like a wall; an edit form is not blank. Presentation flag only — the form already mounts every field.
- **My listings keeps the July audit's structure.** Cards for active, compact rows for archived. `ClListingRow` was not reused (built for search, leads with a thumbnail, links unconditionally); `ClArchivedRow` is a sibling with neither.
- **Contact is one body in two frames** (page + modal), so they cannot disagree. The Tier-1 gate copy is verbatim from `voice-and-copy.md` again — the modal had been paraphrasing it.

**Two real bugs caught in passing.** The post form allowed 140-char titles and 4000-char descriptions against server caps of 80 and 2000. And — worse — `updateListing` rebuilds `details` wholesale, while the form rendered only two of the six detail fields the action reads: editing a furniture listing would have silently deleted its condition, dimensions and brand. Both fixed.

**New in the toolkit: `npm run audit:gates`.** 21 route gates asserted over HTTP as guest / Tier 1 / member, self-fixturing and self-cleaning. It exists because the RLS audit passed 59/59 on both sides of Slice 1's trust hole — that class of bug lives above the database. Note for next time: Next 16 encodes `redirect()`/`notFound()` in the RSC payload with a 200 document when streaming has begun, so asserting on HTTP status alone produces confident false failures.

**Verified:** build clean; `audit:rls` 59/59 with prod state identical before and after; `audit:gates` 21/21; every screen rendered signed in as a member with listings in all four statuses; all four Tier-1 walls; the guest walk in-system; 390px and desktop; 34 screenshots (08–24).

**Caught only by looking:** duplicate primary CTA, a Save pill on your own listing, and a redundant "Archived" label on every archived row. None visible in a diff.

**Next:** Slice 3 — `/admin` ×4, `/invite`, `/join/[token]`, `/sponsor-request/[token]`, `/reset-request`, `/reset-password`, `/thank-you`, `/terms`, `/privacy`. Then `app/design/` and the `(ed)` group retire together. Slices 1 and 2 merge to `main` together, not separately.

### Slice 3 scope, as verified against the repo on 2026-08-26

Twelve routes remain in the `(ed)` group. Not a guess — enumerated from `app/(ed)/**/page.tsx` after Slice 2 landed:

| Route | Who reaches it | Notes |
|---|---|---|
| `/reset-request` | **Any member, and anyone who fails sign-in** | **Highest priority.** The only editorial screen reachable from *inside* the Classifieds system by a normal user — from `ClSignIn`'s earned "Forgot your password?" and from the Password → Reset row on `/profile`. |
| `/reset-password` | Anyone following a reset email | Second half of the same flow; migrate with it. |
| `/terms`, `/privacy` | Anyone | Linked from the landing footer (`app/(cl)/page.tsx`). Static content, lowest risk. |
| `/thank-you` | Post-application | Check whether anything still routes here now `/apply` answers its own states on the page. |
| `/invite` | Members (future) | Exists but has no in-product entry point. Migrating it unblocks restoring the **"I have an invite →"** CTA that `voice-and-copy.md` pairs with the contact gate — deliberately omitted in Slice 2 rather than pointed at an editorial screen. |
| `/join/[token]` | Invitees | Pairs with `/invite`. |
| `/sponsor-request/[token]` | Sponsors | Token flow, no in-product entry point yet. |
| `/admin`, `/admin/applications`, `/admin/members`, `/admin/moderation` | **Founder only** | Reached through `AccountMenu` → `SiteNav`, which are editorial components not mounted anywhere in `(cl)`. So the admin console is currently unreachable from the Classifieds system at all — worth deciding deliberately: does the founder get a Classifieds route in, or does `/admin` stay a separate editorial tool? |

**Retiring together, once those land:** `app/design/` (now just `/design`, `/design/kit` and its layout — the preview index and component kit; screens 05, 09 and 10 were consumed by Slice 2) and the whole `(ed)` route group, plus the editorial components only it uses (`PageShell`, `AuthShell`, `BoxButton`, `ArrowLink`, `MetaRows`, `SiteNav`, `AccountMenu`, `ListingCard`, `NewListingForm`, `ProfileEditForm`, `ContactForm`, `ImageUpload`, `AvatarUpload`, `SiteFooter` — audit before deleting; some are still shared).

**One open question Slice 2 surfaced and did not answer:** a member can currently open `/listings/[id]/contact` on **their own** listing and send themselves a message. Harmless, but it is a control that does nothing — worth a cheap guard whenever contact is next touched.

## 2026-08-26 — Slice 3a: the byline decision settled, and eight more screens in the system

**The decision, first, because it is the half that is hard to walk back.** George: a logged-out visitor sees no member name and no sponsor name, anywhere. This settles the tension the landing had carried in a comment since 18 August — it anonymised while browse, search, saved, listing detail and the member profile named the same guest one click away, on pages Google indexes. **Browse changed to match the landing.** Signed in, nothing changed at all.

- **One function, one deletion.** The landing's `anonymousMeta()` is gone and is now the guest branch of `cardMeta()` in `lib/cl/listings-read.ts`. `toClCards()` takes a **required** viewer instead of an optional meta override, so a new screen cannot get named bylines by saying nothing — it will not compile until it states who is looking.
- **`/members/[id]` is the members-only wall for a guest.** The page is a named member from top to bottom; anonymised it says nothing. Side effect worth having: member pages stop being indexable.
- **Not an RLS change, deliberately.** The names are denormalised onto every listing (0006) and published rows are anonymously readable (0010). Application rule, same as the teaser cap — which is why `audit:rls` passes 59/59 either way and the new assertions in `audit:gates` are the actual guarantee. 30 assertions now; the first run caught a false positive worth knowing about (a member named **Max**, and the price filter's "Max" placeholder), so the check reads visible text for every name and the full payload for full names only.

**Eight routes migrated:** `/reset-request` + `/reset-password` (first, because reset was the only editorial screen a normal person could still reach from inside the Classifieds system), `/thank-you`, `/terms`, `/privacy`, `/invite`, `/join/[token]`, `/sponsor-request/[token]`.

**Two new pieces of the kit, and one of them is a real gap closed.**
- **`ClAuthCard`** — screen 09's grammar with the second panel removed. One card, one field, one action. Used by both resets, `/thank-you`, `/join` and `/sponsor-request`.
- **`.cl-doc` + `ClDocument`** — the long-form treatment the design file never had. Nothing in the twelve screens sets a measure, a heading scale for a document, or a draft-notice box. Decisions recorded in the CSS: 66-character measure; body goes UP to 15px (13.5px is right for a label and a wall for a legal page); one heading level only; **no serif** — Newsreader stays the wordmark, and a legal page is exactly where a house serif sneaks back in as "editorial". The standards page `trust-and-moderation.md` wants will use this.

**Content work done while inside those pages.** The privacy policy's analytics claim came out — the site runs none, and a policy that overclaims is worse than a thin one, particularly one about to be read by a lawyer. The working-draft notices stay until counsel has actually reviewed both pages. The stale bullet in `legal-and-policy.md` is corrected: **listings are public, member names are not**.

**Flagged, not fixed: "I have an invite →".** Migrating `/invite` was supposed to unblock the CTA. It does not — `/invite` is where a member *sends* an invitation, so a Tier-1 account pressing it at the contact gate lands on their own profile. The gate now says "Open the link in that email" instead. Turning it back into a link means designing a tokenless "I have an invitation" screen. George's call.

**Evidence:** screenshots 25–40 in `outputs/classifieds-migration-screens/` (desktop + 390px), including the guest-anonymity walk and the signed-in control beside it.

**Next:** Slice 3b — `/admin` ×4 — then `app/design/` and the `(ed)` group retire together. **Slices 1, 2 and 3a merge to `main` together.**

## 2026-08-27 — Merged to `main`. The Classifieds system is manhattanite.com.

Slices 1, 2 and 3a went to `main` as one `--no-ff` merge commit (`4759502`) — 202 files, +12,158 / −3,354, five weeks of change in a single deploy, and **the first code deploy since 22 July**. Vercel green in 43s. Nobody crosses a seam between two design systems, which was the whole reason the three slices waited for each other.

**Deploy:** `manhattanite-gzljlxoxj-georgegardner97s-projects.vercel.app` → manhattanite.com.
**Rollback, if it is ever wanted:** `git revert -m 1 4759502`. That is what `--no-ff` was for.

- **One regression fixed before the merge, as its own commit.** `/admin` was reachable from a single link — `AccountMenu`, inside `SiteNav`, mounted only in `app/(ed)/layout.tsx`. After the merge the only `(ed)` routes left ARE the admin pages, so that link would have rendered only on pages you cannot reach without already being there. `AppHeader` now takes an optional `admin` prop and renders a quiet, unpilled Admin link beside the action pill.
- **A prop rather than a lookup, and that is the design decision worth keeping.** An async `AppHeader` reading the viewer's role would have flipped **eight prerendered-static routes to dynamic** — `/terms`, `/privacy`, `/thank-you`, `/reset-request`, `/reset-password`, `/profile/edit`, `/design`, `/design/kit` — and charged every visitor an auth round trip for a link one account sees. `/profile` passes the flag instead: already `force-dynamic`, already reading the account row, one added column, and a permanent item in this header's own nav. **The route table is byte-identical before and after.** Slice 3b widens the door properly.
- **`audit:gates` had never met a production build, and it showed.** Two gates that pass locally failed against manhattanite.com — a member editing someone else's unpublished listing, and a nonexistent id. Neither is a hole: production refuses both with no form, no content, and a 24,225-byte shell identical to the nonexistent case (34,324 for a listing that member owns). The detector wanted the literal `not-found`, which is a dev-bundle module path a production build hashes away; the payload there spells the slot `notFound`. Both builds emit `NEXT_HTTP_ERROR_FALLBACK;404`, so that is the marker now. **The file's own header warns about exactly this** — a trust check that cries wolf trains you to ignore it.
- **Verified against production, not localhost.** `audit:gates` 30/30 with `APP_ORIGIN=https://manhattanite.com` — the guest name-leak assertions' first real run, on the pages Google indexes. `audit:rls` 59/59, prod state untouched (4 seed members, 20 published listings, founder row identical). Guest: six listing ids on `/listings`, "Listed by a member" in the HTML *and* the RSC payload, the seventh listing and `/members/<id>` both the wall with no title, description or price behind them. `/terms` and `/privacy` in `.cl-doc`, analytics claim gone. Favicon and OG card intact. Founder, signed in on prod: `/listings/new`, `/profile`, `/listings/mine`, and all four `/admin` screens through the new entry point.

**Left:** Slice 3b — `/admin` ×4. Then `app/design/` and the `(ed)` group retire together, along with `globals.css`, `SiteNav`, `NavGate`, `AuthShell`, `PageShell`, `BoxButton`, `ArrowLink` and the editorial `ListingCard`. `design/classifieds-live` stays until 3b has shipped and settled.

## 2026-08-27 — George's walkthrough batch: five notes, one branch

Branch `classifieds-walkthrough-fixes` off `main`, intended as one `--no-ff` merge so the batch reverts as a unit. Reasoning for every call is in `outputs/Classifieds_Website-Notes_v1.md`; the executable handoff was `outputs/Classifieds_Claude-Code-Prompt_v1.md`.

**Task 0 (blank price) was inherited from Cowork, uncommitted, and reviewed rather than redone.** 13 files, no corrections needed. `formatPrice` returns `string | null`; every reader branches on `=== null`. **The migration `0027` is still NOT applied**, so the end-to-end walk is outstanding and is George's. What WAS proved without the database: `formatPrice(null)` → nothing, `formatPrice(0)` → `$0`, and `byPrice` sorting `[0, 200, 500, null]` in that order. That is the whole free-vs-blank rule, held.

**One predicate for the neighborhood filter, not five copies.** `hoodApplies(q)` in `lib/cl/filters.ts`, read by `buildHref`, `resultLabel`, `isFiltered`, `activeChips`, the browse row filter and `FilterRail`. **`buildHref` reading it is the load-bearing part** — that is what makes switching to Furniture rewrite the link as `/listings?type=furniture` with the `hood=Yorkville` gone, instead of leaving a filter running that no control on screen admits to. Verified by reading the rendered hrefs, not by looking at the rail.

**`placeOf()` split, and the split is the lesson.** It was the card's display string AND the value the neighborhood filter and the search haystack compared against. `neighborhoodOf()` is now the data, `placeOf()` the display, and non-apartments display their category. Proof the split held: `/listings?q=tribeca` returns the swivel chair whose kicker reads "FURNITURE". **Rule: when one function is both what a person reads and what the machine matches on, separate it before changing either.**

**A regression the prompt did not see.** `/listings/[id]` rendered `{type === "apartment" ? "Listing" : "Selling"} in {placeOf(listing)}` — which the kicker change turns into "Selling in Furniture". Repointed at `neighborhoodOf` and the clause now drops when there is no neighborhood; it had been rendering "Selling in Other" before this batch, so a pre-existing wart went with it.

**Search retired into Browse.** `/search` is now a `permanentRedirect` (308) forwarding its query string verbatim rather than re-deriving it — a second implementation of `parseQuery` would be free to drift from the first. `activeChips` moved to `filters.ts` (it is query logic, not markup). `search/loading.tsx` deleted; `SEARCH_PATH` collapsed into `BROWSE_PATH`. `ClListingRow` is left in the tree, unused, because `ClArchivedRow`'s comment references it — it retires with the `(ed)` group in Slice 3b. **The guest search box also inherited `/search`'s honesty caveat:** a guest whose search returns nothing sees "you're searching a handful of recent listings", because "nothing for that" from a six-row sample is not a fact about the network.

**`AppHeader` width prop.** `"wide"` (1400) on browse, `"standard"` (1240) everywhere else. Measured after: header box and `<main>` both 100 → 1500 at a 1600px viewport, and the pill shares the grid's gutter. **The eight prerendered-static routes are still static in the build output** — the whole reason `admin` is a prop and not a lookup, and the same discipline applied here.

**Verified:** `build` clean · `tsc` clean · eslint unchanged from baseline · `audit:rls` **59/59** · `audit:gates` **30/30 locally and against production**. Signed-in probe (fixture session, not assumed): nav is Browse · Profile on `/profile`, `/saved` and `/listings`; `/profile` carries `id="saved"`, `href="/saved"` and the rail anchor; browse shows the search box and real category counts. Mobile at 375px: disclosure reads "Price" on Furniture and "Neighborhood and price" on Apartments, tab bar is Browse · Post · Profile.

**`audit:gates` cries wolf against a cold dev server** — 8 false 404s on `/listings/[id]/edit` and `/contact` on the first run, 0 warm and 0 on stashed baseline. Second false alarm from this file in two days. Warm the server first.

**Flagged, not actioned:**
- **Five content widths**, not four — `/profile` is 900px and the notes missed it. 1400 / 1240 / 1100 / 1000 / 900, none of them chosen.
- **On a phone the search box sits below the category chips and the price disclosure**, because `FilterRail` is the first child of the browse grid. Coherent, but a search box conventionally goes on top; re-ordering it is a layout change nobody asked for.
- **`CLAUDE.md` was stale in two places, both in the direction that causes finished work to be redone**: migrations claimed applied through `0017` (26 on disk), and `0013` claimed unapplied when the live schema says `sponsor_name` no longer exists.

**Next:** George runs `0027` in the SQL editor, walks one blank-price listing end to end, then this merges. Slice 3b (`/admin` ×4) untouched.

## 2026-08-27 — Blank-price walkthrough passed; two live Classifieds bugs found

- **The blank-price feature (migration `0027`, applied to prod) is verified end to end and is correct.** Create path: Review step reads "No price", submit accepted, `/admin/moderation` says "No price" out loud, `/listings/mine` shows no price line, archived rows too. Edit path: clearing a price stores **NULL, not 0**; browse card, detail page and `/listings/mine` render nothing where the price was (HTML grepped for `$0` and `$NaN`, not eyeballed); the detail page's contact card omits the line with no gap; **Price sort puts it LAST**; **price filters EXCLUDE it**; a blank round-trips as a blank; the original price restored cleanly. Production database left byte-identical to its starting state.
- Verification: `npm run build` clean, `audit:rls` 59/59, `audit:gates` 0 failures locally and against `APP_ORIGIN=https://manhattanite.com`.
- **Branch `classifieds-walkthrough-fixes` verified but deliberately NOT merged**, pending George's call — see bug 1.

**Two bugs found, both pre-existing on `main` from the Classifieds merge (`4759502`), neither from this branch:**

1. **No listing with a photo can be posted or edited.** `ClImageUpload.tsx` writes the hidden `images` field as an array of objects (`JSON.stringify(items.map(i => ({ path: i.path })))`); `create.ts` and `update.ts` both demand an array of strings and reject anything else with **"Photos didn't upload cleanly. Try again."** The message is misleading — the upload succeeded; the form's wire format is wrong. The retiring editorial `ImageUpload.tsx` writes the correct shape (`items.map(i => i.path)`), so the restyle changed the contract while its own comment claims it did not. Caught empirically: the first Part B attempt on a photo-carrying listing POSTed 200 twice and changed nothing. **This blocks the core action of the product.** Fix: one line in `ClImageUpload.tsx`, or widen both parsers to accept either shape.
2. **Editing a furniture listing silently deletes its neighborhood.** The Neighborhood input renders for every category, but the server actions read `neighborhood` only for apartment/other/service. Since `update.ts` rebuilds `details` wholesale, furniture loses `details.neighborhood` on any save — the value `neighborhoodOf()` feeds to search, so it would quietly break the "searching 'tribeca' finds a Tribeca coffee table" behaviour locked in 26 Aug. Seed furniture rows also carry `tags` and `category`, which the form cannot express and drops the same way.

- **Design lesson worth keeping:** both bugs are the same shape — a control that renders but is never read. A field the form shows and the action ignores is worse than a missing field, because it invites someone to type something the product throws away. Worth a sweep of every form field against what its action actually reads before Slice 3b.
- Note on test method: seed listings all carry photos because `seed-example-listings.ts` writes rows through the service role, bypassing the form entirely. That is why bug 1 survived the merge unnoticed, and it means seed data is not evidence that the posting path works.
