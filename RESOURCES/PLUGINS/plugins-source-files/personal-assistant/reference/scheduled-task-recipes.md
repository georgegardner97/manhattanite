# Scheduled Task Recipes

## About Scheduled Tasks in CoWork

Scheduled tasks are automated prompts that run on a schedule. They're created using CoWork's `schedule` skill and can run daily, weekly, or on custom intervals. Each scheduled task is essentially a saved prompt that Claude executes at the specified time.

The PA plugin creates two scheduled tasks during setup. These recipes define what those tasks do.

## Daily Briefing Recipe

**Name:** PA — Daily Briefing
**Schedule:** Daily, morning (user's preferred time, default 8:00 AM)
**Prompt:**

```
Run my morning briefing using the Personal Assistant plugin's daily-briefing skill. Read these sources:

1. Today's calendar events (if Google Calendar is connected)
2. WORK AREAS/Admin-PA/tasks.md — overdue tasks and tasks due today
3. Yesterday's captain's log from WORK AREAS/Admin-PA/captains-log/
4. Any tasks in "Waiting" status with follow-up dates that are today or past

Produce a clear morning briefing following the format in the daily-briefing skill. Keep it scannable — I want to know what needs my attention in under 30 seconds of reading.
```

## End-of-Day Summary Recipe

**Name:** PA — End-of-Day Summary
**Schedule:** Daily, evening (user's preferred time, default 6:00 PM)
**Prompt:**

```
Run my end-of-day summary using the Personal Assistant plugin's daily-briefing skill. Read these sources:

1. Today's captain's log from WORK AREAS/Admin-PA/captains-log/
2. WORK AREAS/Admin-PA/tasks.md — what was completed today, what's still open
3. WORK AREAS/Admin-PA/output-log.md — files created today
4. Tomorrow's calendar events (if Google Calendar is connected) and tasks due tomorrow

Produce the end-of-day summary, then offer the reflection prompt. If I want to reflect, walk me through the three questions and log my answers in the captain's log.
```

## Recommending New Scheduled Tasks

Part of the PA's value is spotting patterns that could become automated. When reviewing captain's log entries or during System Review, look for:

- **Repeated manual checks:** "I checked the inbox again" appearing 3+ times → suggest an inbox triage scheduled task
- **Regular reports:** User produces the same type of output weekly → suggest automating the data gathering
- **Recurring reminders:** User keeps logging "need to remember to..." for the same type of thing → suggest a scheduled reminder

When you spot a pattern, mention it naturally: "I've noticed you check [thing] most mornings. Want me to set up a scheduled task that does this automatically?" If the user says yes, use the `schedule` skill to create it.
