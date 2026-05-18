# Captain's Log — Format Specification

## Purpose

The captain's log is the single input stream for the Personal Assistant. Everything the user tells you in conversational mode gets captured here. Activity, reflections, quick thoughts, meeting notes — all in one place.

The user doesn't need to think about where things go. They talk. You log. The structuring happens downstream (task extraction, contact updates, preference capture).

## File Location and Rotation

- **Path:** `WORK AREAS/Admin-PA/captains-log/YYYY-MM-captains-log.md`
- **Rotation:** Monthly. Start a new file on the 1st of each month.
- **Naming:** `2026-04-captains-log.md`, `2026-05-captains-log.md`, etc.

Monthly rotation keeps files manageable. After 3 months of daily use, a single file would be too long for reliable context loading. Monthly files stay under a few hundred lines each.

## Entry Format

```markdown
## [Day of week], [Date]

### [HH:MM]
[Entry content — natural language, as close to what the user said as possible]

### [HH:MM]
[Next entry]
```

### Example

```markdown
## Wednesday, 9 April 2026

### 09:15
Had a call with Bhav about potential collaboration. She's fractional ops, works with 3 clients max. Interested in helping coordinate the course launch. Need to send her a project scope by Friday.

### 11:30
Finished scripting the CoWork OS video. Ready for filming tomorrow. Need to remind Elle to prep the thumbnail brief.

### 14:00
Accountant needs last quarter's receipts by Friday. Check the Accounts folder in iCloud.

### 16:45
Quick thought: should we add a "starter projects" section to the onboarding flow? Users seem to struggle with knowing what to do first after setup.

### 18:00 — Reflection
**What went well:** Scripting session was really productive. Got the whole thing done in one sitting.
**What felt harder than it should:** Couldn't find the receipts. Filing system needs work.
**Remember:** Consider adding a file organisation skill to CoWork OS — might be useful for other users too.
```

## What Gets Logged

Everything conversational that isn't part of a specific project task. Rules of thumb:

- "Had a call with Sarah about the Q3 launch" → log it
- "Create a LinkedIn post about AI tools" → this is a project task, not a log entry (though you might note in the log that the task was started)
- "Feeling overwhelmed today, too many things on the plate" → log it (this is valuable reflection data)
- "Remind me to follow up with the accountant on Friday" → log it AND create a task
- "I've decided to go with Teachable for the course" → log it AND add to preferences

## Reflection Entries

Reflections prompted during the end-of-day summary get a special format:

```markdown
### [HH:MM] — Reflection
**What went well:** [response]
**What felt harder than it should:** [response]
**Remember:** [response]
```

The "Reflection" label makes these entries easy to find during System Reviews. The "What felt harder than it should" question is specifically designed to surface automation and improvement opportunities.
