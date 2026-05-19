# Project Memory — MVP Build

Chronological log. Newest entries at the top.

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
