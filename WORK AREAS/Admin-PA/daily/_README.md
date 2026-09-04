# Daily State Files (Manhattanite PA)

This folder is the **shared canonical record** for the morning briefing and evening summary scheduled tasks. Both read from and write to the file for the current date.

Mirrors the same pattern used in the Life Cowork workspace (`~/Documents/Claude/Claude Cowork USE THIS/CoWork-OS-Beta-1.4/WORK AREAS/Admin-PA/daily/`), ported on 2026-06-02 so the Manhattanite PA has the same plan-vs-reality memory the Life PA has.

## File per day

Each day gets one file: `YYYY-MM-DD.md`. Append-only within the day.

## Structure

```
# Daily State — [Weekday], [Month] [Day], [Year]

## Plan (written by morning brief at HH:MM)

### Schedule check (week N of 14, must-hit, status)
### Standing daily habits
### Today's time-blocked schedule
### Top 3 priorities
### Manhattanite build state
### Heads up
### Cross-life [Life]   (only if present)

---

## Wrap (written by evening summary at HH:MM)

### What actually shifted vs. the plan
### What got done today
### What happened in email today — material items
### Items still open / parked

---

## Tomorrow's setup — [Weekday], [Month] [Day]

### Calendar (sketch shape of the day)
### Flags for tomorrow
### Single most important thing for tomorrow

---

## Reflection

(Only when reflection prompt runs interactively. Otherwise note: "Reflection will not run — automated EOD with George not present.")

---

## Run note

One-paragraph audit trail at the bottom: what sources the EOD read, anything notable about the run itself, captain's-log silence streak if applicable.
```

## How the two scheduled tasks use this folder

**pa-morning-briefing (08:00)**
1. Reads YESTERDAY's file — specifically the Wrap, Tomorrow's-setup, and Reflection sections.
2. Uses anything George flagged "do differently tomorrow" or that was in "Tomorrow's setup" to inform today's plan.
3. If yesterday's "Tomorrow's setup" sketched today, treats that as the source of truth — refreshing times against the live calendar pull but preserving structural choices, top 3, and heads-up.
4. Writes TODAY's Plan section to `daily/[today].md`.
5. Also appends `**08:00** — Morning briefing ran.` to today's captain's log.

**evening-summary (20:00)**
1. Reads TODAY's file — specifically the Plan section that was written this morning.
2. Compares planned items to what actually happened (captain's log, tasks.md, output-log.md, calendar, email).
3. Writes Wrap + Tomorrow's-setup + (optional) Reflection sections to the same file.
4. Surfaces "single most important thing for tomorrow" so the next morning brief has a hand-off.

## Plans drafted in chat the night before

Standing pattern (ported from Life PA):

> When George walks through tomorrow's plan in chat the night before, write it to `daily/[tomorrow].md` as a `## Plan (drafted in chat HH:MM)` section immediately. The morning brief picks it up at 08:00, refreshes times against the live calendar, preserves George's structural choices, and only rebuilds from scratch if no draft exists.

## Why this exists

Before this folder, the morning brief and the evening summary worked from different inputs and produced isolated outputs. The morning would build a plan; the EOD would write a summary with no awareness of what was planned. This folder is the bridge: a single canonical record both tasks share, so the system can do meaningful plan-vs-reality comparison and carry intent from one day to the next.

Same purpose as the Life PA's daily folder. Two workspaces, same pattern.
