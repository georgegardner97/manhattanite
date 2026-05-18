---
name: daily-briefing
description: >
  Generates the daily morning briefing or end-of-day summary. Triggers when the user
  asks "what's on my plate today", "give me my briefing", "morning briefing",
  "end of day", "what did I do today", "daily summary", "EOD summary", or when a
  scheduled task runs the daily briefing or end-of-day prompt. Also triggers on
  /briefing and /eod commands.
version: 1.0.0
---

# Daily Briefing & End-of-Day Summary

This skill generates two types of briefing from the user's PA data.

## Morning Briefing

Read the following sources and synthesise into a clear, scannable briefing:

1. **Calendar** — If Google Calendar is connected, read today's events. List them with times. If not connected, skip this section (don't mention it's missing).

2. **Overdue tasks** — Read `WORK AREAS/Admin-PA/tasks.md`. Any tasks with a past due date that are still "Open" go here. This is the most important section — flag it clearly.

3. **Due today** — Tasks due today from the same file.

4. **Follow-up reminders** — Any tasks in "Waiting" status where the follow-up date is today or past.

5. **Yesterday's highlights** — Read yesterday's entries from the captain's log (find the current month's file in `WORK AREAS/Admin-PA/captains-log/`). Pull out the 3-5 most significant items — meetings, decisions, completed tasks, important conversations.

6. **Upcoming** — Any tasks due in the next 3 days, just as a heads-up.

### Briefing Format

Keep it tight. No walls of text. Use this structure:

```
## Morning Briefing — [Day, Date]

### Overdue (needs attention)
[Items, or "Nothing overdue — you're clear."]

### Today
[Calendar events + tasks due today, merged into a timeline if possible]

### Waiting on others
[Follow-ups due, or "Nothing pending."]

### Yesterday's highlights
[3-5 bullet points from the captain's log]

### Coming up (next 3 days)
[Brief list, or "Nothing scheduled."]
```

If there's nothing in a section, include it with a positive note ("Nothing overdue — you're clear") rather than omitting it. The user should see the full picture every time.

## End-of-Day Summary

Read the following and produce the summary:

1. **Today's captain's log** — Everything logged today. This is the primary source.

2. **Task changes** — What moved to "Done" today? What new tasks were created? What's still open?

3. **Output log** — Read `WORK AREAS/Admin-PA/output-log.md` for files created today.

4. **Tomorrow preview** — Any tasks due tomorrow or calendar events.

### EOD Format

```
## End of Day — [Day, Date]

### What got done
[Completed tasks + key activities from the log]

### What you created
[Files from output log, or "No files created today."]

### Still open
[Remaining open tasks, briefly]

### Tomorrow
[Preview of tomorrow's commitments, or "Nothing scheduled yet."]
```

### Reflection Prompt

After presenting the EOD summary, offer a reflection:

"Want to take a minute to reflect on the day?"

If yes, ask these three questions one at a time using AskUserQuestion (with a freeform text option):

1. "What went well today?"
2. "What felt harder than it should have?"
3. "Anything you'd do differently or want to remember?"

Log the reflection in today's captain's log under a `### Reflection` heading with the timestamp. These reflections are valuable data — the System Review will scan them for patterns, recurring frustrations, preference signals, and automation opportunities.

If the user declines, move on without comment. Don't make them feel bad about skipping.

## Handling Missing Data

If the PA was just set up and there's no data yet, don't produce an empty briefing. Instead say something like: "Your PA is fresh — there's nothing to brief on yet. Start logging throughout the day and tomorrow's briefing will have something to work with."
