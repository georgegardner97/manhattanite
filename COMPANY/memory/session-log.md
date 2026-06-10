# Manhattanite — Session Log

Append-only chronological record. Add a dated entry after every meaningful session. For the distilled list of strategic calls, see `decisions.md`.

Newest entries at the top.

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
