# File Import Guide

This guide tells you (Claude) how to import knowledge base entries from files and pasted text. Follow these steps based on the source type.

**Core principle:** Files and pasted content vary wildly — from clean structured CSVs to messy voice transcripts. The job is always the same: identify distinct knowledge entries inside the content, extract or infer metadata, and transform each one into the builder's KB format. When in doubt, show the user what you've found and ask.

## Source Types and How to Handle Them

### Pasted Text (including transcripts)

The user pastes content directly into the chat. This is the loosest format — it could be anything from polished notes to a raw speech-to-text dump.

**Step 1: Assess the content shape.**

Read through the pasted content and classify it:

- **Structured notes** — has headings, bullet points, clear topics. Easy to split.
- **Semi-structured** — some organisation but messy. Meeting notes, brain dumps, annotated outlines.
- **Raw transcript** — speech-to-text output with filler words, incomplete sentences, topic jumps, conversational tangents. The hardest to process.
- **Single long-form piece** — an article, essay, or document that covers one main topic with sub-points.

**Step 2: Extract distinct knowledge entries.**

This is the critical step. One paste might contain one entry or ten.

For **structured notes**: Each heading or clearly delineated section is likely a separate entry. Split at the natural boundaries.

For **semi-structured content**: Look for topic shifts. When the subject changes meaningfully, that's an entry boundary. Flag cases where two topics are interleaved and ask the user how to split them.

For **raw transcripts**: This requires the most work. You must:
1. Read through the full transcript
2. Identify the distinct insights, frameworks, advice, or knowledge nuggets — not every sentence is worth keeping
3. Filter out: small talk, logistics, conversational filler, tangents that don't contain domain knowledge
4. Group related points that are scattered across the conversation (speakers often return to the same topic)
5. Synthesise each insight into a clean, standalone entry — rewrite the messy speech into clear prose while preserving the original meaning and specific details
6. Attribute properly — if the insight came from a named person, capture that in the source field

For **single long-form pieces**: Usually this becomes one entry. If it covers multiple distinct sub-topics that would each be useful on their own, consider splitting — but only if each piece is substantial enough (200+ words of useful content).

**Step 3: Present extracted entries to the user.**

Before transforming anything, show what you've found:

"I've read through that and found [N] distinct insights worth capturing as knowledge base entries:"

List each with a proposed title and one-sentence summary. Then:

AskUserQuestion: "How does this look? Want me to add, remove, or combine any of these?"

Options: "Looks good — create them all" / "Remove some of those" / "I think you missed something" / "Combine [X] and [Y] together"

Only proceed to transformation after the user confirms.

### CSV and Spreadsheet Files (.csv, .tsv, .xlsx, .xls)

Tabular data where each row is typically one entry and columns are fields.

**Step 1: Read the file** using the appropriate method:
- CSV/TSV: Read directly with the Read tool
- XLSX/XLS: Use Python with openpyxl or pandas to read

**Step 2: Identify the structure.**

Show the user the column names and a sample of 2-3 rows:

"Your spreadsheet has [N] rows and these columns: [list columns]. Here's a sample..."

**Step 3: Map columns to KB fields.**

Use the same priority mapping approach as the Notion import guide. Match column headers (case-insensitive) to KB frontmatter fields:

| KB Field | Look for column names |
|---|---|
| `title` | "title", "name", "topic", "entry", "subject", "heading" |
| `category` | "category", "area", "domain", "group", "section", "folder" |
| `type` | "type", "content type", "kind", "format" |
| `confidence` | "confidence", "status", "maturity" |
| `source` | "source", "attribution", "origin", "author", "reference" |
| `date_added` | "date", "date added", "created", "added" |
| `tags` | "tags", "keywords", "labels" |
| `summary` | "summary", "description", "overview", "insight" |

The remaining columns that don't map to frontmatter fields become part of the entry's content body.

**Step 4: Confirm mappings** with the user (same pattern as Notion import — show the proposed mapping, ask for confirmation).

**Step 5: Transform** each row into a KB entry file following the organisation guide format.

### PDF Files (.pdf)

**Step 1: Extract the text.**

Use the PDF skill or appropriate Python libraries (pdfplumber, PyPDF2) to extract text content. If the PDF contains images of text (scanned documents), note this to the user — OCR quality may vary.

**Step 2: Assess the content shape.**

PDFs typically fall into one of these patterns:
- **Multi-topic document** — a report, handbook, or guide with chapters/sections. Each section may become a separate entry.
- **Single-topic document** — a paper, article, or focused document. Usually becomes one entry.
- **Slide deck exported as PDF** — each page is a slide. Group related slides into entries by topic, not page.
- **Form or template** — structured data. Extract the content, not the form structure.

**Step 3: Split into entries.**

For multi-topic documents, split at major heading boundaries (typically H1 or H2 equivalent in the PDF). For single-topic documents, keep as one entry. Show the user your proposed split before proceeding.

**Step 4: Transform** each entry following the standard KB format. Since PDFs rarely have structured metadata, use the **Minimal Source** approach — infer type, category, and tags from the content. Set the source to the PDF filename or document title.

### Word Documents (.docx, .doc)

**Step 1: Extract the text.**

Use the DOCX skill or python-docx library to read the document. Preserve heading hierarchy, lists, and basic formatting.

**Step 2: Assess and split.**

Same logic as PDFs — split at natural heading boundaries for multi-topic documents, keep single-topic documents as one entry.

**Step 3: Transform** using the Minimal Source approach. Word documents sometimes have a document title in properties — use that for the source field if available.

### Markdown Files (.md)

**Step 1: Read the file** directly.

**Step 2: Check if it already matches KB format.**

If the file already has YAML frontmatter with title, type, category, etc., it may be a pre-existing KB entry. In that case, validate it against the organisation guide and fix any issues rather than re-transforming from scratch.

If it doesn't have frontmatter, treat it as content to be transformed.

**Step 3: Transform** using either Rich Source (if the markdown has clear structure and metadata) or Minimal Source (if it's just raw content).

### Plain Text Files (.txt)

Treat these exactly like pasted text — assess the content shape, extract entries, and transform. The only difference is you read them from a file instead of receiving them in the chat.

## Content Quality Rules

These apply regardless of source type:

**What to keep:**
- Specific, actionable insights (not vague generalities)
- Frameworks, processes, and step-by-step methods
- Data points, benchmarks, and specific numbers
- Expert opinions with attribution
- Real-world examples and case studies
- Definitions of domain-specific terminology

**What to discard:**
- Small talk, greetings, pleasantries
- Logistics and scheduling ("let's meet next week")
- Tangential conversations that don't contain domain knowledge
- Repetition of the same point (capture it once, well)
- Content that's too generic (any AI already knows this)
- Personal information not relevant to the domain

**When to rewrite vs preserve:**
- **Always rewrite** raw transcripts — speech-to-text is never KB-ready. Clean up filler words, incomplete sentences, and conversational artefacts while preserving the specific insights and details.
- **Preserve** well-written content that's already clear. Don't rewrite for the sake of rewriting.
- **Restructure** content that has good information but poor organisation — add headings, reorder for clarity, break up walls of text.
- **Attribute** properly. If an insight came from a specific person, book, talk, or course, always capture that in the source field.

## Handling Mixed Input

If the user provides multiple files or mixes pasted text with files:
1. Process each source in the order received
2. After each source is processed, ask if there's more to import (see the iterative loop in SKILL.md Step 2)
3. Wait until all sources are processed before doing the categorisation and relations pass
