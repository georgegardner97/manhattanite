# Task Extraction Rules

## Purpose

When processing captain's log entries or conversational input, automatically identify action items and create tasks in `WORK AREAS/Admin-PA/tasks.md`. The user should never have to say "create a task" — the system spots obligations and tracks them.

## Signal Phrases

These patterns indicate an action item. Look for them in any conversational input:

**Direct obligation:** "need to", "have to", "must", "should", "going to"
- "I need to send her a project scope" → Task: Send project scope to [person]

**Future intent:** "will", "planning to", "want to", "going to"
- "I'm going to restructure the pricing page this week" → Task: Restructure pricing page (due: this week)

**Reminders:** "remind me", "don't forget", "remember to", "follow up"
- "Remind me to follow up with the accountant on Friday" → Task: Follow up with accountant (due: Friday)

**Commitments to others:** "I told them I'd", "I promised", "I said I'd", "I'll send"
- "I told Sarah I'd have the proposal ready by Monday" → Task: Prepare proposal for Sarah (due: Monday)

**Waiting signals:** "waiting on", "they're going to", "expecting", "should hear back"
- "Bhav is going to send over her engagement structure" → Task: Waiting — Bhav to send engagement structure (status: Waiting)

## What's NOT a Task

Not everything that sounds like an action is worth tracking:

- **Completed actions:** "I sent the email" → not a task, it's done (but log it)
- **Hypothetical/exploratory:** "maybe I should look into..." "wondering if..." → not a task unless the user confirms intent
- **Observations:** "The website could use a refresh" → not a task unless paired with intent to act

If you're genuinely unsure whether something is an action item, lean toward capturing it. A task the user marks as "not needed" is less costly than a forgotten commitment.

## Task Format in tasks.md

Every task should be linked to a work area or project. This creates a web of connections across the system — when someone asks "what's happening in Marketing?", tasks linked to that area surface alongside the area's projects and outputs.

```markdown
## Open

- [ ] **[Task description]** — Due: [date or "no date"] | Source: [date, log entry reference] | Area: [work area name] | Project: [project name, if applicable]
```

### How to determine the area/project link

1. **Explicit mention:** "I need to finish the proposal for the website redesign" → Area: Marketing, Project: Website-Redesign-Example-project
2. **Context clues:** "Send Q3 receipts to accountant" → Area: Finance (receipts = finance)
3. **Person association:** If the task involves a contact already linked to a project, inherit that link
4. **Default:** If no area is obvious, link to Admin-PA. Everything has a home — nothing floats unlinked.

When the user has active projects within an area, prefer linking to the specific project rather than just the area. "Write the homepage copy" linked to `WORK AREAS/Marketing/Website-Redesign-Example-project/` is more useful than just "Area: Marketing."

### Example

```markdown
## Open

- [ ] **Send project scope to Bhav** — Due: Friday 11 Apr | Source: 9 Apr, 09:15 log | Area: Business
- [ ] **Remind Elle about thumbnail brief** — Due: 10 Apr | Source: 9 Apr, 11:30 log | Area: Marketing | Project: CoWork-OS-Video
- [ ] **Send Q3 receipts to accountant** — Due: Friday 11 Apr | Source: 9 Apr, 14:00 log | Area: Finance

## Waiting

- [ ] **Bhav to send engagement structure** — Since: 9 Apr | Source: 9 Apr, 09:15 log | Follow up: 14 Apr | Area: Business

## Done (recent)

- [x] **Script CoWork OS video** — Completed: 9 Apr | Source: 9 Apr, 11:30 log | Area: Marketing | Project: CoWork-OS-Video
```

### Why area linking matters

This isn't just metadata — it makes the PA useful across the whole system:
- `/tasks` can filter by area: "show me Marketing tasks only"
- Daily briefings can group tasks by area for a clearer overview
- System Review can assess which areas have task buildup vs which are clear
- When working on a project, the PA can surface that project's tasks without being asked

## Due Date Parsing

When the user mentions timing, convert to specific dates:

- "by Friday" → the coming Friday's date
- "next week" → Monday of next week
- "end of month" → last day of current month
- "tomorrow" → tomorrow's date
- "in a couple of days" → 2 days from now
- No time mentioned → "no date" (still tracked, just not time-bound)

## Updating Tasks

When the user mentions completing something ("done", "finished", "sent it", "sorted"), move the matching task to "Done (recent)" with the completion date. Don't ask for confirmation — just do it and mention it briefly: "Marked 'send project scope to Bhav' as done."

Keep "Done (recent)" to the last 2 weeks. Older completions can be removed to keep the file clean (the captain's log preserves the history).
