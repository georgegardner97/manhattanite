# Project Memory — MVP Build

Chronological log. Newest entries at the top.

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
