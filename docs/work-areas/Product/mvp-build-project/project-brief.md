# Project Brief — MVP Build

## Goal

Ship a working seed-phase MVP of Manhattanite by end of August 2026 (~14 weeks from 2026-05-16). Show-able, not publicly launched.

## Scope reference

Source of truth: `COMPANY/mvp-spec.md`. Scope, timeline, OUT-cuts, success criteria all live there.

## Tech reference

Source of truth: `COMPANY/tech-architecture.md`. Stack: Next.js + Vercel + Supabase + Resend + Plausible + Sentry + GitHub. ~$10/month all-in.

## Phases

| Phase | Weeks | Goal |
|---|---|---|
| 0. Setup (this phase) | Pre-build | Account creation, domain pointed at Vercel, repo ready |
| 1. Foundations | 1–3 | Auth, profiles, two-tier model wired |
| 2. Apartments | 4–8 | Apartment listings: post, browse, contact form |
| 3. Furniture | 9–11 | Furniture listings: same pattern, second category |
| 4. Polish + seed | 12–14 | Brand, example data, application flow stress-test |

## Current status

Phase 0 — Setup. **Re-opened on 2026-05-17 after discovering existing project at ~/Developer/manhattanite.** Migrating COMPANY/ docs and CLAUDE.md into the existing build foundation. After this migration, ready for Phase 1 (Foundations).

## Active work items

- [x] ~~Export waitlist emails~~ — no signups to export
- [x] Scrap the current waitlist site
- [x] manhattanite.com pointed at Vercel (was already; we rebuilt the project)
- [x] Delete old GitHub repo, create fresh one
- [x] Sign up: Supabase, Resend (already done), Plausible, Sentry
- [x] Configure email-from addresses
- [x] Set up domain redirect (manhattanite.com primary; www → non-www, 308)
- [x] Resend domain verification (already done from prior setup)
- [x] Install Claude Code on George's Mac (v2.1.143, Opus 4.7 1M context, Max plan)
- [x] Clone repo to ~/Projects/manhattanite on George's Mac
- [x] Decided how COMPANY/ context flows into Claude Code (copy into docs/ folder)
- [x] Discovered existing project at ~/Developer/manhattanite with substantive prior work
- [x] Reconciled prior STRATEGY.md with new COMPANY/ docs (see outputs/Manhattanite_Strategy-Reconciliation_v1.md)
- [x] Synthesized strategic position confirmed: utility-first, binary mechanic at MVP, 2-category launch, pay-per-post only, Supabase + retained Airtable for seed review
- [ ] Migrate COMPANY/ + work-areas/ into ~/Developer/manhattanite/docs/
- [ ] Add STRATEGY.md to docs/COMPANY/ as strategy-blueprint.md
- [ ] Rewrite CLAUDE.md in ~/Developer/manhattanite/ to reflect synthesis
- [ ] Reconnect ~/Developer/manhattanite/ git to new GitHub repo; force-push history
- [ ] Verify Vercel auto-deploys after push
- [ ] Archive/delete ~/Projects/manhattanite/ (no longer needed)
- [ ] Confirm preview-then-promote deploy flow with George (deferred until first real build)

Detailed checklist in `outputs/Manhattanite_Setup-Checklist_v1.md`.

## Blockers / open threads

- George needs to share which registrar manhattanite.com is on (for exact DNS steps)
- George needs to share which platform the current waitlist runs on (for export instructions)

## Decisions specific to this project

- Drop Cloudflare from the stack for now: domain stays at current registrar, DNS managed there, SSL handled by Vercel automatically. Simpler than transferring. Reversible.
- Old GitHub repo: delete entirely, start fresh with same name `manhattanite`.
- Email-from addresses: `george@manhattanite.com` (personal review) + `info@manhattanite.com` (system / member-facing). George's choice.
- Deploy flow: preview-then-promote (manual) during seed phase. Auto-deploy considered post-Cohort-1.

## Next session

Walk George through the setup checklist live, one item at a time.

---

*Created 2026-05-16.*
