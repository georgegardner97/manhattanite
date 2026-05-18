# How to Structure a Good Knowledge Base

This guide helps you organise knowledge base content so the search engine finds the right material. Good structure makes a bigger difference than which search method you use.

## The Golden Rule

Each file should cover one coherent topic — think "chapters" not "sentences." A file about "How to write a strong hook" is better than a file that mentions hooks, pacing, and thumbnails all in one.

## Folder Structure

Organise files into category folders that make logical sense for the domain:

```
references/
  fundamentals/
    core-principles.md
    common-mistakes.md
    glossary.md
  techniques/
    technique-a.md
    technique-b.md
  examples/
    case-study-1.md
    case-study-2.md
  rules/
    always-do.md
    never-do.md
```

Good category names describe the type of content, not the format. "Retention strategies" is better than "notes" or "misc".

## File Format

Every file should follow this pattern:

```markdown
---
title: "Clear, Descriptive Title"
type: framework
category: techniques
confidence: validated
source: Where this knowledge came from
date_added: 2026-01-15
related:
  - filename-slug-of-related-entry
  - another-related-entry
tags:
  - keyword1
  - keyword2
  - related term
  - synonym
---

# Clear, Descriptive Title

> One-sentence summary of what this entry covers and why it matters.

## When to Apply

When and where to use this knowledge...

## How It Works

The core content...

## Examples

Practical examples...

## Common Mistakes

What to avoid...
```

### The YAML Frontmatter Block

The block between the `---` markers at the top is called frontmatter. It stores structured metadata that the search engine uses to find, filter, and contextualise content. Here's what each field does:

**title** — The entry's name. Should match the H1 heading below.

**type** — What kind of knowledge this is. Choose one:

| Type | Use for | Example |
|------|---------|---------|
| `framework` | Multi-step systems or methodologies | "The Hook Trinity: Packaging-First Validation" |
| `technique` | Specific tactical methods | "The 3-Second Rule for Hooks" |
| `strategy` | High-level approaches and mental models | "CCN Framework: Core, Casual, New Targeting" |
| `template` | Fill-in-the-blank structures | "Video Brief Template" |
| `example` | Case studies and worked examples | "Case Study: How X Video Got 1M Views" |
| `reference` | Data, benchmarks, and lookup material | "Performance Analysis Framework" |
| `principle` | Fundamental truths and rules | "The Packaging-First Principle" |

**category** — The subfolder this entry lives in (e.g., `hook-structure`, `scripting`, `analytics`). Should match the folder name.

**confidence** — How well-tested this knowledge is: `validated` (proven and tested), `emerging` (promising but limited evidence), or `experimental` (untested idea).

**source** — Where the knowledge originally came from. A person, book, course, or your own experience.

**date_added** — When the entry was added, in YYYY-MM-DD format.

**related** — Filename slugs (without the .md extension) of other entries that connect to this one. These create a web of related knowledge so the specialist can cross-reference and provide richer answers.

**tags** — Keywords that help the search engine find this content. Critical for matching how people phrase questions to how the content is written.

### Writing Good Tags

Tags act as a bridge between how users phrase questions and how the content is written. Good tags include:

- The main topic words
- Common synonyms (if the file is about "retention", add "watch time", "engagement", "drop-off")
- Related concepts someone might search for
- Common abbreviations or shorthand
- Multi-word phrases that people naturally use

### Connecting Entries with Related

The `related` field creates links between entries. Use the filename slug — the filename without the `.md` extension and the folder path. For example, if the file is at `techniques/the-3-second-rule.md`, the slug is `the-3-second-rule`.

Good connections to make:
- Entries that are often used together (e.g., a hook technique and a scripting framework)
- Entries that build on each other (e.g., a principle and the technique that applies it)
- Entries that offer complementary perspectives on the same topic

Don't over-connect — 2–5 related entries per file is the sweet spot. Only link entries that genuinely inform each other.

### The Blockquote Summary

The `> ` line immediately after the H1 title serves as a one-sentence semantic anchor for the whole entry. It should capture the core insight or purpose of the entry in a way that helps both the search engine and the specialist understand what this entry is about at a glance.

Good: `> Viewers decide whether to keep watching within the first 3 seconds. Open with the payoff, conflict, or most compelling visual immediately.`

Bad: `> This document is about hooks.`

### Why Headings Matter

The search engine splits content at heading boundaries (H1, H2, H3). Each section becomes a separate searchable chunk. This means:
- Use descriptive headings that summarise what follows
- Keep sections focused — one idea per section
- Don't put unrelated content under the same heading

### Standard Sections

While every entry is different, these sections work well for most content types:

- **When to Apply** — Situational context for when this knowledge is useful
- **How It Works** — The core explanation
- **Examples** — Practical, real-world illustrations
- **Common Mistakes** — What to avoid

## What to Include

Include:
- Domain expertise and frameworks
- Specific processes and step-by-step methods
- Real examples and case studies
- Rules, constraints, and preferences
- Terminology and definitions

Exclude:
- Generic knowledge that any AI already knows
- Obvious common sense
- Sensitive personal data
- Content that changes daily (keep that in live systems like Notion)
- Duplicate content across files

## Size Guidelines

- Minimum: 3 files (otherwise the specialist doesn't have enough to search through)
- Sweet spot: 10–30 files for most domains
- Maximum practical: ~100 files for standard search, unlimited for advanced search
- File length: 200–2000 words each. Long enough to be useful, short enough to be focused.

## Legacy Format Support

If you have existing markdown files without the YAML frontmatter block, the search engine will still work. It falls back to looking for bold-text metadata like `**Tags:** keyword1, keyword2` near the top of the file. However, the new frontmatter format is strongly recommended for new entries — it gives the search engine much more to work with, especially the content type and related entries fields.

## Common Mistakes

- **Too broad**: One massive file covering everything → split into focused topics
- **Too granular**: Dozens of tiny 2-sentence files → merge related content
- **Missing tags**: No keyword tags → search can't find content with different phrasing
- **No content type**: Missing the `type` field → specialist can't filter or prioritise results
- **Vague headings**: "Notes" or "Stuff" as section headings → use descriptive headings
- **Duplicate content**: Same information in multiple files → pick one home for each piece of knowledge
- **No blockquote summary**: Missing the `> ` summary line → each chunk loses its context anchor
- **Over-connecting**: Linking every entry to every other entry → dilutes the signal
