# Preferences

Standing decisions and behaviours George has expressed about how he works. The PA reads this every morning briefing and applies these as background defaults. Append new entries when George states a preference — don't rewrite existing ones.

**Split note (2026-06-02):** This file holds **Manhattanite-specific PA behaviour only** (briefing rules, content/voice defaults, build-task tagging, Manhattanite working preferences). The **canonical source for scheduling templates, calendar conventions, and life rules** is the Life workspace at:

`/Users/georgegardner/Documents/Claude/Claude Cowork USE THIS/CoWork-OS-Beta-1.4/WORK AREAS/Admin-PA/preferences.md`

Both the morning briefing and the evening summary scheduled tasks read both files. Anything to do with the daily weekday template, weekend rules, Perry Street override, NANM, calendar colours, flight banners, or the 80/20 lens lives in the Life file. Don't duplicate those here.

Format:

```
### YYYY-MM-DD — Short title
Category: Working style | Tool | Time | Boundary | Habit | Other

[1-3 sentences. What's the preference and why it matters.]
```

---

## Log

### 2026-05-18 — Anticipate aggressively
Category: Working style

George wants the PA to surface things proactively rather than wait to be asked. Daily morning briefings, EOD summaries, meeting prep before meetings, decisions being avoided. Drafts everything, sends nothing without approval.

### 2026-05-18 — Always report schedule status in briefings
Category: Working style

Both the morning briefing and the EOD summary must include a Schedule check. Source of truth: `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_MVP-Timeline_v2.md` (v2 supersedes v1 as of 2026-05-27). The PA reads this every run, finds the current week (the one whose date range contains today), and reports: Week N of 14, the must-hit, and whether George is **ahead / on track / behind by X days**. On Sundays (end of week), the EOD does a full retro: did we hit the must-hit, and if not, slip-vs-buffer decision. The status comparison reads project memory for actual progress. If the timeline file moves, update this preference.

### 2026-05-18 — Cross-folder context
Category: Working style

The PA in the Manhattanite workspace should also pull in context from George's other Cowork workspace folders on his Mac (paths pending). The aim is "full picture of life" rather than just Manhattanite.

### 2026-05-15 — British English (system files), American (Manhattanite product)
Category: Working style

George prefers British English spelling (organise, colour, programme) for system files, drafts, and conversation. **Exception:** Manhattanite product and marketing copy uses American spelling throughout — Manhattanite is a New York brand. The voice-and-copy.md in COMPANY/ is the source of truth for product copy.

### 2026-05-15 — Format defaults
Category: Working style

Direct, no fluff. Short paragraphs (2-4 sentences). Headings only when they help navigation, not for visual weight. Bullets for genuine lists. Prose for arguments. Never end with "let me know if you need anything else." Lead with the punchline.

### 2026-05-15 — One question at a time
Category: Working style

When clarification is needed, ask one thing. Don't stack multiple questions in a single message.

### 2026-05-15 — ADHD-aware defaults
Category: Working style

Surface, don't bury. One next action when George is stuck. Time-box (25/45/90 minute blocks). Capture commitments to tasks.md without asking. Permission to drop tasks stale 2+ weeks. No guilt loops.

### 2026-05-27 — Design is intentionally iterative
Category: Working style

George expects Manhattanite's visual design and look-and-feel to change a lot as the build progresses, and wants the approach to stay open to that throughout. Don't treat any visual decision as locked. Build on design tokens + shared components (set in the Phase 1.5 Design Foundation) so look changes are cheap and propagate site-wide from one place. Keep the plumbing (auth, trust wall, DB) stable underneath; restyle freely on top. Heavy bespoke design stays in Phase 5, but the door to revisiting it is always open.

### 2026-05-27 — Always flag Claude Code vs Cowork tasks
Category: Working style

For every task surfaced, recommended, or planned, explicitly mark where it should be done: **[Claude Code]** (anything that touches the codebase — files in app/, lib/, etc., schema migrations, npm/git, deploys, building features in the Next.js repo) or **[Cowork]** (strategy, planning, writing, research, brand/voice, timeline, memory and decision logs, Notion, email, calendar, PA work, briefs that feed into a build session). The Code tab is for building; Cowork is for everything else. Never leave George guessing which app a task belongs in. When listing multi-step plans, tag each step.

### 2026-05-28 — Include Todoist items in morning briefings
Category: Working style

Every morning briefing must pull current Todoist tasks via the Todoist MCP and merge them into the briefing. Treat Todoist as a primary task source alongside `tasks.md`. Items due today belong in "Today's time-blocked schedule" (slot them where they fit) and "Top 3 priorities". Items overdue belong in "Heads up". Apply the same [Claude Code] vs [Cowork] tagging. Use Todoist's own priority levels (p1 highest) when ranking.
