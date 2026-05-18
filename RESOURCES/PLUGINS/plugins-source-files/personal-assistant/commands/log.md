---
name: log
description: Quick captain's log entry — capture what's happening right now
---

# /log — Quick Captain's Log Entry

The user wants to make a quick log entry. Don't ask clarifying questions — just log what they say.

1. Read the current month's captain's log file from `WORK AREAS/Admin-PA/captains-log/`. If it doesn't exist for this month, create it.
2. Append a new timestamped entry with the current time.
3. Scan the entry for action items, contact mentions, and preference signals. If found:
   - Add tasks to `WORK AREAS/Admin-PA/tasks.md`
   - Update `WORK AREAS/Admin-PA/contacts.md` if people are mentioned with context
   - Log preferences to `WORK AREAS/Admin-PA/preferences.md` if applicable
4. Confirm briefly: "Logged. [One-line summary of what was captured, e.g. 'Task added: send scope to Bhav by Friday.']"

Keep confirmation to one line. The user chose /log because they want speed, not conversation.

If the user typed `/log` with no message after it, use AskUserQuestion to ask: "What's happening?" with a freeform text input.
