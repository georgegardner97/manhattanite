---
name: tidy
description: Scan a folder (Downloads, Desktop) and propose cleanup actions
---

# /tidy — File Cleanup Assistant

Help the user clean up a cluttered folder. This is a practical utility that demonstrates immediate PA value.

## Flow

1. Use AskUserQuestion to ask which folder to scan:
   - "Downloads folder"
   - "Desktop"
   - "Choose a different folder"

2. If the folder isn't already accessible, use `request_cowork_directory` to ask the user to select it.

3. Scan the folder and categorise files:
   - **Large files** (>100MB) — flag with sizes
   - **Old files** (>30 days, not modified recently) — suggest archiving or deleting
   - **Duplicate names** — files with similar names that might be versions of the same thing
   - **Screenshots** — accumulated screenshots (often pile up on Desktop)
   - **Installers/DMGs** — downloaded installers that are probably no longer needed
   - **Documents** — PDFs, docs, spreadsheets that might belong somewhere specific

4. Present a summary: "I found [X] files. Here's what I'd suggest..." Group by category with clear action proposals.

5. Use AskUserQuestion for each proposed action:
   - "Delete these [X] old installers?"
   - "Move these screenshots to [suggested location]?"
   - "These 5 files are over 100MB — want to review them?"

6. **Never delete without explicit confirmation.** Present the list, get approval, then act. If in doubt, suggest moving to a "to-review" folder rather than deleting.

7. Log the cleanup in the captain's log: "[time] — Tidied [folder]: removed X files, moved Y, freed Z space."

## Tone

Keep it practical and slightly fun. "Your Downloads folder has 847 files in it. That's... ambitious. Let's sort this out." Don't be judgmental about the mess — everyone's Downloads folder is a disaster.
