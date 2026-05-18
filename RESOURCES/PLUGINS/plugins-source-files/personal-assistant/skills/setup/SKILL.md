---
name: pa-setup
description: >
  This skill runs when the Personal Assistant plugin is first installed. It sets up
  the captain's log, task tracker, contacts register, preferences journal, output log,
  scheduled tasks, and CLAUDE.md additions. Also triggers when the user says "set up
  my personal assistant", "activate the PA", "set up Admin-PA", or "I want to use my
  personal assistant." Do not trigger if the PA is already set up (check for the
  existence of WORK AREAS/Admin-PA/captains-log/).
version: 1.0.0
---

# Personal Assistant — Setup Wizard

You are setting up the Personal Assistant for the first time. This is an interactive setup that creates the file structure, scheduled tasks, and CLAUDE.md additions needed for the PA to work.

The goal is to get the user from "I just installed this plugin" to "I'm logging my first entry" in under 3 minutes. Keep it warm, clear, and fast.

## Before You Start

Check whether the PA has already been set up by looking for `WORK AREAS/Admin-PA/captains-log/`. If that folder exists, the PA is already configured. Tell the user: "Your Personal Assistant is already set up. You can start using it right away — just tell me about your day, or try one of the slash commands like /log or /tasks."

## Setup Flow

### Step 1: Welcome

Explain what the Personal Assistant does in 3-4 sentences. Keep it plain English, no jargon:

"This turns me into your personal assistant. Throughout the day, you can just talk to me about what's happening — calls you've had, tasks you need to do, people you've spoken to — and I'll organise everything behind the scenes. I'll track your tasks, remember your contacts, log your preferences, and give you a morning briefing and end-of-day summary."

Use AskUserQuestion to confirm they want to proceed:
- "Let's set it up" (default)
- "Tell me more first"

If they want more detail, explain the components briefly (captain's log, task tracking, contacts, preferences, daily briefing, end-of-day summary, output tracking) and then ask again.

### Step 2: Create the File Structure

Create these files and folders inside `WORK AREAS/Admin-PA/`:

```
WORK AREAS/Admin-PA/
├── captains-log/
│   └── [current-year]-[current-month]-captains-log.md
├── tasks.md
├── contacts.md
├── preferences.md
└── output-log.md
```

**Captain's Log file** — use the current year and month. Start with:

```markdown
# Captain's Log — [Month Year]

This is your daily running log. Just talk to me throughout the day and I'll capture everything here.

---
```

**tasks.md:**

```markdown
# Tasks

Active tasks extracted from your captain's log and conversations. Updated automatically.

## Open

*No tasks yet. As you tell me about things you need to do, they'll appear here.*

## Waiting

*Tasks where you're waiting on someone else.*

## Done (recent)

*Recently completed tasks. Older completions are archived monthly.*
```

**contacts.md:**

```markdown
# Contacts

People mentioned in your conversations, with context and relationship notes. Updated automatically when you talk about someone.

*No contacts yet. As you mention people in conversation, they'll appear here with context and notes.*

---

<!-- Entry format:
## [Name]
- **Context:** How you know them / their role
- **Last mentioned:** [date]
- **Notes:** Key details from conversations
- **Follow-ups:** Any pending actions involving them
-->
```

**preferences.md:**

```markdown
# Preferences & Decisions

Personal preferences and decisions captured from your conversations. These help me serve you better over time and may be promoted to your About Me files during System Reviews.

*No preferences captured yet. When you mention things like "I prefer morning meetings" or "I've decided to use Teachable for the course," they'll be logged here.*

---

<!-- Entry format:
- **[date]:** [preference or decision] — Source: [captain's log / conversation]
-->
```

**output-log.md:**

```markdown
# Output Log

Files and deliverables created during your sessions. Updated automatically.

---

<!-- Entry format:
- **[date] [time]:** [filename] — [project/context]
-->
```

Tell the user: "I've created your PA file structure inside Admin-PA. All your logs, tasks, contacts, and preferences will live here."

### Step 2b: Import Existing Data (optional)

After creating the file structure, offer to import existing contacts and tasks. This is optional but saves users from starting with empty files when they already have data elsewhere.

Use AskUserQuestion: "Do you have existing contacts or tasks you'd like to bring in? This gives your PA a head start instead of building up from scratch."

Offer options:
- "Yes, I have a spreadsheet or CSV with contacts"
- "Yes, I have tasks in Notion I'd like to bring across"
- "Yes, I have both"
- "No, I'll start fresh"

**If they have a spreadsheet/CSV of contacts:**
Tell them: "Drop your CSV or Excel file into this chat. I'll read it and populate your contacts register. It doesn't need to be perfectly formatted — I can work with most common layouts (name, email, company, notes, etc.). I'll show you what I've found before saving anything."

Read the uploaded file, identify columns that map to contact fields (name, context/company, email, notes), and populate `contacts.md` with entries for each row. Present a summary: "I found [X] contacts. Here's a sample of how they'll look: [show 2-3 examples]. Want me to save all of them?"

**If they have tasks in Notion:**
Check if the Notion connector is available. If yes: "Point me to the Notion database or page where your tasks live — you can share the name or URL and I'll pull them in." Read the Notion database, extract task items, and populate `tasks.md`. Each task should be linked to the most appropriate work area based on its content.

If Notion isn't connected: "You'll need to connect Notion first — it's in CoWork's settings under connectors, takes about 30 seconds. Want to do that now, or skip the import and add tasks as you go?"

**If they have both:** Do contacts first, then tasks. Two separate imports feel less overwhelming than one big one.

**If they want to start fresh:** Move on. No friction. "No problem — your PA will build up your contacts and tasks naturally as you use it."

**Other import paths worth mentioning (briefly, don't overwhelm):**
- "If you have contacts in Google Contacts or your phone, you can export them as a CSV and drop it in anytime."
- "If your tasks are in a different tool, you can usually export to CSV from the settings. I can handle most formats."

The point of this step is to make it obvious that importing is easy and available, without making the user feel like they *have* to do it right now.

### Step 3: Set Up Scheduled Tasks

Use the `schedule` skill to create two scheduled tasks:

**Daily Briefing** — runs each morning (suggest 8:00 AM, ask user for preferred time):

Task prompt: "Run my daily briefing. Read today's calendar events (if Google Calendar is connected), check WORK AREAS/Admin-PA/tasks.md for overdue and due-today tasks, read yesterday's captain's log highlights from WORK AREAS/Admin-PA/captains-log/, and produce a clear morning briefing. Format: what's on today, what's overdue, any follow-up reminders, and a quick note about what was happening yesterday."

**End-of-Day Summary** — runs each evening (suggest 6:00 PM, ask user for preferred time):

Task prompt: "Run my end-of-day summary. Read today's captain's log from WORK AREAS/Admin-PA/captains-log/, check WORK AREAS/Admin-PA/tasks.md for what was completed and what's still open, read WORK AREAS/Admin-PA/output-log.md for what was created today, and produce an end-of-day summary. After the summary, offer a short reflection prompt: ask 'Want to reflect on how today went?' If yes, ask: (1) What went well today? (2) What felt harder than it should have? (3) Anything you'd do differently? Log the reflection in today's captain's log entry."

Use AskUserQuestion to confirm the times for each.

### Step 4: Update CLAUDE.md

Append the following block to the user's CLAUDE.md file. Place it before the personalisation sections (before `## WHO I AM` or equivalent), as a new section:

```markdown
## PERSONAL ASSISTANT

The Personal Assistant plugin is active. These behaviours apply across all sessions:

- **Captain's Log:** When the user is chatting conversationally (not working on a specific project task), treat it as captain's log input. Append timestamped entries to the current month's log file in `WORK AREAS/Admin-PA/captains-log/`. Create a new monthly file on the 1st of each month.
- **Task extraction:** When conversation contains action items ("need to", "should", "have to", "follow up", "remind me", "don't forget"), create or update entries in `WORK AREAS/Admin-PA/tasks.md`. Include the source and link each task to a work area or project. If no area is obvious, default to Admin-PA.
- **Contact tracking:** When people are mentioned by name with context, update `WORK AREAS/Admin-PA/contacts.md` with their details and the interaction date.
- **Preference capture:** When the user states a preference or makes a decision, log it in `WORK AREAS/Admin-PA/preferences.md`.
- **Output tracking:** When you save a file to any outputs/ folder, append a one-liner to `WORK AREAS/Admin-PA/output-log.md` — timestamp, filename, project context.
- **Monthly rotation:** Captain's log files rotate monthly. Format: `YYYY-MM-captains-log.md`. At month's end, start a new file.
```

### Step 5: Update Specialist Routing

If the user has an `ABOUT ME/specialist-routing.md` file, add a row to the "Installed specialist plugins" table:

```
| personal-assistant | Personal assistant & daily operations | Captain's log, task tracking, contacts, daily briefing, end-of-day summary, preferences, "what's on my plate", "log this", PA commands |
```

### Step 6: Present the Quick Reference Guide

Read the file at `${CLAUDE_PLUGIN_ROOT}/reference/quick-reference.md` and present its contents to the user as a helpful summary of what they can now do.

### Step 7: First Entry

Invite the user to try it immediately:

"You're all set. Try it right now — tell me something about your day, and I'll show you how the logging works. Or type /log for a quick entry."

This is important — don't just explain what the system does. Get them using it in the same session they set it up. Immediate experience beats explanation every time.

## If Setup Is Interrupted

If the user stops partway through, note in memory what was completed and what wasn't. Next time they interact with the PA, check whether setup finished and offer to complete it.
