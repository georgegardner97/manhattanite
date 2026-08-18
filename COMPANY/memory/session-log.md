# Manhattanite — Session Log

Append-only chronological record. Add a dated entry after every meaningful session. For the distilled list of strategic calls, see `decisions.md`.

Newest entries at the top.

---

## 2026-08-18 · Classifieds design system imported and built on real data (Claude Code)

**What happened:** the Claude Design project ("Manhattanite Classifieds.dc.html" + "Manhattanite Landing v3.dc.html") was imported and built as a working preview at **`/design`**, against the real listings table — real rows, real photographs, real bylines. **Eleven of the twelve screens plus the landing.** Only 07 Messages is unbuilt, and it stays unbuilt because in-app messaging doesn't exist and is out of v1; drawing it would mean inventing a threads table to illustrate a picture.

**Nothing on manhattanite.com changed, deliberately.** It all sits on the branch `design/classifieds-preview`, scoped to `/design/*`, noindex, and reverts with `rm -rf app/design` plus two lines in `NavGate.tsx`. Verified against the live site: `/design` returns 404 there, `/` is untouched. Vercel preview is green (behind Vercel SSO, so it needs George's login).

**The strategic read, which is the part worth keeping.** Having built both systems side by side: **the Classifieds direction is better for the PRODUCT screens and weaker for the MARKETING surface.** More legible, denser, easier to scan — browse, detail and post genuinely work better in it. But it is also more conventional (rounded pills, sans-serif, card grid) where the live editorial system (dark hero, Instrument Serif, hairlines, square corners) is far more distinctive and much closer to the Soho House register. That maps almost exactly onto the July **dark outside / light inside** decision: Classifieds is a strong candidate for *inside*, a weak one for *outside*. **Its highest value is as input to the designer's brief — the product shown on real data — not as the thing to ship.** This matters because the design freeze (13 Aug, "too AI") is still in force and this is itself a Claude-generated design.

**George's one design direction during the build:** on the landing, **sign-in becomes the primary action and opens a real working form in place** (no navigation, no modal), with **request access demoted to a small band at the foot of the page**. Flagged and accepted: most landing traffic has never been here, so above the fold they now meet only a members' door — the intended reading of "members only", but not the higher-converting arrangement.

**The rule that governed every judgement call: no dead controls.** Where the design drew something the product can't do, it was cut with a reason rather than faked — nine categories became the four that exist, "Closest" sort and "Save this search" were dropped, the weekly-digest and hide-my-name toggles were left out (no columns behind them, and hiding your name would contradict the trust mechanic outright), and the member profile shows only facts already public on every listing card.

**Two things now need George, neither of them code.** (1) `supabase/migrations/0026_member_profile.sql` is **written, not applied, and nothing calls it** — it is the concrete form of "what does knowing a member's name buy you", as a narrow SECURITY DEFINER function rather than a SELECT policy (a policy would make every future column on `accounts` public by default). (2) **The landing anonymizes bylines while browse names everyone** — the same logged-out visitor, the same six listings. One of the two is wrong about how public a member's name is, and the landing is the page that gets indexed.

**Verification gap, recorded so it isn't retried:** `.env.local` carries Cloudflare's always-passes TEST Turnstile key, so every local sign-in dies at the captcha before a password is checked. The post form, the settings rows and the forgot-password reveal have **never been rendered** — their gates are verified, their appearance is not. Hand-forging a session cookie was started and deliberately abandoned (version-fragile; a subtly-wrong session renders something *misleading*, which is worse than an honest gap). Claude cannot close this: previews sit behind Vercel SSO, and seeing those screens needs a member password it must not handle.

**Also:** local `main` has two August commits (`dbfeaf7`, `06d7b60` — the Week 12 RLS audit and strategy docs) that were **never pushed**; production has been on 22 July code. Both touch only docs and scripts, so the live site is functionally current — but a month of documentation and the audit work exist only on the laptop.

**Next:** George to eyeball the preview signed in (`/design/post`, `/design/settings`, and the forgot-password reveal on `/design/landing`); decide on migration 0026; settle the naming inconsistency; decide whether to merge to `main` (puts `/design` on the real domain, changes nothing live, gives a URL to send a designer) and push `main` for backup.

---

## 2026-08-17 · Design-first sequencing chosen; designer shortlist delivered

**George's call: get the branding and look right before any outreach at scale.** This confirms and sharpens the 2026-08-13 §6 decision (design reads "too AI", open design calls frozen, engage a professional). Cowork's honest push-back, accepted as framing: the blocker is now a *person*, not a decision, so the calendar is longer than it feels — conversations this week puts a redesigned site at mid-to-late October and outreach at scale in November rather than September.

**Two carve-outs agreed so the design freeze doesn't stop everything:**
1. **The five friend interviews are an input to the design brief, not a competing task.** A designer's first question is "who is this for?", and the audience question (§2, plutocratic consumer vs young professional) is still open. Interviews are coffees; they don't need a finished site. Doing them before briefing anyone protects the design spend.
2. **Three of the five offerings don't need a finished site:** George's own music listing (no ask), Cole (a marketing professional weighing up the work — showing her the rough version *is* the job), and Cody the dog walker. What genuinely waits is the one-shot stuff: aspirational names, friend-of-friend intros, the invitation sent at scale.

**Delivered: `design-foundation-project/outputs/Manhattanite_Designer-Shortlist_v1.md`.** Headline recommendation — **buy identity + art direction + three key screens as Figma files; do NOT buy implementation.** That split is roughly the difference between a $30k engagement and an $8–15k one, because the build is the expensive half of a studio website quote and the repo already has implementation capability. Shortlist (all verified against the studios' own sites on 17 Aug): **Practical People** (East Village, hospitality/boutique-hotel specialists, closest on subject matter, but light on digital product), **RoAndCo** (NY+LA, identity *and* web under one roof, editorial register, strongest all-round fit), **Rudy** (Brooklyn, Michael Freimuth post-Franklyn, small and hands-on, does digital product, offers fractional creative direction on retainer — an interesting alternative shape), **Order** (Brooklyn/Miami, the benchmark, likely out of budget), **Gretel** (Brooklyn, cultural/institutional brands). Note: **Franklyn has wound down** after 14 years; Freimuth's Rudy is the successor to look at. Doc also covers where to find the independent tier (Are.na, Instagram-followed-backwards, studio alumni, Cole) and why *not* Upwork/Toptal/Fiverr, plus five first-call questions and the send-only-three-things rule.

**Also discussed and parked: member perks as the opening proposition** ("special opportunities to Manhattanites from Manhattanites"). Cowork's reframe, not yet a logged decision: lead with **access and judgment, not discounts** — the vouched "my guy" directory, pass-alongs (tickets, reservations), first-look on listings, twenty minutes of a member's expertise, spare capacity, member-taught things. Acquisition mechanic proposed: a **second ritual** alongside the 3-names question at approval — "what's one thing you'd extend to other members?" Business-side perks should start with **members who own businesses** (warm ask) and use an ask-ladder of recognition → access → experience → price, with price last. Two cautions logged: don't let perks become the reason people join (wrong composition), and attribution ("vouched by X") never endorsement. This upgrades pillar 1 of the coaching framing; still needs the §3 reconciliation before any build. George opted to prioritise design first, so this stays a thread.

**RoAndCo repriced same day.** Their about page carries a client list the homepage doesn't show (Gucci, Kate Spade, Altuzarra, NARS, Bobbi Brown, Clinique, Google, Amazon Fashion, Vogue, i-D). That's a luxury fashion/beauty studio; estimate revised to a **$50k floor, $75–150k full scope, $35–75k even stripped back**. Moved from "strongest all-round fit" to "best taste, wrong price". Standing move for RoAndCo and Order both: email anyway, but ask *"I suspect we're below your minimum — if so, who would you send me to?"* The referral is the point, not the quote.

**Independent-designer search delivered: `design-foundation-project/outputs/Manhattanite_Independent-Designers_v1.md`.** Nine verified names (top five: **James Anderson**, **Triboro**, **Javas Lehn Studio**, **Elana Schlenker**, **Anna Polonsky**), the credit-mining sourcing method, three dead platforms, and engagement terms. Two things worth carrying forward beyond the names: **almost no independent designers keep East Village studios** (the right filter is whose *work* is downtown, not whose desk is), and **open with paid discovery — 5–10% of project value, credited against the full engagement — never a free pitch round.** Full detail in the design-foundation project memory.

**Next:** text Cole for designer names (still unsent); browser-check jamesanderson.studio + Polonsky & Friends (both blocked automated fetch); email Triboro / Javas Lehn / Elana Schlenker with the four-item scope and the paid-discovery opening (18th); free post on The Brand Identity jobs board; Newport 19–24; **CreativeMornings NYC Fri 28 Aug 8:30am at MAD**; audience decision + one-page brief + paid discovery commissioned with the top two, week of the 25th.

---

## 2026-08-13 · Week 12 hardening EXECUTED — RLS audit green, observability gaps found

**The must-hit is DONE in one session, and it passed.** Ran a behavioral RLS/trust-gate audit against prod (new harness `scripts/audit-rls.ts`, 59 cells) attacking the **API not the UI** — every table across anon / Tier-1 / member, incl. all three privilege-escalation columns, cross-member tamper, storage, and the moderation wall. **59/59 matched expectation, zero unexpected ALLOWs.** The trust layer is launch-ready. Full matrix: `mvp-build-project/outputs/Manhattanite_RLS-Audit_v2.md`. **Friday is genuinely overflow.**

**Two landmines found and handled mid-run:**
1. **`george.gardner480+` is NOT safe to bulk-purge** — 4 permanent seed members (Anna/Max/Lila/Sam) live under it and own 10 of 20 published listings. The brief's "delete synthetic accounts" against the bare prefix would have wiped half the live catalog. Harness uses a unique `+rlsaudit` sub-prefix and asserts seed-member + published-listing counts unchanged. **Rule for all future prod harnesses: own sub-prefix, never the bare one.**
2. **`signInWithPassword` is now Cloudflare-Turnstile-gated at the Auth API** (spam protection turned on since June). Every June harness (multi-sponsor, edit-archive, admin-console, listing-moderation) will now fail at sign-in. Fix: mint sessions via `admin.generateLink` → `verifyOtp` (no captcha, real authenticated JWT). The audit harness uses this; the others need the same one-line change.

**Part 2 — the real output beyond RLS (two launch-relevant gaps):**
- **Sentry is not wired at all** (no SDK, no script, no events) → no server-error observability in prod. Not verifiable as the brief assumed; it isn't installed. Decision needed: ship pre-launch?
- **Plausible / any analytics is not deployed** (no script on any route) → no product analytics. Bonus: `/privacy` copy claims "privacy-respecting analytics" that don't exist — soften or ship.
- **Resend:** DNS auth is healthy (DKIM present, `send.` delegated to SES, DMARC `p=reject` with relaxed alignment → Resend's DKIM aligns and passes). Code path intact (`sendListingContact`: Reply-To=sender, neighborhood renders). The one open item = the live inbox-vs-spam eyeball, which needs a logged-in prod member session (Turnstile-blocked for automation) — a 2-min manual check for George.
- **Extras:** favicon renders on prod (closes the 21-Jul Phase-4A eyeball); no console errors on landing + browse.

**Cleanup verified:** 0 synthetic rows, seed members intact (4/4), published listings intact (20/20), founder row byte-identical (`is_member=true`, `sponsor_id` null, `role=admin`). Code + docs committed.

---

## 2026-08-13 · Strategy session — mind dump organized; Week 12 hardening runbook delivered; Laermer corrected

**George's mind dump + Cole's voice notes + coaching output organized into `Growth/founding-member-acquisition-project/outputs/Manhattanite_Strategy-Session_2026-08-13.md`.** Logged as effectively decided: sublets are not the entry wedge (saturated); grassroots seeding per Cole (friends listing as a favor; invitation language first; taste/POV is the product); GdC-strictness doubled down as an advertised feature; design verdict "too AI" → professional designer to be engaged (serif/accent decisions FROZEN; the Aug-1 paperwork package becomes the designer brief); George wants a professional strategic partnership with Cole (pilot-scope proposal shape logged). Open threads: the audience question (plutocratic consumer vs young professional — resolve via 5 friend interviews + offering-reaction data, post-Newport) and whether the coaching three-pillar framing (locals-only discounts / community services / trusted buy-sell) is positioning or a category-roadmap change (flagged as mvp-spec scope shift; listing types already technically support services since 0019). Growth math logged: 20 seed members at r≈0.5/month referral conversion reaches the 50–100 year-end target; the 3-names ritual is the engine.

**Week 12 status: behind — no commits since Jul 22; the hardening must-hit hadn't started as of this morning.** Cowork delivered a ready-to-run session prompt: `mvp-build-project/outputs/Manhattanite_Week-12-Hardening_Claude-Code-Prompt_v1.md` (full RLS attack matrix across anon/Tier-1/member incl. privilege-escalation attempts, storage checks, moderation wall; then Sentry/Plausible/Resend deliverability incl. the never-verified real contact email). Today is the anchor day; weekend make-up rule if it slips (Newport eats Week 13).

**Corrections + housekeeping:** the Laermer meeting never happened — postponed indefinitely (the Aug-1 note assuming it took place was wrong; tracker parked, still flagged important). Angie's List task closed as superseded by the audience/pillar thread. Docs commit executed by Cowork (the ~20-file uncommitted pile — the July doc-wipe condition — cleared).

---

## 2026-08-10 · Call prep for Cole Spike (potential marketing hire)

**George has a phone call with Cole Spike** — marketing, part of John Doe & Co, has worked with Zero Bond among others; a candidate for Manhattanite's marketing. Cowork produced a one-page discussion-points doc: `WORK AREAS/Growth/founding-member-acquisition-project/outputs/Manhattanite_Call-Prep_Cole-Spike_v1.md`. Five areas: chicken-and-egg cold start (present the seed plan, ask her to attack it), differentiation from Listings Project / Girls Who Sublet NYC / Ohana (they curate listings, nobody curates the people on both sides), whether to lead with sublets or furniture, **George's new open question: is 25–40 the right target, or should it skew to older wealthy New Yorkers for whom trust is a dealbreaker** (GdC's French base is families; worth a strategy revisit after the call), and a script for asking her fee structure professionally (ask engagement structure first, stage-honesty second, advisory-hours fallback). Also flagged: the call doubles as a fit test — no-ads posture and first-90-days deliverables are the tells.

---

## 2026-08-01 · Part-time income direction chosen — music teaching project created

**George chose a part-time income direction alongside Manhattanite: teaching music and creativity to children** (1:1 bass/guitar lessons + small-group songwriting labs), landed on after an ideation session that started from skills-for-hire options. Target $2,500–4,000/month at ramp; teaching hours (weekday 3:30–7pm, weekends) deliberately sit outside the Manhattanite 9–4 block.

**New work area and project created: `WORK AREAS/Income/music-teaching-project/`** (brief, memory, outputs). Deliverables drafted to outputs/: listserv blurb (2 versions), one-page site copy, and an agency shortlist with week-one actions (references, apply to Hey Joe Guitar + Musication, post blurb in own circles, build the one-pager site). Parent-facing copy uses American spelling, same call as Manhattanite copy.

---

## 2026-07-22 · Mobile polish pushed and verified on prod

**The two mobile-polish commits Cowork made earlier today (2b169b4 + 1d10c1a) are pushed and live on manhattanite.com.** Cowork's sandbox couldn't push and left stale git lock files behind; those were cleaned up (renamed `*.lock.stale.*` / `stale-index.lock.*` files, ~170 leftover `tmp_obj_*` temp files in `.git/objects/`, and a 28MB temp tarball in `.next/`) before pushing. Push accepted cleanly, no force, history untouched.

**Verified on production at 390px:** the membership headline "A marketplace that knows who it's dealing with." renders; the footer's BROWSE / MEMBERSHIP / INFO columns share one row (wordmark block spanning above); forward links ("Browse the network") render underlined with no "→" glyph, and no "→" appears in any link on the landing page.

---

## 2026-07-22 · Mobile polish — arrows retired, membership copy, form + footer

**Four small phone-view fixes from George's screenshot review, applied and live in the repo (not yet committed to git).** (1) The "→" glyph is retired from forward links sitewide: ArrowLink now renders a plain 14px link with a persistent hairline underline (45–50% strength at rest, full color on hover) — chosen from three live mockup options (small-caps, underline-only, caps-color); George picked underline-only. Back links keep "←" (direction, not decoration). The four hand-rolled "&rarr;" labels on the join/sponsor-request token pages lost their arrows too. (2) Membership headline is now "A marketplace that knows who it's dealing with." (utility-first framing, per strategy) replacing "Manhattan already trusts Manhattan. We just wrote it down." (3) The landing email form: field is now required + autoComplete/inputMode email, focus border works on tap (focus, not focus-visible), and the Apply button goes full-width when the row stacks under 520px. Confirmed behavior: the address submits as a GET to /signup and prefills the signup form. (4) The mobile footer's three link columns now sit side by side in one row (wordmark block spans above them) instead of stacking — the footer was a full screen of scroll on a phone.

**Verified:** `tsc --noEmit` and `eslint` clean on all five touched files. Pending George: real-device look at the new footer row and underlined links, then git commit + deploy.

---

## 2026-07-21 · Mobile pass — the emulated half, audited and fixed

**Every reachable route swept at iPhone dimensions (390×844 DPR 3, spot-checked at 375×667) and the iOS trap list fixed within the existing system.** The big four: inputs now hit iOS's 16px threshold on phones so focusing a field no longer zooms the whole page; the landing hero measures itself in `svh` so it fills the visible screen instead of jumping with Safari's toolbar; the page opts into `viewport-fit=cover` with safe-area padding on the gutter, hero chrome and footer, so nothing sits under the notch or home indicator; and every small text link grew an invisible 44px tap target (coarse pointers only — desktop is untouched). Also: the three hand-written hover rules are now gated to hover-capable devices (no more stuck underlines after a tap — Tailwind's own hover utilities were already gated), and the browse category row scrolls the active chip into view on load (on "Everything else" it used to load fully offscreen).

**Verified:** zero horizontal overflow on every route at both sizes, desktop regression-checked (hero, nav hover fill, browse rail unchanged), `npm run build` clean. The mobile "after" screenshot set is committed at `WORK AREAS/Product/design-foundation-project/outputs/mobile-pass-screens-2026-07/`.

**Still George's half:** the real-device walk — toolbar-collapse feel, notch/landscape behavior, actual tap feel, and the logged-in screens (local auth is still blocked at Cloudflare, so post form / profile / mine / admin were audited at code level only). Flagged, not fixed: the hero photo is soft at DPR 3 (known `TODO(phase-4)`), and listing photos download full-size originals on mobile (no `srcset` — a later image-transform slice).

---

## 2026-07-21 · Phase 5 — transactional emails restyled to the v12 design

**Every send in `lib/applications/emails.ts` rebuilt on one shared email-safe layout** (table-based, inline styles, Georgia headlines + wordmark, Arial body, 600px bone card, hairlines, boxed CTA) per the approved v12 mockup. The three contract emails carry the mockup copy verbatim; the reviewer ping keeps its action block untouched inside the new bones; invite/sponsorship/moderation sends moved onto the same layout with copy unchanged. Plain-text alternative added to every send.

**Reply-To on the contact forward was already set** to the sender's address — confirmed, no fix needed. Contact forward gained the sender's neighborhood (one extra column on the existing read-own select). Interpolated user data is now HTML-escaped.

**Verified:** rendered locally and checked at 700px and 360px in the browser; `npx tsc --noEmit` and `npm run build` clean; one test of each sent to info@manhattanite.com only. Send triggers, recipients, and best-effort error handling untouched. Pending: George's Gmail check (desktop + phone).

**Amendment shipped same session:** wordmark replaced with a retina PNG of the true Instrument Serif mark (same next/og pipeline as the OG card, `/email/wordmark.png`); headlines + quotes now prefer Instrument Serif via `@font-face` woff2 with Georgia fallback (Apple Mail true serif, Gmail Georgia). Assets verified live on prod before the three tests were re-sent to info@.


---

## 2026-07-20 · Slice 3 SHIPPED — Phase 3 of the design plan is complete

**Six commits plus four prod-pass fixes, all live.** Every product screen now sits on the same system: post a listing, edit listing, profile, edit profile, my listings, and all four admin pages.

**The two pages the audit graded C+ were fixed structurally, not cosmetically.** On `/listings/mine` the archived QA test listing had been out-shouting the live ones; muting it wasn't enough, because it was still the same object at the same size. Archived listings are now compact hairline rows under their own heading — no image, no card — so one can't outweigh a live listing again. `/profile` moved out of its centered stack into the editorial grid, with sponsorship as a small-caps credential line rather than its own section.

**Forms** got boxed fields and boxed submits throughout. The photo and avatar uploaders took a *dashed* hairline — solid means "a control you act on", dashed means "a space something goes into" — because as solid boxes they were competing with the actual submit button. The listing submit now reads "Submit for review", which is what it does under pre-moderation, with the moderation notice moved to sit with it.

**Stage 0 (local auth) was attempted and is BLOCKED at Cloudflare.** The real public site key was found and installed, and Cloudflare rejected the `localhost` hostname outright — the widget offers no challenge at all. Reverted to the test key. To finish, George needs to add `localhost` to that widget's allowed hostnames in the Cloudflare dashboard; until then every gated screen must be verified on prod.

**Worth keeping:** four defects appeared only on the prod pass, not in the build — including a radio row that pushed "Service" outside the content column on a phone, where it couldn't be tapped at all. A clean `npm run build` says nothing about layout.

**No data behavior changed.** Two selects gained columns already on the row under the same policy (`created_at`, `details`); everything else is styling and copy.

---

## 2026-07-20 · Slice 2 SHIPPED — detail page editorial, auth crosses to the dark side

**Built by Claude Code, verified live.** Listing detail + contact now use the editorial grid (rail + back link, EXAMPLE kicker, serif title with price opposite, wide lead photo, hairline metadata table, boxed primary action). Login / signup / resets / apply share a new `AuthShell` on park-dark with boxed `.mh-input` fields, dark Turnstile, and submits that read as pressable. Signup prefills from the landing's email form. Footer email corrected to info@.

**Verification:** everything logged-out verified by Claude Code on prod (desktop + 390px); the four member-only paths verified by Cowork through George's signed-in Chrome — message button + modal, Edit on an owned listing, /apply's member redirect. Only the dark /apply *form* remains unseen (needs a Tier-1 session; none exists).

**Findings:** (1) localhost auth broken since 30 June — test Turnstile key in `.env.local` vs real secret in Supabase; fix task queued. (2) Local dev uses the PRODUCTION database — separate dev DB logged as backlog before real members arrive. (3) Serif numeral-1 quirk now visible on profile ("June l, 2026") — evidence for the Phase 2 serif call.

**Next: Slice 3** — forms (post/edit), profile, /listings/mine (archived weight fix), admin tidy, smart-quotes sweep. Then Phase 4 brand lock.

---

## 2026-07-20 · Slices 1 + 1.1 SHIPPED — the ICW redesign is live on prod

**Slice 1 (Claude Code, commits b998215/10412d7/8a5bda3):** foundation utilities + `BoxButton`/`ArrowLink` + `ListingCard` + tier-aware `SiteFooter`; dark park landing at `/` (full-bleed hero, statement, membership block); light bone browse at `/listings`. EXAMPLE tags preserved, gating untouched, verified on prod.

**George's review produced Slice 1.1 (commits c544566/409efb2):** (1) nav-disappears bug — the x-pathname header hiding didn't survive client-side navigation; fixed with a `NavGate` client wrapper on `usePathname()`; (2) browse title → "Today's listings."; (3) categories moved to a **sticky left rail** (ICW All Products pattern, George's reference), mobile keeps the horizontal row. All verified on prod including the landing→browse→detail click path.

**Open:** George's 30-second logged-in check (`/` redirect + member browse); hello@ vs info@ footer email; hero photo retina replacement (Phase 4). **Next: Slice 2** (listing detail light + auth/apply dark, prompt already in outputs/).

**Incident:** this file and design-foundation memory.md were found reverted to last-committed git state (uncommitted doc edits wiped between sessions) — restored by Cowork from its copies. New rule: commit doc changes to git at the end of every session.

---

## 2026-07-17 · ICW direction chosen, palette locked (dark outside / light inside), Slice 1 prompt out

**Phase 1 compressed into a day.** George picked **In Common With** (incommonwith.com) off Mobbin as the primary reference ("very similar, our colours and fonts"). Delivered the 12-pattern steal sheet (`Manhattanite_Steal-Sheet_v1.md`) — headline steals: label-left editorial grid as master layout, the dated "Lately" card as the listing card, boxes reserved exclusively for actions (fixes the CTAs-look-disabled audit finding), accent as text colour only.

**Mockup loop, four rounds same day:** v5 (ICW structure, Manhattanite tokens) → George: yes, but category tiles advertise the two-category launch too loudly → v6 (no categories, 2×2 listing grid) → George shared the pitch-deck slide, asked for its palette → v7 (all park-dark) → v8 interactive (dark landing, click through to light browse). **Decision: dark outside, light inside.** Category tiles parked until 4+ categories.

**Slice 1 Claude Code prompt delivered** (`Manhattanite_ICW-Slice-1_Claude-Code-Prompt_v1.md`): tokens + BoxButton/ArrowLink system, dark landing, light browse with new ListingCard. EXAMPLE tag and tier gating explicitly protected. Auth/detail/forms queued as Slices 2–3.

---

## 2026-07-17 · Font fix shipped same day — Instrument Serif live sitewide

**The Phase 0 headline finding is fixed and deployed**, hours after the audit. Claude Code applied the `@theme inline` fix plus a second subtlety the prompt missed: the `body` base rule used a raw `var(--font-sans)`, which goes dead under `@theme inline` (variables get inlined into utilities, not emitted at `:root`) — repointed it to `var(--font-inter)` directly. Only `app/globals.css` changed. Verified on prod: body → Inter, headings → Instrument Serif, ~50 existing `font-serif` usages now render sitewide with zero component changes.

**Beige-block mystery resolved (not a bug):** re-inspected the Yorkville listing on prod post-deploy — the page has exactly one image, it loads fine (1600×2000), and no empty blocks exist in the DOM. The block in the audit screenshot was the image's transient lazy-load placeholder caught mid-scroll. No action; a nicer loading treatment is optional Phase 3 polish.

**New observation for the Phase 2 serif decision:** listing detail body copy also renders in Instrument Serif (the components use `font-serif` on more than display type), and at body sizes its numeral "1" reads like a lowercase "l" ("August l"). Judge the serif on real screens with this in mind.

---

## 2026-07-17 · Design Foundation Phase 0 — baseline audit shipped (headline: fonts never load)

**Phase 0 of the design-foundation project done in one session.** Captured 16 desktop screenshots of prod (browse, detail, contact, post form, mine, profile, profile-edit, admin ×2, auth ×3, terms) via George's Chrome; graded every screen against the brand guide's do/don't table. Output: `Product/design-foundation-project/outputs/Manhattanite_Design-Audit_v1.md` + `outputs/before-screenshots/`.

**Headline finding — a bug, not taste:** Instrument Serif and Inter are loaded by next/font (variables present on `<body>`) but the Tailwind theme never maps them, so **every element on prod renders in the OS system font**. Verified in the live DOM: zero elements use Instrument Serif or Inter. Recommended fixing this (one line-ish in `app/globals.css`) before Phase 1 even starts.

**Grades:** all screens land B−/B; My listings and Profile at C+. No failures — the layout system (paper, hairlines, caps kickers, whitespace) is consistent and the voice is strong. Cross-cutting gaps: no action/button system (primary CTAs look disabled), listing card undesigned (identical treatment for a $4,200 apartment and a side table), empty beige placeholder block on listing detail (possible bug), archived listings shown at full weight, zero accent colour in practice.

**Couldn't capture:** logged-out landing (George signed in; not worth logging him out) and phone widths (extension window-resize didn't take). Both carried forward.

**Next:** the font fix (Claude Code, one session) → then Phase 1 (Mobbin account + steal sheet).

---

## 2026-07-14 · Monetisation scenarios — Radio H-P vs Gens de Confiance

**Strategy discussion, no decision changed.** Researched both comparators' actual revenue models. Radio H-P (~8k members, founder-run): free membership, pay-per-advert on a sliding scale with property at the top — the direct model for a two-person operation. GDC (~2M members, breakeven 2022): everything free except vacation rentals (€119/6mo, extends free if unrented, ~60% of revenue) + real-estate pro packages — needs volume we won't have.

**Three scenarios sketched:** (1) Cohort 3 @ ~500 members, apartments $49 → ~$500–700/mo, signal not income; (2) 2–5k members, sliding scale (apartments $99–149, jobs $75, furniture free + $15 featured) → ~$100k/yr, the realistic ceiling for two people; (3) 10k+ members, GDC-lite apartments-only $149-until-rented → ~$30k/mo, but manual approval/moderation breaks at that scale — forces a hire-or-loosen decision.

**Refinements flagged (pending confirm):** price apartments high ($99–149 — broker-fee pain makes it cheap); keep furniture free forever (browse liquidity); adopt GDC's "extends free until rented" guarantee; continue resisting pro/broker packages. Confirmed pay-per-post decision (2026-05-17) stands, validated by both comparators.

---

## 2026-07-02 · GTM shift — Seed phase activated, Growth work area created

**Strategy call.** George declared the build "mostly done" and shifted focus to member acquisition. Reviewed `gtm-playbook.md` (2026-05-16, never actioned) — the plan already exists; the job now is execution. **Decision: conversations now, legal in parallel** — outreach and list-building start immediately, but no member approvals until entity formation + attorney review of T&P/fair-housing are done (see decisions.md, Go-to-market).

**Created:** `WORK AREAS/Growth/founding-member-acquisition-project/` (brief, memory, outputs/) with:
- `Founding-Members_Plan_v1.md` — two-week action plan: week 1 = 30-name brain-dump, start LLC formation, outreach template, load the 27 seed listings, 3 coffees; week 2 = 10 outreaches + 3 meets; from week 3, a 2-day-a-week routine (Mon = outreach batch, Thu = meets).
- `Founding-Members_List_v1.md` — candidate tracker with Anna/Max/Lila composition scoreboard and a vouched-name bench.

**Revised same session:** George overrode the legal gate — no entity registration until money is about to change hands (triggers: first dollar, ~50+ members, or strangers joining). Approvals unblocked immediately; the surviving guardrail is a fair-housing checklist in the moderation pass for apartment listings. All project files + decisions.md updated to match.

**Open next:** the week-1 actions themselves; confirming the playbook's four open assumptions as they bite.

---

## 2026-06-12 · Invite slice built (cold-start growth engine) + quick wins + GDC logged-in research

**Strategy call — invite-led, not request-led.** George (logged into a live GDC member account) and I decoded GDC's actual mechanism: request sponsorship from people you know → sponsor accepts → moderators validate; 3 sponsors required; a status ladder (Débutante → Confirmée) gated by how many you sponsor, rate-limited by status. George's sharp pushback: a request-a-sponsor flow needs density we don't have (5 members). **Resolution: build invite-led growth** (a member brings someone in, vouching by inviting), floor stays at **1**, the newcomer still needs George's one-tap approval. Request flow / floor>1 / status ladder are explicitly **deferred** to when there's density. Full reasoning: `outputs/Manhattanite_GDC-Mechanics-and-Recommendations_v1.md`.

**Invite slice — built end to end (3 stages), both migrations applied to prod, awaiting one deploy push:**
- **0020:** `invites` table (+ RLS: inviter manages own) and `applications.sponsor_id` (the inviter, carried to approval; null = founder default, unchanged).
- **0021:** `get_invite` (anon read by token), `accept_invite` (invitee links self), `inviter_for_me` (apply reads it to set sponsor_id) — all SECURITY DEFINER.
- **Flow:** member → `/invite` (in the account menu) sends an invite email → invitee clicks `/join/[token]`, sets a password, `accept_invite` links them → `/apply` attaches the inviter as sponsor → admin queue shows **"Invited by [member]"** and approval records the real sponsor (not George). Trust wall intact; friction moved to the inviter.
- tsc + eslint clean throughout. Commits: Stage 1 `e082e95` (committed, **unpushed**); Stages 2+3 staged (sandbox git lock blocked the commit — Claude Code to commit + push).

**Quick wins (shipped earlier same session, commits `670ec8c` + `540c972`, live):** login/signup/root → `/listings`; added **Other** + **Service** listing categories (migration 0019, the type CHECK + form + actions); **avatar-menu nav declutter** (My listings/Profile/Admin/Log out moved under the avatar); and the **hand-drawn NYC skyline** restored to the landing hero (from the parked v4 mockup) — confirmed live.

**Open / next:** push the invite commits (Claude Code) to ship the slice. Then: test the full invite loop on prod; consider an "invites you've sent" view (Stage 4-ish); the request-flow + status-ladder remain parked until density.

---

## 2026-06-12 · Landing image band + full QA walkthrough + Terms/Privacy shipped + John Robinson cleared

**Worked on:**
- **Landing "On the network" band.** Replaced the text-only glimpse with a real image band (GDC-style proof — confirmed GDC leads with real listing cards), moved it directly under the hero, then shrank it on George's feedback to a quiet 672px column of small 4/3 landscape thumbnails with stacked captions. Commits `1045d15` → `da27013`, live. Added migration `0018` (anon read of `listing-images`) so guest covers render; committed it so prod/repo no longer drift. Interleaved the example listings' `created_at` so the teaser leads apartment → furniture mixed (was all-furniture).
- **Full QA walkthrough on prod** (guest via server-fetch + member/admin via browser). Everything loads; the trust gate holds at every layer. Verified the whole **post → in-review → approve → outcome-email → archive** loop end to end (two-step confirms on approve + remove are a nice touch) using a throwaway listing, and the contact form (member → lister, logs `listing_contacts` + Resend). Report: `outputs/Manhattanite_QA-Walkthrough_Report_v1.md`.
- **Fixed the two real findings.** (1) `/terms` + `/privacy` were hard 404s linked in the landing footer → built real plain-English **working-draft** pages grounded in `legal-and-policy.md`, each with a visible "pending counsel review" notice (commit `7d26651`). (2) Cleared the fake **'John Robinson'** sponsor from the 2 founder listings (`update listings set sponsor_names='{}' where 'John Robinson' = any(sponsor_names)`) → they now read "Listed by George Gardner". This closes a thread open since the 0006 byline work.
- **Polish sweep.** Guest listing-detail CTA is now "Sign in to message" → /login (was a "Message the lister" button that bounced guests to a bare login screen); fixed a "Membership is" spacing bug on /terms. Signup copy checked — already consistent ("Create an account" everywhere; "Join the network" is just an on-brand headline), no change.

**Flagged:**
- T&P are working drafts. A NY attorney should review both (Tier-1 legal item), especially the fair-housing listing-standards language, before any non-George apartment listing goes public. Worth adding to the Legal project.
- An archived "QA TEST" listing remains in the founder's My Listings (off the public network; Cowork can't hard-delete — George can drop the row if he wants it gone).
- Contact email **delivery** to seed members unverified (the test message went to seed member Lila, who may have a placeholder email). Confirm a real send before relying on it in a live demo.

**Next:** site is demo-ready — every flow works, legal pages exist, no fake data on bylines. Bigger tracks open: launch-gating legal (entity formation, attorney review of T&P + fair housing) or next features (member invite / add-a-sponsor flow, profile photos, listing search).

---

## 2026-06-12 · Example listings SEEDED — 17 live on prod with photos, Example badge shipped

**Worked on:**
- Seeded prod with the example inventory: 10 apartments + 7 furniture from the two seed docs, all published with photos, via the new idempotent `scripts/seed-example-listings.ts` (`npm run seed:examples`, `--unseed` to reverse). Four example members (Anna, Max, Lila, Sam) created through the real apply → approve path, each sponsored by George — bylines render correctly. George authors 7 of the 17 per the docs.
- George's 20 Unsplash photos were loose on the Desktop (the `seed-images/` folders in the brief didn't exist) — viewed all 20, content-matched them to listings (the 7 furniture shots matched FM1–FM7 exactly), resized to web size into a gitignored `seed-images/`, uploaded to the private bucket.
- Added the "Example" badge to /listings cards + detail pages (`is_example`-driven).
- Verified end to end: 17/17 with images + bylines, founder's 3 real listings byte-identical, idempotent re-run clean, live landing glimpse + teaser badges confirmed post-deploy (commit `c31a6e8`).

**Flagged:**
- Guest /listings teaser and the landing glimpse show no photos by design (image bucket is authenticated-read only; glimpse rows are text-only). Photos appear for signed-in users.
- Landing glimpse rows carry no Example label and are currently 100% examples — worth a copy/design think.
- Seeded "color" over the doc's "colour" (FM2) per American-spelling convention.

**Next:** real-member invitations can now land on a populated network. Possible follow-ups: Example label on the landing glimpse, mixed-type teaser ordering.

---

## 2026-06-11 · Edit & Remove + Admin Console BOTH SHIPPED — 0013–0016 applied by Cowork, all harnesses green

**Worked on:**
- Cowork applied four migrations to prod via the SQL editor (0013 drop sponsor_name, 0014 listings owner-archive + drop member hard-delete, 0015 admin console, 0016 listings_read_own). I ran all three harnesses green — `test:multi-sponsor` 16/16, `test:admin-console` 24/24, `test:edit-archive` 20/20 — then committed both slices + migrations + scripts + docs and pushed to main. Vercel deploying.

**The archive saga, corrected for the record:**
- 0014 closed a real drift: an OPEN member hard-DELETE policy (a member could delete their own listing via the API, wiping moderation history). Now gone.
- My follow-on hypothesis was WRONG: I thought a hidden RESTRICTIVE status-pin policy blocked archive and parked a migration to drop restrictive policies. Cowork's live pg_policy read proved ZERO restrictive policies exist and 0014's WITH CHECK already allowed 'archived'. My parked migration was a no-op — deleted.
- Actual cause: no SELECT policy let a member read their own non-published rows, so the archive read-back returned nothing and looked like a failure. Fix = 0016 `listings_read_own` (own-rows-only SELECT). Lesson: when an RLS read-back fails, suspect a missing SELECT policy before inventing a restrictive WITH CHECK; the authoritative check is a live pg_policy read (Claude Code has no direct-SQL path here — PostgREST keys only).

**Shipped:** Admin Console (dashboard + review queue + member directory; listing-moderation queue is the separate next slice) and Edit & Remove (owner edit + soft-delete archive). Migration backlog now clear (0013–0016 all live).

**Deployed + live-verified.** Pushed 5 commits to main; Vercel deployed. Drove the live site with a synthetic admin + member (cleaned up after, founder untouched): /admin loads for admin with live counts + review queue; non-admin gets a 404 and no Admin nav link; edit + Remove(archive) work end to end (status='archived' in DB, soft delete). Live check caught one bug — the member directory showed "No members yet" because a PostgREST self-join FK embed errored (constraint not named accounts_sponsor_id_fkey); fixed with a second query (commit 849cca5), redeployed, re-verified.

**Next:** listing-moderation-queue follow-up (the 4th admin view).

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-11 · Admin Console slice BUILT — stopped pre-deploy for 0015 SQL run; found a live security gap

**Worked on:**
- Built the Admin Console (George-only): application review queue with Approve/Decline/Request-more-info, stats dashboard, read-only member directory. Route-gated (requireAdmin: non-admin → notFound) + RLS + a new in-function admin guard underneath. Server actions call the rpc as the signed-in admin, never the service role. SiteNav gets an admin-only "Admin" link. Listing-moderation queue deliberately left for the separate follow-up.
- Migration `0015_admin_console.sql` (renumbered from the planned 0014, which is taken by the parked edit-slice migration): adds an admin guard to approve/decline/request_more_info and grants them to authenticated; adds an admin read-all policy on listings; flips the founder to role='admin'. Plus `npm run test:admin-console`.

**Caught — second prod drift in two slices, and this one's a live gap:**
- In prod today, any signed-in user can call the review functions. `decline_application` / `request_more_info` SUCCEED with no guard (a member could sabotage the queue); `approve_application` is stopped only by the column-protection trigger, so membership still can't be granted by a non-admin. Repo says service-role-only; the `revoke from public` never took in prod. Confirmed with a synthetic non-admin (a decline went through).
- Migration 0015 closes it (re-revoke + admin guard). Harness self-detects whether 0015 is live: pre-0015 it's 15 passed / 0 failed / 2 deferred (the security assertions that need the guard), and it documents the gap as a FINDING.
- Founder is still role='account' in prod — 0015 sets it. Flagged so George knows the console matches nobody until the SQL runs.

**Parked SQL-editor queue for George (in order):** 0013 (drop sponsor_name), 0014 (listings owner-archive), 0015 (admin console). Then I re-run both harnesses, push, deploy, re-verify.

**Next:** George runs 0013/0014/0015 → re-run test:admin-console + test:edit-archive (expect green) → commit/push/deploy → listing-moderation-queue slice.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-11 · Edit & Remove slice BUILT — stopped pre-push: prod RLS drift blocks archive

**Worked on:**
- Built the full listing edit + remove (soft delete) slice: `updateListing` + `archiveListing` server actions, owner-only `/listings/[id]/edit` with pre-filled form (NewListingForm + ImageUpload extended for edit mode), Edit/Remove controls on `/listings/mine` (inline confirm, no browser dialog), "Edit listing" link for the author on the detail page. Typecheck, build, lint, and the write-set grep guard all clean.
- New prod harness `npm run test:edit-archive` (multi-sponsor mold: plus-alias synthetics, founder snapshot, auto-cleanup).

**Caught — the reason nothing shipped:**
- **Prod RLS has drifted from the repo.** The live listings UPDATE policy pins `status='published'` in WITH CHECK, so members cannot archive (probe-verified; field edits pass, status transitions fail). No migration or memory entry records that pin. Worse: the live DELETE policy lets members hard-delete their own listings via the API — against the locked soft-delete-only decision.
- Per the slice guardrails: stopped before commit/push. Drafted migration `0014_listings_owner_archive.sql` (allow owner archive in WITH CHECK; drop the member DELETE policy) for George to review and run in the SQL editor. Harness passes everything that doesn't touch status (15/20; the 5 = archive path + one cosmetic JSONB key-order compare, since fixed).

**Next:** George reviews/applies 0014 → re-run `test:edit-archive` (expect green) → commit, push, deploy, re-verify on prod.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-10 · Multi-Sponsor slice SHIPPED — many sponsors per member, hybrid-at-2 byline live

**Worked on:**
- Built + shipped the multi-sponsor model: `sponsorships` table (source of truth, RLS locked down), `listings.sponsor_names text[]` denorm cache, shared `lib/listings/byline.ts` renderer (hybrid-at-2), reworked byline/propagation triggers, `add_sponsor()` seed helper, `approve_application()` writes a primary sponsorship row. Three pages moved to the array column (the plan named two; `/listings/mine` was a third, caught by the grep guard).
- Mid-slice, George changed the cutover plan: 0012 was applied to prod in an **additive** form — `sponsor_name` kept and dual-written (= primary) instead of dropped, zero-downtime in either migrate/deploy order. Repo migration updated to match prod.
- Prod test harness (`npm run test:multi-sponsor`): **21/21 green** — 1/2/3-sponsor bylines, primary-first order, rename propagation, sponsor removal, anon read, dual-write invariant, cleanup to 0 synthetic rows, founder untouched (snapshot-verified). Pushed; Vercel deploy succeeded; live render verified on manhattanite.com/listings.

**Caught:**
- First harness run failed one assertion — it wrongly demanded the 'John Robinson' placeholder on every founder listing; the founder's third listing (2026-06-09, post-0006) legitimately has none. Test bug, fixed via before/after snapshot compare.

**Next:** cleanup migration dropping `listings.sponsor_name`; reconcile root `CLAUDE.md` (still describes single-sponsor); min-2 apply flow later.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-09 · Navigation slice SHIPPED — tier-aware nav + logged-out teaser browse

**Worked on:**
- Built + shipped the navigation spine: a global, tier-aware `SiteNav` (guest / account / member each see only the links they can use), a member-only `/listings/mine`, back links, and removal of the redundant per-page wordmarks on interior pages. Plus the D1 teaser: logged-out visitors browse the 6 most recent published listings (migration 0010 adds an anon read policy) instead of being bounced to `/login`; the action layer stays the wall. Three commits, pushed, deployed.
- Full prod test loop passed across all three tiers (guest teaser + non-teaser→signup redirect; account nav + gates holding on /listings/new and /listings/mine; member nav + /listings/mine populated + back links). Used synthetic accounts; founder left untouched (is_member=true, sponsor_id=null). Prod has 3 founder listings.

**Next:** contact slice (the "capture the value" gap), or signup-name + copy pass.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-09 · /apply Slice C SHIPPED — three membership emails, tested clean on prod

**Worked on:**
- Built + shipped Slice C: `lib/applications/emails.ts` (three best-effort Resend sends — applicant confirmation, refined reviewer ping, "You're in." welcome), wired confirmation + ping into `submit.ts` (insert now returns the id), and `scripts/approve-application.ts` + `npm run approve` as the seed-phase approval path (Option A CLI; service-role key via supabase-js rpc, migration 0009 grants execute). Two commits, pushed, Vercel deployed.
- Full apply → approve → welcome → cleanup loop tested on prod against the deployed code (synthetic applicant on a Gmail plus-alias so applicant-facing emails were readable; founder untouched). All three emails confirmed; DB transaction atomic; `/listings/new` gate opens for the approved member.

**Caught:**
- First test run hit the not-yet-deployed old code (deployed, then re-tested). Resend "low quota" headers were a false alarm (rate-limit, not budget — George confirmed). First test-applicant address (`george@manhattanite.com`) wasn't a readable inbox; switched to the Gmail plus-alias.

**Next:** the walkthrough checkpoint (agreed live-site pause); repeat the landing-page / thin-content caveats.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 4 Slice 2 shipped — /profile/edit + cosmetic fix on /profile link stacking

**Worked on:**
- Closed the "name not collected at signup" thread (open since Slice 2). New `/profile/edit` route + form lets members update their own name, neighborhood, bio. No migration — accounts table already had the columns from 0001, the RLS update-own policy + protect_account_columns trigger already cover the security model.
- Three new files: `lib/profile/update.ts` (server action, validates + writes), `app/components/ProfileEditForm.tsx` (client form), `app/profile/edit/page.tsx` (route shell). Added "Edit profile →" link to `/profile` in both member and Tier-1 branches.
- Live test on prod: full round-trip verified (form save → /profile re-render → /listings byline updated via the Slice 1 trigger). Caught + fixed a cosmetic bug where the two secondary links ran together on one line.

**Decided:**
- Name is optional, not required. Byline has a graceful "a member" fallback.
- Empty string → null on save (cleaner DB state).
- Cosmetic link-stacking fix bundled into the slice (caught during live test, fix is 6 lines).

**Blockers / open threads:**
- Slice ships in two commits — the cosmetic fix needs a small follow-up commit after the main `feat(profile)` push.
- No /apply route yet — Tier-1 holders can edit profile but can't apply.

**Next:**
- /apply route (Phase 2 proper, 2-3 sessions).
- Or: seed listings load (needs real photos).
- Or: small polish round.

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 4 Slice 1 shipped — author/sponsor byline denormalized

**Worked on:**
- Closed the "Listed by a member · sponsored by —" byline gap that's been open since Slice 4. Migration `0006_listings_byline_denorm.sql` adds `author_name` + `sponsor_name` text columns to listings with a `BEFORE INSERT` trigger (populates from accounts via SECURITY DEFINER lookup) and an `AFTER UPDATE` trigger on accounts (propagates renames + sponsor changes). Set founder's `accounts.name = 'George Gardner'` (was null since Slice 2). Backfilled both existing founder listings; manually overrode `sponsor_name = 'John Robinson'` as a demo-visibility placeholder.
- Code: dropped the embedded `author:accounts(name)` select from `/listings` and `/listings/[id]` (it was returning null due to accounts read-own RLS), now reads `author_name` + `sponsor_name` directly. New `renderByline()` helper conditionally appends the sponsor portion only when `sponsor_name` is present.
- Live test on prod confirmed: full byline on both founder listings; conditional renders cleanly without sponsor when nulled; rename trigger round-trip propagates without error.

**Decided:**
- **GdC-style full first + last name format** ("George Gardner") over Vinted-style initial ("George G.") — switched after looking up Gens de Confiance's convention. Trust-by-identity, matches the editorial brand voice. Privacy trade-off accepted.
- **Denormalize over RLS public-profile policy or SECURITY DEFINER view** — RLS is row-level not column-level, and views don't traverse PostgREST embedded selects cleanly. Triggers handle rename propagation.
- 'John Robinson' is fake placeholder data; replace before any non-founder sees the network.

**Blockers / open threads:**
- 'John Robinson' is fake — must go before public-facing surface.
- Name not collected at signup (Slice 2 thread) — real members will render "Listed by a member" until profile-edit UI exists.
- Two slices' worth of byline-display work now closed: this slice closes the Slice 4 byline gap.

**Next:**
- Build `/profile/edit` so members can set their own name (unblocks real-name bylines).
- Or: `/apply` route (Phase 2 proper).
- Or: seed-data load (with real photos sourced).

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 3 Slice 6 shipped — image upload via Supabase Storage

**Worked on:**
- Housekeeping pass on `CLAUDE.md` Part 2 — replaced the "Phase 1 just beginning / Supabase not yet wired / waitlist→gating in transition" framing with the current truth (through Phase 3 Slice 5, Supabase wired, gating page live). Added a fresh Active-migrations list for the genuinely-open threads.
- Slice 6 in full: two new migrations (`0004` adds `images jsonb` with a ≤6 CHECK; `0005` creates a private `listing-images` Storage bucket + 3 RLS policies), four new code files (`lib/storage/upload-listing-image.ts`, `lib/storage/sign-image-urls.ts`, `app/components/ImageUpload.tsx`, plus updated form / action / browse / detail pages). Migrations driven from Cowork via Chrome → Supabase SQL Editor (first time a slice migration was applied from Cowork rather than Code tab). Commit + push handed to Claude Code via a self-contained prompt. Vercel auto-deployed.
- End-to-end test on prod: posted a SoHo loft with 3 photos, verified detail-page gallery + browse cover + the conditional render path for image-less listings. Cleaned up the smoke-test row + storage objects via the Supabase JS client in the browser (RLS owner-delete policies allowed both). `.test-uploads/` workaround folder removed locally.

**Decided:**
- 6-photo cap per listing (revised down from the 2026-05-16 `8`).
- Private bucket + signed URLs over public bucket — Tier 0 → Tier 1 wall must hold on pixels too.
- Upload-on-select, plain `<img>` tags (not Next.js `<Image>`), orphan-file cleanup deferred.

**Blockers / open threads:**
- The three byline / `/apply` threads from Slices 4/5 still open — unchanged.
- `delete from storage.objects` is blocked by Supabase (`42501: Direct deletion from storage tables is not allowed`); use the Storage API instead.
- Cowork's `file_upload` MCP rejected my local JPEG paths during the test; worked around by fetching picsum photos in the page JS context and dispatching a synthetic `change` on the file input. Pattern documented in the project memory for reuse.

**Next:**
- Candidates for the next session: load the 27 seed listings (with real photos sourced first); OR wire the author-name / sponsor-name display; OR start the `/apply` route.

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md` (project memory).

---

## 2026-05-18 · Personal Assistant fully configured for Manhattanite

**Worked on:**
- Activated and scoped the Personal Assistant inside the Manhattanite workspace. PA plugin was installed back on 2026-05-15 but never properly switched on.
- Built the missing Admin-PA scaffolding: `captains-log/2026-05-captains-log.md`, `contacts.md`, `preferences.md`, `output-log.md`. Until now only `tasks.md` existed.
- Wrote `WORK AREAS/Admin-PA/manhattanite-pa-config.md` — the master operational config for the PA. Covers email/calendar account map, calendar permissions (Personal Google Calendar read+write, Outlook read+write, Danbro read-filtered), cross-folder access pattern for George's other Cowork workspaces, proactive surfacing rules, ADHD defaults, logging behaviours, and what the PA explicitly does NOT do.
- Upgraded the existing scheduled tasks `pa-morning-briefing` (7am daily) and `pa-end-of-day-summary` (8pm daily). Both now read Manhattanite project memory (`COMPANY/memory.md` + `WORK AREAS/Product/mvp-build-project/memory.md`), scan Outlook for business email, and have a hook to read other Cowork workspaces when mounted. Morning briefing now produces a dedicated "Manhattanite build state" section and includes a Monday-only "Week ahead" view.

**Decided:**
- **Outlook = Manhattanite business, Gmail = personal, never cross.** Already in `pa-rules.md`; reinforced in the PA config and both briefing prompts.
- **Anticipate aggressively.** Daily 7am briefing + 8pm EOD + meeting prep before meetings + decision surfacing — drafts everything, sends nothing without George's per-message approval.
- **Cross-folder pattern: on-demand mounting.** Scheduled tasks request other Cowork workspaces via `request_cowork_directory` when needed. Cowork persists approved mounts so subsequent runs come up silently.
- **Calendar autonomy:** PA may create, move, and respond to events on Personal Google Calendar and Outlook for George's own time. Still surfaces a decision before booking external attendees.

**Blockers / open threads:**
- **Other Cowork folder paths pending.** George needs to share the exact paths of his other Cowork workspaces (e.g. music, personal life) so they can be listed in `manhattanite-pa-config.md` Section 3 and mounted on first request.
- The 8pm EOD summary will fire later today and should now reflect this richer setup. Worth a Run Now from George to pre-approve the new connectors the prompts reference.

**Next:**
- George shares paths to other Cowork folders → add them to the cross-folder map.
- Optional: George triggers Run Now on `pa-morning-briefing` and `pa-end-of-day-summary` to pre-approve Outlook/Gmail/Calendar tool access so future scheduled runs don't pause on permission prompts.

---

## 2026-05-17 · Phase 0 collapse migration complete

**Worked on:**
- Executed and verified the Phase 0 collapse migration on the night of 2026-05-17.
- Unified the previously split Cowork workspace and Claude Code repo into a single folder at `~/Developer/manhattanite`.

**Decided:**
- Single folder at `~/Developer/manhattanite` is now the source of truth for both the CoWork upper layer (ABOUT ME, COMPANY, RESOURCES, WORK AREAS) and the Claude Code lower layer (Next.js codebase). No more drift between two folders.

**Blockers / open threads:**
- None from the migration itself.

**Next:**
- Resume Phase 1 build work against the unified folder.

---

## 2026-05-16 · Tech stack locked

**Worked on:**
- Confirmed Batch 4 assumptions as defaults (lifetime ban, no broker listings, four-state sponsor ladder, George's-name-on-emails at seed, lawyer engagement in 4–6 weeks).
- Rewrote `tech-architecture.md` from stub to confirmed v1. Locked the full stack: Next.js + Vercel + Supabase + Resend + Cloudflare + Plausible + Sentry + GitHub.
- Closed every open decision in the stub: auth via magic link, single sponsor FK, status-based applications, three roles only, one listings table with JSON details, 8 photos per listing, contact form via Resend, RLS as the security primitive of the two-tier model.
- Added missing scaffolding the stub didn't cover: Sentry, GitHub, deployment flow, backups, security posture, observability.

**Decided:** See `decisions.md`. Headlines:
- Full stack confirmed. Total cost ~$10/month at MVP.
- RLS on every member-only table is non-negotiable — it's what makes the two-tier wall real.
- No staging environment; Vercel previews + production are enough at MVP.
- Backups: free-tier OK at seed, upgrade to Supabase Pro at Cohort 1.

**Blockers / open threads:**
- George has 5 personal action items before build week 1: register domain, create GitHub repo, sign up for accounts, pick email-from addresses, decide production-promotion rule.
- Founding-member acquisition project still unstarted.
- Lawyer outreach still unstarted.

**Next:**
- George runs through the 5 pre-build action items.
- After that: spin up `WORK AREAS/Product/mvp-build-project/` and begin build week 1.
- In parallel: founding-member acquisition + lawyer outreach.

---

## 2026-05-16 · Batch 4 — GTM, trust, legal

**Worked on:**
- Drafted `gtm-playbook.md`: three-phase model (Seed 0–20, Cohort 1 20–80, Cohort 2 80–200), founder routines per phase, channel posture, anti-patterns, and metrics.
- Drafted `trust-and-moderation.md`: approval criteria (baseline + tilts + automatic decline), listing standards by category, sponsor accountability ladder (good standing → watch → probation → removed), removal grounds, edge cases.
- Drafted `legal-and-policy.md` as a tiered open-questions map (not legal advice). Identified Tier 1 items that block MVP go-live: entity formation, TOS, privacy policy, founder identity exposure. NYC fair-housing flagged as the largest unaddressed risk.

**Decided:** See `decisions.md`. Headlines:
- No paid ads. Sponsorship-led growth. Public marketing surface delayed until Cohort 2.
- Free until Cohort 3, then pay-per-post via Stripe.
- Sponsor accountability is a graded ladder, not binary.
- Lifetime ban on removal (default; open to a 12-month cooling-off alternative).
- Seed-phase legal posture: private + non-transactional. Counsel engagement is the first move.

**Blockers / open threads:**
- All legal Tier 1 items remain open. George needs to find a NY startup attorney.
- First-20-members list still to be built. Lives under `WORK AREAS/Growth/founding-member-acquisition-project/` once created.
- Several assumptions in the new files want a reaction round: broker-listing policy, founder identity exposure, sponsor accountability ladder granularity, lifetime ban vs cooling-off.

**Next:**
- George reacts to Batch 4 assumptions.
- Spin up `WORK AREAS/Growth/founding-member-acquisition-project/` for the operational first-20 list.
- Begin lawyer outreach.
- Decision needed: do we draft a `WORK AREAS/Legal/counsel-engagement-project/` to track the legal workstream?

---

## 2026-05-16 · Batch 3 + clarifications round

**Worked on:**
- Drafted Batch 3: `mvp-spec.md` (two-tier model, 14-week timeline, v1 OUT cuts, success criteria) and `tech-architecture.md` stub (default stack table, open decisions, data model sketch).
- Applied a sweep of George's clarifications across earlier files: American English throughout, two-tier access model propagated, palette demotion of Brick, wordmark + final palette deferred.
- Created visible top-level `COMPANY/memory.md` as the quick-state entry point (deep memory files stay in `memory/`).
- Updated `_index.md` to point at the new memory entry.

**Decided:** See `decisions.md`. Headlines:
- Two-tier access model is the core mechanic: Account (free, view-only) → Member (approved, can interact).
- Contact form in v1 forwards to email; no in-platform inbox until v2.
- American English everywhere in Manhattanite-branded copy, overriding George's personal British defaults.
- Wordmark + final palette deferred until first product screens exist. Black + cream working base; Brick demoted to reserve.

**Blockers / open threads:**
- First-20-members strategy still undefined. Sits as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture still undefined. NYC fair-housing rules for apartment listings need structured work.
- Default stack (Next.js + Supabase + Vercel + Resend + Cloudflare + Plausible) is provisional until tech-architecture.md is confirmed.

**Next:**
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`.
- Set up `WORK AREAS/Growth/founding-member-acquisition-project/` once GTM playbook exists.
- Confirm tech stack before week 1 of MVP build.
- Possible side-quest: mock wordmark concepts on a real first screen.

---

## 2026-05-16 · Context system kickoff (Batch 1 + 2 + clarification)

**Worked on:**
- Designed the 9-file context system for `COMPANY/`.
- Resolved 3 strategic pushbacks: launch categories, trust mechanic, MVP timeline.
- Set up `COMPANY/memory/` with decisions log + session log.
- Drafted Batch 1: `pa-rules.md`, `_index.md`, `product-vision.md`.
- Drafted Batch 2: `brand-guide.md`, `voice-and-copy.md`.
- George clarified: account creation in the MVP is real, not example. Application path is functional from day one and reviewed manually.

**Decided:** See `decisions.md`. Headlines:
- 2-category launch (apartments + furniture)
- Trust mechanic: seed-phase = open application reviewed by George; post-launch = sponsor-only primary
- No "waiting list" framing — use "apply for membership"
- 14-week MVP target (end of August 2026)
- Stack: Next.js + Supabase + Vercel (default, pending confirm in `tech-architecture.md`)
- Seed MVP has labelled example listings + real application flow
- Brand: GT Sectra wordmark with italic "ite" (default), Lampblack + Paper + Brick palette (default)
- Voice anchor: Soho House. Tagline placeholder: *New York's trusted private marketplace.*

**Blockers / open threads:**
- First-20-members strategy is undefined. Lives as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture is undefined. Needs structured work, including NYC fair-housing rules for apartment listings.
- Spelling split (British vs American) flagged for confirmation in voice-and-copy.md.
- Brand color and wordmark direction are defaults — need George's react.

**Next:**
- Batch 3: `mvp-spec.md`, `tech-architecture.md` stub
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`
- Set up `WORK AREAS/` with founding member acquisition project once GTM playbook exists
- Possible side-quest: mock wordmark concepts

---

*Entry format: date · short title, then sections for Worked on / Decided / Blockers / Next.*
