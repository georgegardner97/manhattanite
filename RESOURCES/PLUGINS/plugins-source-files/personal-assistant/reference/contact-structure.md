# Contact Structure

## Purpose

Track people mentioned in conversations so the user can ask "when did I last talk to Sarah?" or "what did Bhav say about the timeline?" without having to remember. This is a relationship tracker, not a sales CRM.

## File Location

`WORK AREAS/Admin-PA/contacts.md`

## When to Update

Update the contacts file when someone is mentioned **with meaningful context** in the captain's log or conversation. Not every name mention needs a contact entry — only when there's relationship or interaction data worth tracking.

**Update for:**
- "Had a call with Bhav about the course launch" → update last interaction, add note
- "Sarah's worried about the Q3 timeline" → update notes
- "Meeting with Dr Patel at Crystal Palace surgery" → add/update with location context

**Don't update for:**
- "I watched a video by Ali Abdaal" → public figure, not a contact
- "The Notion team released an update" → company, not a person
- Mentions in hypothetical contexts

## Entry Format

```markdown
## [Full Name]
- **Context:** [How the user knows them — role, relationship, company]
- **Last mentioned:** [date]
- **Notes:** [Key details from conversations, most recent first]
- **Follow-ups:** [Any pending actions involving them]
```

### Example

```markdown
## Bhav Sharma
- **Context:** Fractional ops consultant. Potential collaborator for course launch.
- **Last mentioned:** 9 April 2026
- **Notes:**
  - Works with 3 clients max. Interested in coordinating the course launch. (9 Apr)
  - Going to send her engagement structure. (9 Apr)
- **Follow-ups:** Send project scope by Friday 11 Apr. Waiting on engagement structure.

## Dr Patel
- **Context:** Dentist at Crystal Palace surgery.
- **Last mentioned:** 9 April 2026
- **Notes:**
  - Simon prefers morning appointments. (9 Apr)
- **Follow-ups:** Book appointment.
```

## Keeping It Clean

- Most recent notes go first within each entry
- Keep notes concise — one line per interaction
- If a contact hasn't been mentioned in 3+ months, they naturally sink to the bottom. Don't delete them — the history might be useful later.
- If the file gets very long (50+ contacts), consider alphabetical grouping with headers (A-E, F-J, etc.)
