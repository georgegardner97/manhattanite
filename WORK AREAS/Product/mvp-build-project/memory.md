# Project Memory — MVP Build

Chronological log. Newest entries at the top.

---

## 2026-06-01 · Phase 1 Slice 3.5 complete — two-tier gating page replaces the waitlist form

**Worked on:**
- **Closed the front-door / side-door mismatch.** The landing page (`app/page.tsx`) was still the waitlist Airtable application form, while `/signup` (shipped in Slice 2) quietly created real accounts behind the scenes. Visitors hit the wrong door. `app/page.tsx` is now the Tier 1 gating page: the locked "Public-facing gating page" + "Two-tier explainer" copy from `voice-and-copy.md`, verbatim. American spelling throughout. Kept the existing visual treatment (giant serif wordmark, color, layout container, footer) — only the content region changed.
- **Server-side gate.** Page is now an async Server Component. It calls `supabase.auth.getUser()` before rendering; a logged-in visitor is `redirect()`-ed to `/profile` (the exact reverse of the guard `/profile` runs for logged-out visitors). Logged-out visitors see the pitch.
- **CTAs.** Primary `Create an account →` links to `/signup`. Secondary `I have an invite →` is commented out (dead-link rule — no invite flow exists yet; a later block wires `/invite`).
- **Preserved the application pipeline as dormant code.** Extracted the old `submitApplication` server action (Resend notification + Airtable write) out of `page.tsx` into `lib/applications/submit.ts`, untouched and unwired. `app/components/ApplicationForm.tsx` and `app/components/ApplyLink.tsx` left exactly as they were. The `/apply` slice will revive and refactor these — not rebuild them. Airtable + Resend env vars in Vercel left in place, dormant.
- **Verified.** tsc + eslint clean. Locally and on prod confirmed: logged-out `/` shows the gating copy + both tiers, `Create an account →` points at `/signup`, the invite CTA is absent (commented out, not a 404), and no Airtable form / `submitApplication` is wired to the homepage. Commit `e85ed9d` (`feat(landing): …`), pushed, Vercel live ~40s later.

**Decided:**
- **ApplicationForm + submitApplication preserved as dormant — `/apply` reuses, not rebuilds.** This is the big one. The whole pipeline survives the landing-page swap; the next slice lifts it back into a real `/apply` route.
- **Extraction (option b) over dormant-in-page (option a).** Leaving `submitApplication` unrendered inside `page.tsx` would have left unused imports + an unused function tripping eslint. The clean lift to `lib/applications/submit.ts` was the smaller, lint-clean diff.

**Blockers / open threads:**
- **`voice-and-copy.md` CTA library is stale.** Its table still lists "Join the network" as the create-account CTA (and "Create account" in the don't-use column). This slice ships "Create an account →" — the current truth. Flagged here, **not edited** in `voice-and-copy.md` this slice per the build plan. Reconcile the CTA library in a later copy pass.
- **Logged-in redirect + full signup→profile click-through not click-tested by Claude.** There are zero accounts in the project right now (the Slice 3 test user was deleted), and fabricating one needs a signup George should drive. The redirect logic is code-identical-in-reverse to the proven `/profile` guard. Both are part of George's prod verification loop (the six-step test in the build plan).

**Next session:**
1. Run the six-step gating-page loop on prod (logged-out gate → Create an account → /signup → complete signup → /profile → revisit / while logged in → 307 to /profile → sign out → gate again).
2. Reconcile the stale "Join the network" CTA row in `voice-and-copy.md`.

---

## 2026-06-01 · Phase 1 Slice 3 complete — forgot-password reset flow shipped to prod

**Worked on:**
- **Next 16 `middleware.ts` → `proxy.ts` rename.** Cleared the deprecation warning that printed on every dev boot since Slice 1. Same matcher config, same session-refresh behavior, renamed function. Verified the warning is gone and the session cookie still refreshes on each request.
- **Built the forgot-password reset flow (Block 4).** `/reset-request` (email-only form → `resetPasswordForEmail`, with a generic no-leak success message so the page can't probe who's in the network). Reused the existing `/auth/callback` route for the code exchange. `/reset-password` (session-gated — a cold visit with no recovery session bounces to `/reset-request`; 8-char minimum; `updateUser({ password })` → `/login`). Uncommented the "Forgot password?" link on `/login`.
- **Fixed the Supabase Auth URL config — this was the real blocker.** The redirect-URL allowlist was **empty** and the Site URL was a dev value (`http://localhost:3000`) on a production project, so recovery links had nowhere valid to land. With George's go-ahead: set Site URL to `https://manhattanite.com`, and added both `http://localhost:3000/auth/callback` and `https://manhattanite.com/auth/callback` to the redirect allowlist.
- **Housekeeping.** Deleted the `/supabase-test` smoke-test route. Deleted the Slice 2 test user `claude-test-1780015807648@example.com` from `auth.users` (cascades to `public.accounts`) — project now has zero accounts.
- **Shipped.** tsc + eslint clean, routes render 200. Commit `c36b7ef` (`feat(auth): …`), pushed, Vercel deployed; `manhattanite.com/reset-request` confirmed live with the correct copy.

**Decided:**
- **`redirectTo` uses `window.location.origin`, not an env var.** The build plan referenced `process.env.NEXT_PUBLIC_SITE_URL`, which doesn't exist in `.env.local`. `window.location.origin` is host-adaptive (localhost in dev, manhattanite.com in prod) and avoids an undefined value — both origins are now in the Supabase allowlist.

**Blockers / open threads:**
- **Live email round-trip not tested by Claude.** Sending a real recovery email and clicking the link needs an inbox Claude can read and a registered account (there are none now). Verified everything else (compile, render, session gate, config). George's 4-step manual test: create an account with a real inbox → Forgot password? → click the email link → set a new password → log in.
- **Pre-existing lint error in `app/thank-you/page.tsx`** (`<a>` to `/` instead of `<Link>`). Predates this work; flagged as a separate spawned task, not bundled into the auth commit.

---

## 2026-06-01 · Parallel content lanes — homepage copy v2 + seed listings drafted while Slice 2 ran

**Worked on:**
- While Claude Code was executing Phase 1 Slice 2, ran two parallel content lanes (parallel-safe with the code build — no overlap on app/, lib/, supabase/, or middleware).
- Drafted `outputs/Manhattanite_Homepage-Copy_v2.md` — the trust-first replacement landing page in the locked voice. Hero, three-pillar promise (better stuff / trust the people / you're in or you're not), two-tier mechanic explainer, what's listed, sponsorship paragraph, founding cohort honesty block, footer. American spelling throughout. Single CTA pair ("Apply for membership" / "I have an invite") repeated, no other CTA verbs. Build notes attached. Five-point test passed inline.
- Drafted `outputs/Manhattanite_Seed-Listings_v1.md` — 12 apartments + 15 furniture listings, each tagged `[EXAMPLE]` per spec. Real streets (Bank, Greene, East 78th, Orchard, Vandam), real brands (Ceccotti, BDDW, Knoll, Carl Hansen, Flos, Ligne Roset), honest flaws named (chip, scratch, repaired chair, sun-fade). Sponsor defaults to George with six rows showing cross-member sponsorship (Anna, Max, Lila) for design preview. Photos are placeholder counts only — real images to be sourced before any non-founder sees the network. Five-point test passed inline.

**Decided:**
- Homepage v2 stays parked in `outputs/` until Phase 1 + early Phase 2 give the page real proof to point to. The "what's on the network right now" section needs a live count from the `listings` table before ship.
- Seed listings ship into the database the same week the `listings` table lands in Phase 2. `is_example = true` on all 27 rows. Tag stripped automatically once flag flips.
- Kept scope tight to copy work that wouldn't compete with Slice 2 for attention. Legal and founding-member acquisition lanes remain unstarted — flagged for a later parallel session.

**Blockers / open threads:**
- Both files are draft v1 / v2. Want a George read-through before either is treated as final. Homepage hero phrasing ("A private marketplace for New Yorkers") is a working line, not a locked headline.
- Six non-George sponsor names in the seed listings are a display call — database can hold either; swap to George before launch if preferred.
- Founding-member acquisition + NY attorney outreach still unstarted.

**Next session:**
1. Review homepage copy v2 against the live page; decide whether the founder-cohort honesty section reads right or feels too soft.
2. Decide on the six non-George sponsor names in seed listings (keep for variety, or normalize to George).
3. Pick up one of the still-open lanes: founding-member acquisition list, or attorney outreach brief.

---

## 2026-06-01 · Phase 1 Slice 2 complete — email + password auth shipped to prod

**Worked on:**
- **Auth method override executed.** Per the 2026-05-27 decisions-log update, swapped the locked magic-link plan for email + password (with reset flow planned). Reset flow itself deferred to next session per the build-plan cut-order; everything else delivered in one slice.
- **Database (Block 1) — accounts table + RLS + triggers, applied to production.** Migration `0001_accounts.sql` (175 lines) creates the table per the locked schema (`id`, `email` unique, `name`, `neighborhood`, `bio`, `role` enum, `is_member`, `sponsor_id` self-FK, timestamps), wires the `auth.users → public.accounts` AFTER INSERT trigger so signUp auto-creates the profile row, and enables RLS with read-own / update-own / admin-read-all / admin-update-all policies. Protected `role` / `is_member` / `sponsor_id` / `email` via a `BEFORE UPDATE` trigger so non-admins can't escalate themselves on their own row (simpler than self-referencing subqueries inside `WITH CHECK`).
- **Caught and fixed an RLS infinite-recursion bug during end-to-end testing.** The original admin policies subqueried `public.accounts` from inside policies on `public.accounts` itself, error `42P17`. The recursion short-circuits all RLS evaluation on the table — meaning even the "read own row" policy never gets a chance, so logged-in users saw "Setting up your account…" forever. Migration `0002_fix_admin_rls_recursion.sql` (93 lines) wraps the admin check in an `is_admin()` `SECURITY DEFINER` helper that bypasses RLS for the inner lookup; applies the same fix to `protect_account_columns`. Standard Supabase gotcha, easy fix once diagnosed. **Both migrations now versioned in `supabase/migrations/`** — the database is reproducible from the repo.
- **UI (Block 2) — /signup, /login (password), session middleware.** `/signup` is a Client Component (~163 lines) with the gating-page copy from `voice-and-copy.md` lifted verbatim; CTA is "Create an account" (never "Sign up") per the CTA library. Replaced the prior session's magic-link `/login` with email + password + a "Forgot password?" link (commented out until Block 4 ships next session). Friendly error mapping for invalid-credentials (rewrites Supabase's "Invalid login credentials" into Manhattanite voice). `middleware.ts` refreshes the Supabase session cookie on every matched request.
- **Profile (Block 3) — /profile reads own row, redirects logged-out.** Server Component that calls `getUser()`, redirects to `/login` if null, then reads the user's own row via RLS. The "Apply for membership" CTA is commented out until `/apply` exists in a later slice; the Tier-1 nudge text stands on its own.
- **End-to-end test loop verified locally then live in production.** Drove a full signup → /profile → sign out → /profile (307 to /login) → wrong password (friendly error) → correct password → /profile loop in Chrome via the claude-in-chrome MCP, both at `localhost:3000` and at `https://manhattanite.com`. Vercel deploy was live 11 seconds after `git push`.
- **Workflow note.** Drove the Supabase SQL Editor and the localhost dev server programmatically via Chrome MCP + JavaScript-into-Monaco to apply migrations and run end-to-end tests, instead of asking George to copy-paste SQL. Faster, repeatable, and George stayed watching the screen.

**Decided:**
- **Commit message convention adjusted.** Original plan said `feat(auth): email+password login, signup, reset + accounts table + RLS (Phase 1 Slice 2)`. Since reset is deferred, the actual commit is `feat(auth): email+password login, signup + accounts table + RLS (Phase 1 Slice 2)` (no `reset`). The detailed bullet body still ends with a "reset flow deferred to next session" note for the audit trail.
- **Dead links hidden, not deleted.** `/reset-request` (Forgot password?) and `/apply` (Apply for membership) both 404 today. Both are commented out in the UI rather than removed entirely, so Block 4 (and the future apply slice) just need to uncomment.
- **Memory + planning docs split into a separate commit.** Code lands as `feat(auth):…`; memory and `WORK AREAS/` updates land as a follow-up `docs:` commit so each is reviewable in isolation.
- **Test account left in production for now.** `claude-test-1780015807648@example.com` is a real row in `auth.users` + `public.accounts`. Useful as a known-good test account for the next session's reset-flow work; can be deleted from Supabase at any time.

**Blockers / open threads:**
- **Block 4 — reset flow — deferred.** Build `/reset-request` (calls `resetPasswordForEmail` with `redirectTo` → `/auth/callback?next=/reset-password`), reuse `/auth/callback` for the code exchange, build `/reset-password` (calls `updateUser` → redirect to `/login`). Uncomment the "Forgot password?" link on `/login`. End-to-end test the email round-trip on the live site (test inbox needed).
- **Next 16 `middleware.ts` → `proxy.ts` rename.** Dev server prints `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` on every boot. Pre-existing from Slice 1, not introduced today. Small rename + matcher copy. Bundle with Block 4 so the deploy log stays clean from that point forward.
- **`/supabase-test` route still live in production.** Per the rules of engagement, leave it alone until Block 4 ships and a final smoke test confirms the auth pages survive the reset-flow additions. Then delete and `feat: …` commit.
- **`name` not collected at signup.** Today's `/signup` only collects email + password; `name`, `neighborhood`, `bio` on the `accounts` row stay null until profile editing ships (probably alongside the application flow). `/profile` falls back to email when name is null, which reads OK for now but is the obvious next polish.
- **Email confirmation is OFF in Supabase Auth settings.** Per the build plan, this was the intentional choice for the build loop. Decide before real members arrive whether to turn it back on (one toggle in Supabase + a follow-up "check your inbox" UI state).

**Next session (Block 4 — forgot-password reset flow + housekeeping):**
1. Rename `middleware.ts` → `proxy.ts` (Next 16) — first thing, clears the deprecation warning before the rest of the work.
2. Build `/reset-request` (email-only form → `resetPasswordForEmail`).
3. Build `/reset-password` (new-password form → `updateUser` → redirect to `/login`).
4. Uncomment the "Forgot password?" link on `/login`.
5. End-to-end test with a real inbox: request reset → click email link → set new password → log in with new password.
6. Decide on `/supabase-test` removal (probably yes by end of slice).
7. Commit + push + verify on prod.

Estimated effort: ~60–90 minutes if the reset email lands cleanly the first try; longer if Supabase's redirect-URL allowlist needs tweaking.

---

## 2026-05-18 (morning) · Phase 1 Slice 1 complete — Supabase wired in

**Worked on:**
- Finished the env-var restore from last night: added `RESEND_API_KEY` and `AIRTABLE_API_KEY` to Preview and Development environments in Vercel (had been Production-only because of how the variables were created on the Production-specific page).
- Strategic alignment conversation: George flagged that the existing waitlist page reads Raya (exclusivity-first hero, no visible utility), which contradicts the trust-first / utility-leading direction we've reconciled to. Confirmed alignment.
- Locked the landing-page decision (Option C): current waitlist page stays until Phase 1 + early Phase 2 give us something real to put on a trust-first homepage; then the replacement ships as the visible deliverable of the seed MVP. Form test on the existing waitlist was dropped (testing the wrong product).
- Logged a future task: design workstream begins ~Phase 1 week 2-3, before Phase 2 listing UI work needs design decisions.
- **Phase 1 Slice 1 (stack setup) executed end-to-end:**
  - Verified the Supabase project already exists (`info@manhattanite.com's Project`, region us-west-2 Oregon, Free plan, healthy). Acknowledged Oregon adds ~70ms latency vs an east-coast region; not a deal-breaker at MVP scale; deferred any migration.
  - Retrieved the publishable key from Supabase Settings → API Keys (new naming; replaces the old "anon" key).
  - Appended `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
  - Installed `@supabase/supabase-js` (^2.106.0) and `@supabase/ssr` (^0.10.3) into the project.
  - Wrote `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client with cookie adapter ready for slice 2 auth) following the Next.js 16 App Router SSR pattern.
  - Added a temporary `/supabase-test` smoke-test route (Server Component that calls `supabase.auth.getUser()` and renders the result).
  - TypeScript + ESLint pass clean locally. Local `npm run build` aborted on Google Fonts fetch (sandbox network restriction); not a real failure.
  - Added Supabase env vars to all three Vercel environments via the Claude-in-Chrome browser automation (Production, Preview, Development).
  - Committed everything to git as `9d14752` ("feat(supabase): wire Supabase client + smoke test (Phase 1 Slice 1)") and pushed to `origin/main`. Vercel auto-deployed in 22s.
  - **Smoke test passed in production:** `manhattanite.com/supabase-test` renders showing URL set, Anon key set, and Connection: Connected (no active session — expected for anonymous visitors). Real proof that the deployed app can talk to Supabase.

**Decided:**
- Skip Sensitive flag for Supabase variables in Vercel (default left ON for Production, OFF for Development per Vercel's restriction). NEXT_PUBLIC_* vars end up in the client bundle anyway, so masking adds nothing functional.
- Use the new Supabase "publishable" key naming (sb_publishable_…) rather than legacy "anon" JWT keys. Same role, current Supabase recommendation.
- `.claude/` added to `.gitignore` — it's Claude Code per-machine settings, not project state.
- `WORK AREAS/Product/mvp-build-project/outputs/.gitkeep` is an accidental file from an early session-start mistake; left untracked. Harmless. Operating rules say never delete.
- Claude-in-Chrome browser automation is officially part of the workflow going forward — saved ~10 minutes of manual Vercel clicking. Worth the small one-time pairing setup.

**Blockers / open threads:**
- Slice 1 leaves `/supabase-test` live in production. Anyone visiting `manhattanite.com/supabase-test` sees a small "yes Supabase is wired" page. No secrets leak (URL is already public via NEXT_PUBLIC_, anon key is by design safe). Delete it when slice 2 ships real auth pages.
- Founding-member acquisition project still unstarted.
- NY startup attorney outreach still unstarted. Tier 1 legal items (entity, TOS, privacy, founder identity) block go-live.

**Next session (Phase 1 Slice 2 — magic-link auth):**
1. Create the `accounts` table in Supabase with RLS policies (account / member / admin roles, `is_member` flag, sponsor FK).
2. Wire Supabase Auth + Resend for magic-link emails (custom SMTP setup so emails come from a manhattanite.com address).
3. Build `/login` page (email input, magic-link request).
4. Build `/auth/callback` route handler (token exchange, session set).
5. Build a minimal authenticated `/profile` page (Server Component that reads the signed-in account row, displays name/neighborhood/bio).
6. Add Next.js middleware to refresh sessions on every request.
7. End state: a real visitor can enter their email on `/login`, receive a magic link, click it, land logged in. The two-tier wall starts to be real.

Estimated effort: ~2 focused hours. Best done fresh.

---

## 2026-05-17 (late evening) · Env-var restore in progress, COMPANY/memory.md refreshed, landing-page decision framed

**Worked on:**
- Refreshed the stale `COMPANY/memory.md` "Quick state" snapshot to reflect the post-folder-collapse reality (single unified folder at `~/Developer/manhattanite`, live site, open admin items).
- Walked George through the env-var restore in Vercel for the live waitlist form. Took longer than expected because of TextEdit not opening the hidden `.env.local`; pivoted to a Terminal `cat` command, which worked.
- Both `RESEND_API_KEY` and `AIRTABLE_API_KEY` got added to the new Vercel project, but **scoped to Production only**. The Vercel Edit dialog wouldn't let George expand the Environments selector to add Preview and Development scope (likely because the variables were created on the Production-specific environment page, which locks scope at creation). Skipped the multi-env scoping fight for tonight.
- Drafted a 3-option framing for the landing-page question (keep current waitlist / replace with gating page / hybrid). Recommended Option C (keep current page; build Phase 1 behind it; swap once auth is live). Decision not yet locked.

**Decided:**
- Skip Preview/Development env-var scope for tonight. Production is what runs manhattanite.com; that's what matters for the live form. Preview/Dev becomes a v-low-effort follow-up once we know the right Vercel workaround (probably delete + re-create via the Shared tab, or via each environment's page individually).
- Side flag: the AIRTABLE_API_KEY value in `.env.local` starts with `sk_live_` rather than the usual Airtable `pat...` prefix. Working theory: it's an older key format Airtable still honors, since the live site worked previously. If the form fails after redeploy, regenerate the Airtable key as the first fix.

**Blockers / open threads:**
- **Redeploy:** George confirmed he hit Redeploy before signing off. Keys should be live on Production.
- **Untested:** the form has not been tested yet. Test plan: open manhattanite.com in incognito, submit application with George's own email as the test value, watch for email at info@manhattanite.com + new row in Airtable. First-thing-tomorrow task.
- Landing-page keep-vs-replace decision still open. Option C (hybrid) is recommended but not locked.

**Next (locked priorities for tomorrow):**
1. **First thing — no questions asked:** Add `RESEND_API_KEY` and `AIRTABLE_API_KEY` to Preview and Development environments in Vercel. George explicitly asked for this to be tomorrow's first task.
2. Test the live application form (Redeploy already happened tonight).
3. Lock the landing-page decision (Option A / B / C from tonight's framing).
4. Then: begin Phase 1 build slice 1 (Supabase + magic-link auth scaffold).

---

## 2026-05-17 (evening) · Discovered existing project, reconciled strategy, synthesized position

**Worked on:**
- Investigated three "manhattanite" folders on George's Mac: ~/Desktop/Manhattanite (CoWork workspace), ~/Projects/manhattanite (today's clean shell), ~/Developer/manhattanite (prior work, originally assumed to be discardable old waitlist).
- Discovered ~/Developer/manhattanite was actually substantial: working Next.js 16 landing page + form + Resend integration + Airtable database + 26KB STRATEGY.md from 2026-05-06. NOT junk.
- Copied STRATEGY.md into the CoWork workspace and read it in full.
- Produced a structured reconciliation document (outputs/Manhattanite_Strategy-Reconciliation_v1.md) comparing OLD STRATEGY.md vs NEW COMPANY/ docs across 5 axes of divergence.
- George reviewed and confirmed all reconciliation recommendations.

**Decided:**
- Build foundation: ~/Developer/manhattanite (existing project) instead of ~/Projects/manhattanite (today's clean shell).
- Trust mechanic: binary at MVP, score system as v2 direction.
- Categories: stick with 2 (Apartments + Furniture). Jobs in v1.5.
- Monetization: pay-per-post only. No paid membership tiers, no business accounts.
- Brand tone: utility-first, dressed in aesthetic vocabulary ("Soho House email serving Gens de Confiance utility"). Trust is the product, not coolness.
- Database: Supabase as primary; Airtable retained for manual application review during seed phase.
- ~/Projects/manhattanite/ to be archived/deleted.

**Blockers / open threads:**
- None blocking. Execution plan is clear and George is unblocked.

**Next:**
- Execute migration via Claude Code (Code tab pointed at ~/Developer/manhattanite/).
- 3 phases: (1) copy docs in, (2) rewrite CLAUDE.md, (3) reconnect git + force-push.
- Then archive ~/Projects/manhattanite/ and verify Vercel.
- Then plan first concrete chunk of Phase 1 (Foundations) — recommendation: migrate from Airtable-waitlist to Supabase + magic-link auth, then build the gating page.

---

## 2026-05-17 (late evening) · Migration executed and pushed

**Worked on:**
- George switched the Code tab from ~/Projects/manhattanite (where it had defaulted) to ~/Developer/manhattanite. Confirmed correct working directory.
- Claude Code copied COMPANY/ + WORK AREAS/ from Cowork workspace into docs/COMPANY/ + docs/work-areas/. Copied STRATEGY.md to docs/COMPANY/strategy-blueprint.md (538 lines, 26,400 bytes, integrity verified). Original STRATEGY.md preserved at repo root pending archival decision.
- Claude Code removed an incidental .DS_Store that snuck in during the copy. Verified .gitignore already covered .DS_Store.
- Claude Code replaced the 1-line stub CLAUDE.md with the synthesized 80-line version. Added @AGENTS.md import + prose pointer to preserve the Next 16 breaking-changes warning. Prepended supersession notice to STATUS.md.
- George approved the multi-file commit (23 files, 4,032 insertions) and the force-push to GitHub.
- Commit 2c8d597 ("Migrate from waitlist project to MVP build foundation") landed on remote main, overwriting the throwaway README-only commit (313b968) that was on the recreated empty GitHub repo. Full local history (7 commits, oldest dc295dc from 2026-04-26) is now mirrored on GitHub.

**Decided:**
- Used plain `git push --force` instead of `--force-with-lease` because local's tracking ref was stale and we knew the remote had nothing worth protecting.
- Original STRATEGY.md at the repo root left untouched for now (one final cleanup decision to make later: delete it or keep it as a "see strategy-blueprint.md" pointer file).

**Blockers / open threads:**
- None blocking. Vercel auto-deploy and the Projects/manhattanite archival are in progress as George finishes the final two manual steps.

**Next:**
- Once George confirms Vercel deployed and Projects/manhattanite is in Trash, Phase 0 is truly closed.
- Phase 1 planning is the next session. Recommended first chunk: scaffold the Account creation flow (Supabase Auth magic link + accounts table + a basic /login + /apply route pair). That's a focused 1-2 hour build that touches every key piece of the stack and produces a visible win.

---

## 2026-05-17 (late evening, post-migration) · Vercel 404 diagnosed and fixed; site live

**Worked on:**
- After the migration push, manhattanite.com returned 404 NOT_FOUND despite Vercel's deployment showing "Ready." Investigated via the Code tab and via Cowork's Claude-in-Chrome MCP.
- Build logs confirmed Next.js produced three routes (`/`, `/_not-found`, `/thank-you`) as static. Yet the deployment's own *.vercel.app URL also 404'd — ruling out a domain attachment issue.
- Diagnosed root cause via Vercel Project Settings → Build and Deployment: **Framework Preset was set to "Other"** instead of "Next.js." This was a leftover from when the Vercel project was recreated earlier today against an empty GitHub repo (Vercel's auto-detection couldn't see Next.js because no code was present at the time).
- Changed Framework Preset from "Other" to "Next.js" and saved. Triggered a Redeploy from the latest commit. Build completed in 25s. Deployment Status: Ready.
- Verified manhattanite.com loads correctly — serving the existing waitlist landing page ("Manhattanite — A better marketplace for Manhattan residents") with the GT Sectra-style wordmark (italic "ite" exactly as specified in brand-guide.md), "Better listings." subtitle, and "APPLY FOR MEMBERSHIP" CTA in letterspaced caps.

**Decided:**
- The existing wordmark on the live site already matches the brand guide direction. No need to design a new one from scratch — the past-George execution was on target.

**Blockers / open threads:**
- **Form submission will fail until environment variables are migrated.** The old Vercel project (deleted earlier today) had RESEND_API_KEY and AIRTABLE_API_KEY set. The new Vercel project doesn't. The page renders fine but `applications@manhattanite.com` emails and Airtable writes won't work. The keys live in `~/Developer/manhattanite/.env.local` and need to be copied into Vercel → Settings → Environment Variables.
- This is a 5-minute task for next session, not blocking anything because the waitlist isn't being actively promoted.

**Next:**
- Confirm Projects/manhattanite/ is archived (George doing in Finder).
- Then: Phase 0 is truly, finally closed.
- Next session opens with two small admin tasks before Phase 1: (1) restore env vars to Vercel, (2) decide whether to keep the existing waitlist landing or replace it with the gating page from voice-and-copy.md as the first Phase 1 chunk.

---

## 2026-05-17 (night) · Folder collapse — Desktop and Developer merged into one

**Worked on:**
- George pushed back on the two-folder split (Desktop = Cowork workspace, Developer = build repo). Honest reconsideration: a single Mac folder for everything is simpler and better suited to an ADHD non-technical founder. Cowork agreed to collapse.
- Drafted a unified CLAUDE.md (outputs/Manhattanite_CLAUDE-md-Unified_v1.md) that serves both Cowork and Claude Code — top half is CoWork OS reading protocol, bottom half is Manhattanite project context.
- Resolved structural decisions: Cowork folders go at the root (matching CoWork OS convention), the `docs/` indirection is eliminated, ABOUT ME is .gitignored (personal data), other Cowork folders are committed.

**Decided:**
- Collapse into single folder at `~/Developer/manhattanite/`.
- `~/Desktop/Manhattanite/` to be archived after verification.
- New unified CLAUDE.md replaces both existing CLAUDE.md files.

**Blockers / open threads:**
- Migration execution pending — three steps in Claude Code (Code tab), one manual Cowork mount switch, one Finder archive.

**Next:**
- Execute the migration via prompts to Claude Code.
- Verify Cowork can read ABOUT ME and COMPANY from the new mount.
- Archive Desktop/Manhattanite.
- After that: Phase 0 truly truly closed. Then env vars + Phase 1 planning.

## 2026-05-17 · Phase 0 fully closed — docs in build repo, CLAUDE.md generated, committed to GitHub

**Worked on:**
- Copied COMPANY/ and WORK AREAS/ from the CoWork workspace (~/Desktop/Manhattanite/) into the build repo at ~/Projects/manhattanite/docs/. Renamed "WORK AREAS" to "work-areas" in transit (no space) for code-tooling friendliness.
- Created a .gitignore for standard Next.js + Mac patterns (node_modules, .next, .env*, .DS_Store, etc.).
- Ran /init in Terminal Claude Code; it generated a strong CLAUDE.md capturing memory protocol, architectural anchors (two-tier model, RLS as load-bearing, single listings table with JSON details, magic link auth), scope discipline, voice conventions, PA boundary.
- Discovered the Claude desktop app has a built-in **Code tab** next to Cowork — switched George's workflow there from Terminal Claude Code for Phase 1 onward (friendlier interface, same engine).
- Hit and resolved a worktree-mode gotcha: the desktop Code tab defaults to git worktree mode, which only sees committed files. Switched a fresh session to non-worktree mode and the docs became visible.
- Verified end-to-end: Code tab reads all the docs correctly + CLAUDE.md.
- Committed and pushed everything to GitHub via the Code tab (Phase 0 work is now backed up + version-controlled).

**Decided:**
- Going forward, George uses the **Code tab in the Claude desktop app** for build work (not Terminal). Cowork for strategy + planning, Code for building. They share context via the docs/ folder inside the build repo.
- Worktree mode in the Code tab is OFF by default for George (less confusing for a non-technical user starting out). Can be re-enabled later when the safety net matters more.
- docs/ in the build repo is a COPY of COMPANY/ + WORK AREAS/ from CoWork workspace. They will drift if updated in only one place. Future sync is a known issue, deferred. If drift becomes annoying, write a small sync script.

**Blockers / open threads:**
- None blocking Phase 1 start. All Phase 0 prep complete.
- Drift between CoWork workspace COMPANY/ and build repo docs/COMPANY/ — to manage manually for now.

**Next:**
- New focused Cowork session to plan Phase 1's first chunk (recommendation: scaffold the Next.js project as the smallest first task).
- Then switch to Code tab to execute that chunk.
- Optional tonight: George may push a quick Next.js scaffold via the Code tab as a small win and a taste of the build flow.

## 2026-05-17 · Phase 0 complete — Claude Code installed and authenticated

**Worked on:**
- Walked George through installing Node.js via nvm (v24.15.0, npm 11.12.1), verifying git (2.54.0), installing Claude Code (`npm install -g @anthropic-ai/claude-code`).
- Created `~/Projects` on George's Mac, cloned `manhattanite` GitHub repo into it (no auth prompt — credentials cached).
- Launched Claude Code in the project folder. Authenticated automatically (existing Max session). Running Opus 4.7 1M context.
- Verified Claude Code can read files in the project folder.

**Decided:**
- Project code lives at `~/Projects/manhattanite` on George's Mac.
- Claude Code = Opus 4.7 / 1M context / Max plan. Strongest available setup.

**Blockers:**
- COMPANY/ folder is in the CoWork workspace (separate folder on George's Mac), not in the cloned git repo. Claude Code currently has no access to it. Needs to be addressed first thing next session.

**Next:**
- Open new session next time.
- Decide how to expose COMPANY/ to Claude Code (recommended: copy into the repo as `docs/`, commit to git).
- Run `/init` in Claude Code to bootstrap a CLAUDE.md for the build repo.
- Begin Phase 1 (Foundations): scaffold Next.js, wire Supabase, build the two-tier auth model.

## 2026-05-17 · Phase 0 setup essentially complete

**Worked on:**
- Walked George through the setup checklist live, step by step.
- Scrapped the old waitlist (no email export needed — he had no real signups).
- Deleted the broken Vercel project that was tied to the deleted GitHub repo. Created a fresh Vercel project from the new (empty) `manhattanite` GitHub repo. Re-attached manhattanite.com.
- Flipped the domain redirect direction: manhattanite.com is now the primary; www.manhattanite.com 308-redirects to it (the cleaner, modern setup).
- Discovered Resend was already verified for manhattanite.com from a previous setup — DNS records still in place, no need to redo.
- George confirmed Supabase, Plausible, Sentry accounts created. Configuration of these happens in Phase 1 with Claude Code.

**Decided:**
- manhattanite.com is the primary, non-www address. 308 permanent redirect from www → non-www.
- Skip Cloudflare entirely. Domain stays at George's existing registrar. Vercel handles SSL automatically.
- Resend reuse: no need to re-add domain or DNS records — they're domain-level and unchanged.

**Blockers:**
- Claude Code not yet installed on George's Mac. This is the last gate before Phase 1.

**Next:**
- Decision point: install Claude Code immediately and start build, OR pause here and reconvene later for installation.
- Whenever Claude Code is installed: begin Phase 1 (Foundations) — auth, profiles, two-tier model wiring.

## 2026-05-16 · Project kicked off, setup phase begun

**Worked on:**
- Created the project folder.
- Drafted the setup checklist (outputs/Manhattanite_Setup-Checklist_v1.md).
- Decided to drop Cloudflare from the immediate stack to reduce setup overhead. Current registrar stays. SSL via Vercel.
- Decided to delete the existing GitHub `manhattanite` repo and start fresh.
- Email addresses confirmed: `george@manhattanite.com` + `info@manhattanite.com`.

**Decided:**
- Pre-build action order: export waitlist → scrap waitlist → repoint DNS → fresh repo → service accounts → email config → ready for build.

**Blockers:**
- Need registrar name from George for exact DNS instructions.
- Need waitlist platform name from George for export instructions.

**Next:**
- Walk through Step 1 (export waitlist emails) with George.

---

*Entry format: date · short title, then sections for Worked on / Decided / Blockers / Next.*
