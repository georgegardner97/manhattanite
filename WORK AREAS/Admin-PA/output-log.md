# Output Log

One-line entries for every file saved to any `outputs/` folder across the workspace. Used by the EOD summary to report what got produced today.

Format:

```
- **YYYY-MM-DD HH:MM** — `path/to/file.ext` (project: …) — short note
```

Append-only. Most recent at the bottom.

---

- **2026-05-18 [time]** — `WORK AREAS/Admin-PA/manhattanite-pa-config.md` (project: Admin-PA) — PA configuration for Manhattanite workspace (cross-folder map, calendar permissions, proactive rules).
- **2026-05-18 [time]** — `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_MVP-Timeline_v1.md` (project: mvp-build) — 14-week realistic work timeline from today to end-of-August MVP soft launch. Phased: foundation → membership → listings → identity → hardening → pre-launch → soft launch. One must-hit per week, buffer week at end.
- **2026-05-27** — `WORK AREAS/Product/mvp-build-project/outputs/Slice2-Auth_Build-Plan_v1.md` (project: mvp-build) — Time-boxed 2-hour build plan for Phase 1 Slice 2 (revised to email+password + reset flow): accounts table + RLS, signup/login/profile, reset flow, deploy. Includes fallback cut-order. Also copied into Notion → Manhattanite → Daily Plan.
- **2026-05-27** — `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_MVP-Timeline_v2.md` (project: mvp-build) — Full re-anchored timeline (now → end-Aug soft launch). Supersedes v1. Reflects Supabase-done, password auth, and a new lightweight Design Foundation slot (Phase 1.5) before listings. Flags the buffer trade-off.
- **2026-06-01** — `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Homepage-Copy_v2.md` (project: mvp-build) — Trust-first / utility-leading homepage replacement copy. Full page: hero, three-pillar promise, two-tier mechanic, categories, sponsorship, founding cohort, footer. Parked for ship until Phase 1+early Phase 2 give it real proof. Drafted in parallel while Slice 2 (auth) was running.
- **2026-06-01** — `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Seed-Listings_v1.md` (project: mvp-build) — 12 apartment + 15 furniture example listings in locked voice, clearly tagged `[EXAMPLE]`. Real streets, real brands, honest about wear. Ready to seed into the `listings` table when it ships in Phase 2. Drafted in parallel with Slice 2.

- **2026-06-08** — `WORK AREAS/Product/mvp-build-project/outputs/Apply-Route_Plan_v1.md` (project: mvp-build) — three-slice sketch for the /apply flow (A: form+row, B: approve, C: emails).
- **2026-06-08** — `WORK AREAS/Product/mvp-build-project/outputs/Apply-Route_Slice-A-Build-Plan_v1.md` (project: mvp-build) — full hand-to-Claude-Code build plan for Slice A (migration 0007 + submit rewrite + /apply route).
- **2026-06-08 23:38** — `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Apply-Emails_v1.md` (project: mvp-build) — Slice C send-ready copy for the three membership emails (applicant confirmation, reviewer ping with embedded approve/decline SQL, "You're in" welcome). No decline email at seed (locked). Passed the five-point voice test. Cowork copy lane; Claude Code build lane still owed.
- **2026-06-08 23:45** — `WORK AREAS/Product/mvp-build-project/outputs/Apply-Route_Slice-C-Build-Plan_v1.md` (project: mvp-build) — full hand-to-Claude-Code build plan for Slice C: `lib/applications/emails.ts` (3 sends), wire confirmation+ping into `submit.ts`, `scripts/approve-application.ts` (npm run approve → fires welcome). Flags the one open decision (CLI script vs pure-SQL approval) + the new `.env.local` secret prerequisite. Test loop + commit included.
- **2026-06-08 23:50** — `WORK AREAS/Product/mvp-build-project/outputs/Apply-Route_Slice-C_Claude-Code-Prompt_v1.md` (project: mvp-build) — copy-paste Claude Code hand-off prompt for the Slice C build (Option A / CLI approval script chosen). George pastes into the Code tab; includes the .env.local secret step, prod test loop, and two commit messages.
- 2026-06-09 · Manhattanite_Walkthrough-Findings_v1.md · mvp-build-project/outputs · live-site walkthrough punch list (nav, contact, signup-name, GDC strategic decisions)
- 2026-06-09 · Navigation-Slice_Build-Plan_v1.md · mvp-build-project/outputs · nav slice file-by-file plan
- 2026-06-09 · Navigation-Slice_Claude-Code-Prompt_v1.md · mvp-build-project/outputs · nav slice Claude Code hand-off prompt
- 2026-06-09 · Contact-Slice_Build-Plan_v1.md · mvp-build-project/outputs · contact slice file-by-file plan
- 2026-06-09 · Contact-Slice_Claude-Code-Prompt_v1.md · mvp-build-project/outputs · contact slice Claude Code hand-off prompt

- 2026-06-09 | Manhattanite_Legal-Roadmap_v1.md | Legal/company-formation-project | Pre-launch legal action plan (entity, Terms/Privacy, fair housing)
- 2026-06-09 | Manhattanite_Attorney-Brief_v1.md | Legal/company-formation-project | One-page brief to send to startup counsel for a fixed-fee quote
- 2026-06-09 | Manhattanite_Attorney-Brief_v2.md | Legal/company-formation-project | Attorney brief rewritten in natural email voice; Gens de Confiance reference removed
- 2026-07-13 · Founding-Members_Pitch-Cards_v1.md · Growth/founding-member-acquisition-project — per-type pitch cards (spine + swap system)
- 2026-07-13 · Founding-Members_Pitch-Cards_v1.pdf · Growth/founding-member-acquisition-project — printable pitch cards (generator: generators/generate_pitch_cards_pdf.py)
- 2026-07-13 · Manhattanite_Company-Briefing_v1.pdf · Growth/founding-member-acquisition-project — founder's briefing: model, plan, finances, legal, hard Q&A (generator: generators/generate_company_briefing_pdf.py)
- 2026-08-27 · Manhattanite_Pricing-Model_v1.md · WORK AREAS/Product/monetization-project/outputs/ · pricing analysis: comparators, unit economics, revenue by member count
- 2026-08-31 — `Manhattanite_MVP-Timeline_v3.md` (Product / mvp-build-project/outputs) — the recut: five weeks, 1 Sep to 4 Oct, first invite wave in week 2.
- 2026-08-31 — `Manhattanite_Vouched-Copy-Pass_Claude-Code-Prompt_v1.md` (Product / mvp-build-project/outputs) — build, verify, commit, push and prod-check today's two copy changes.
