# System Review Hooks — PA Data Scanning

## Purpose

This file tells the System Review skill what to look for when scanning Personal Assistant data. The System Review already reads memory files and spots patterns. These hooks expand its scope to include the captain's log, tasks, contacts, preferences, and output log.

## What to Scan

During a System Review, read the following PA files in addition to the usual memory files:

1. **Captain's log** — current month and previous month
2. **tasks.md** — current state
3. **contacts.md** — current state
4. **preferences.md** — all entries
5. **output-log.md** — current month

## Pattern Detection Categories

### 1. Automation Opportunities

Look for repeated manual actions that could become scheduled tasks or skills:

- **Repeated checks:** "checked email", "looked at analytics", "reviewed inbox" appearing 3+ times in a month → suggest a scheduled task
- **Regular reporting:** User creates similar outputs weekly/monthly → suggest automating the data gathering step
- **Recurring workflows:** Same sequence of steps appearing across multiple days → suggest creating a skill

**How to flag:** "I noticed you [action] roughly [frequency]. This could be automated with a scheduled task. Want me to set one up?"

### 2. Skill Creation Candidates

Look for recurring workflows that are more complex than a simple scheduled task:

- Multi-step processes the user describes repeatedly
- Requests that follow a pattern (e.g., "every time I finish a video, I need to create the description, write the social posts, and update the content tracker")
- Frustrations about repetitive work: "I keep having to..." or "every time I need to..."

**How to flag:** "There's a repeating workflow here: [description]. This could be turned into a skill using the Specialist Sub-Agent Builder. Want to explore that?"

### 3. Preference Promotion

Review `preferences.md` for entries that should be promoted to the About Me files:

- Preferences stated multiple times → strong signal, should be in About Me
- Preferences that affect how Claude works (communication style, scheduling preferences, tool preferences) → should be in voice-profile.md or about-me.md
- Decisions that define ongoing direction (platform choices, business model decisions) → should be in about-me.md

**How to flag:** "You've mentioned [preference] several times. I'd suggest adding it to your About Me files so it applies across all sessions. Here's what I'd add: [proposed text]"

### 4. Work Area Health

Use captain's log data to assess which work areas are getting attention and which aren't:

- Areas with frequent log entries → active, healthy
- Areas with no mentions in 2+ weeks → might need a check-in
- Tasks piling up in one area → might be overwhelmed or need help

**How to flag:** "Your [area] hasn't had any activity in the log for [timeframe]. Is that intentional, or has it slipped off the radar?"

### 5. Contact Follow-up Health

Check contacts.md for relationship maintenance:

- Contacts with follow-ups that are overdue
- Important contacts not mentioned in 30+ days
- Contacts with notes but no follow-up actions

**How to flag:** "You haven't mentioned [contact] since [date]. You had [pending item] with them — worth following up?"

### 6. Reflection Pattern Analysis

Read the reflection entries (tagged with "— Reflection" in the captain's log) for recurring themes:

- Same frustration appearing across multiple reflections → systemic issue worth addressing
- "What felt harder than it should" answers that point to tool or process gaps
- Positive patterns worth reinforcing

**How to flag:** "Across your reflections this month, [theme] keeps coming up. Here's what I think could help: [suggestion]"

## Output Format

Include a "Personal Assistant Insights" section in the System Review report, after the usual memory and system analysis:

```markdown
## Personal Assistant Insights

### Automation opportunities
[List any detected patterns with suggested actions]

### Preference promotions
[Preferences ready to move to About Me files]

### Work area health
[Areas that need attention]

### Contact follow-ups
[Overdue or stale follow-ups]

### Reflection themes
[Patterns from reflection entries]
```

If there are no insights in a category, omit it rather than including an empty section. The System Review should only surface what's actionable.
