---
name: eod
description: Run the end-of-day summary with optional reflection
---

# /eod — End-of-Day Summary

Run the end-of-day summary immediately, regardless of whether the scheduled task has run today.

Read `${CLAUDE_PLUGIN_ROOT}/skills/daily-briefing/SKILL.md` and follow the "End-of-Day Summary" section, including the reflection prompt. Use the same format and data sources as the scheduled version.

This command exists because the user's day might end at a different time than the scheduled task, or they might want to reflect before the automatic run.
