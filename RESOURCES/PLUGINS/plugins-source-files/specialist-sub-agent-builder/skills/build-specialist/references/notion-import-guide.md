# Notion Import Guide

This guide tells you (Claude) how to import knowledge base entries from a user's Notion into the specialist builder's KB format. Follow these steps exactly.

**Important:** Notion content comes in many shapes — structured databases with rich properties, bare databases with just titles and content, loose individual pages, even pages that are mostly bookmarked web links with notes. This guide handles all of them. The key principle is: extract what structure exists, infer the rest from content, and always confirm with the user.

## Step 0: Check Notion Connection

Before anything else, verify that the user has a working Notion connection.

**How to check:** Attempt a simple Notion search using the `notion-search` tool with a generic query like "test". If it succeeds (returns results or an empty result set), Notion is connected. If it fails with an authentication or connection error, Notion is not connected.

**If NOT connected**, say this to the user:

"To pull knowledge from Notion, we need to connect it first. This is a one-time setup — once it's connected, it stays connected for future use."

Then use the `search_mcp_registry` tool with keywords `["notion"]` to find the Notion connector. If found, use `suggest_connectors` to present the connection option to the user. Wait for them to complete the connection before proceeding.

If they can't or don't want to connect Notion right now, offer the other Step 2 options (local files or manual entry) as alternatives.

**If connected**, proceed to Step 1.

## Step 1: Find the Source

Ask the user where their knowledge lives in Notion:

AskUserQuestion: "How is your knowledge organised in Notion?"

Options: "It's in a database (a table, board, or gallery)" / "It's a collection of individual pages" / "It's a mix — some in databases, some as pages" / "I'm not sure — can you help me find it?"

### Path A: Database Import

This is the most structured path and produces the best results. The database has properties (columns) that map to KB metadata.

AskUserQuestion: "Which database should I pull from? You can give me a name, a link, or describe what it's called and I'll search for it."

**If they provide a URL or database ID:** Use `notion-fetch` directly with that ID.

**If they provide a name or description:** Use `notion-search` with their description as the query. Present the top matches and let them confirm.

Proceed to Step 2 (Read the Schema).

### Path B: Individual Pages Import

The user has loose pages — no database structure. These pages might be:
- Standalone knowledge notes
- Web clippings or bookmarks with annotations
- Meeting notes with insights
- A mix of different content types

AskUserQuestion: "How should I find your pages? You can give me a link to a parent page that contains them, search terms to find them, or I can look through a specific section of your workspace."

**If they provide a parent page URL:** Use `notion-fetch` on that page. It will show child pages. List them and let the user confirm which ones to import.

**If they provide search terms:** Use `notion-search` with their terms. Show results and let them pick.

**If they want to browse:** Use `notion-search` with broad terms related to their specialist domain. Show results and let them select.

For individual pages, skip Step 2 (no schema to read) and Step 3 (no properties to map). Go directly to **Step 5: Pull All Entries** using the selected page IDs, then proceed to **Step 6: Transform** — but use the **Minimal Source** rules in Step 6 since there's no structured metadata to map.

### Path C: Mixed Sources

If the user has knowledge spread across databases and pages:
1. Start with Path A for any databases
2. Then do Path B for additional loose pages
3. Combine everything into a single KB at the end

### Path D: Help Me Find It

Use `notion-search` with terms related to the specialist domain being built. Show the user what you find — databases, pages, anything relevant — and let them tell you what to import.

## Step 2: Read the Schema (Database Path Only)

Once you have the database, use `notion-fetch` on it to get the full schema. The response will include a `<data-source-state>` section with the schema definition.

You need to identify which properties exist and what types they are. Common property types you'll encounter:

| Notion Type | What It Looks Like |
|---|---|
| `title` | The page's main title — every database has exactly one |
| `select` | Single choice from a list of options |
| `multi_select` | Multiple choices from a list |
| `text` (rich_text) | Free text field |
| `date` | A date or date range |
| `url` | A URL |
| `checkbox` | True/false |
| `number` | Numeric value |
| `relation` | Link to another database |
| `formula` | Computed value |

## Step 3: Auto-Detect Field Mappings

Try to automatically map Notion properties to KB frontmatter fields. Match by **property name** (case-insensitive, ignore special characters) first, then by **property type** as a fallback.

### Priority Mapping Table

The left column is the KB frontmatter field we need to fill. The right column shows what to look for in the Notion schema — check in order, and use the first match.

| KB Field | Auto-detect by name (case-insensitive) | Auto-detect by type | Required? |
|---|---|---|---|
| `title` | "topic", "title", "name", "entry", "subject" | The property with type `title` (every DB has one) | **Yes** |
| `category` | "category", "categories", "area", "domain", "group", "section" | First `select` property that isn't mapped to anything else | No |
| `type` | "content type", "type", "kind", "format", "entry type" | First `select` or `multi_select` with option names matching builder types | No |
| `confidence` | "confidence", "confidence level", "status", "maturity", "certainty" | `select` with options suggesting quality levels | No |
| `source` | "source", "attribution", "origin", "reference", "credit", "author" | `text` property with "source" in the name | No |
| `date_added` | "date added", "date", "created", "added", "date created" | First `date` property | No |
| `tags` | "tags", "keywords", "labels" | First `multi_select` that isn't already mapped | No |
| `summary` | "key insight", "summary", "description", "overview", "tldr", "insight" | `text` property with "summary" or "insight" in the name | No |
| `when_to_apply` | "when to apply", "trigger", "use when", "application", "context" | None (name match only) | No |

### Content Type Value Mapping

If a `type` property is found, map its Notion option values to the builder's content types:

| Notion Value (case-insensitive) | Builder Type |
|---|---|
| "framework" | `framework` |
| "technique", "best practice", "method", "tactic" | `technique` |
| "strategy", "approach", "model", "mental model" | `strategy` |
| "template", "structure", "blueprint" | `template` |
| "example", "case study", "case" | `example` |
| "reference", "data", "benchmark", "research finding", "research", "tool/resource" | `reference` |
| "principle", "rule", "law", "truth" | `principle` |

If a value doesn't match any of these, default to `reference`.

If a multi_select has multiple values, use the **first** value that matches a builder type.

### Confidence Value Mapping

| Notion Value (case-insensitive) | Builder Value |
|---|---|
| "validated", "proven", "confirmed", "tested" | `validated` |
| "emerging", "promising", "theoretical", "developing" | `emerging` |
| "experimental", "untested", "hypothesis", "draft" | `experimental` |

### Category Slugification

Convert Notion category names to folder-safe slugs:
- Lowercase everything
- Replace spaces with hyphens
- Replace `&` with `and`
- Remove other special characters
- Examples: "Hook & Structure" → "hook-and-structure", "Analytics & Optimization" → "analytics-and-optimization", "Audience Psychology" → "audience-psychology"

## Step 4: Confirm Mappings with the User

**Always** show the user what you've auto-detected before proceeding. Present it simply:

"Here's how I'd map your Notion properties to the knowledge base format:"

Show a clean list like:
- **Topic** → title (the entry's name)
- **Category** → category (used for folder organisation)
- **Content Type** → type (framework, technique, strategy, etc.)
- **Confidence Level** → confidence
- **Source** → source attribution
- **Date Added** → date added
- **Key Insight** → summary (the one-line overview)
- **When to Apply** → included as a content section

Then note any properties that weren't mapped and any KB fields that have no match.

AskUserQuestion: "Does this mapping look right?"

Options: "Yes, looks good" / "I want to change some mappings" / "What about [unmapped property]?"

If they want changes, walk through each adjustment.

**For unmapped required fields:** If `title` has no match (extremely unlikely — every DB has a title property), ask the user which property to use. For optional fields with no match, note that they'll be left empty or inferred from content.

## Step 5: Pull All Entries

Use `notion-search` with the data source URL to discover all pages in the database:

```
notion-search(query="", data_source_url="collection://{data_source_id}")
```

This returns page IDs and titles. Then fetch each page individually using `notion-fetch` to get both properties and content.

**Batch processing guidance:**
- Fetch pages one at a time using `notion-fetch` (the tool requires individual page IDs)
- For large databases (30+ entries), tell the user: "This database has [N] entries. I'll pull them all — this will take a moment."
- Process in batches of 5-10 to give progress updates: "Pulled 10 of 48 entries..."

**What to extract from each page:**
1. All mapped properties (from the `<properties>` section)
2. The full page content (from the `<content>` section)
3. The page URL (for the `source` field if no other source exists)

## Step 6: Transform Each Entry

For each Notion page, create a markdown file following the builder's KB format. Apply the organisation guide rules from `organisation-guide.md`.

There are two transformation paths depending on how much structure the source has:

### Rich Source (database with mapped properties)

Use this when the Notion database had properties that mapped to KB fields in Steps 2-4.

**6a. Build the YAML Frontmatter:**

```yaml
---
title: "{mapped title value}"
type: {mapped and converted type value, or "reference" if unmapped}
category: {mapped and slugified category, or "general" if unmapped}
confidence: {mapped and converted confidence, or "validated" if unmapped}
source: {mapped source value, or "Imported from Notion" if unmapped}
date_added: {mapped date value, or today's date if unmapped}
related: []
tags:
  - {auto-generated from title words}
  - {auto-generated from category}
  - {any existing tags from Notion}
---
```

**6b. Build the Content Body:**

1. **H1 Title** — matches the frontmatter title
2. **Blockquote summary** — use the mapped summary field. If no summary field exists, write a one-sentence summary from the page content.
3. **"When to Apply" section** (if mapped) — include as an H2 section
4. **Main content** — the page's body content from Notion, cleaned up

### Minimal Source (individual pages or bare databases)

Use this when importing from individual pages or databases with few/no useful properties. You need to **infer** the metadata from the content itself.

**6a. Build the YAML Frontmatter by inference:**

```yaml
---
title: "{page title from Notion}"
type: {infer from content — see inference rules below}
category: {infer from content — see inference rules below}
confidence: validated
source: "Imported from Notion"
date_added: {page's created date, or today's date}
related: []
tags:
  - {extract from content — see inference rules below}
---
```

**Inference rules:**

- **Type:** Read the content and classify. If it describes a step-by-step process → `framework`. If it's a specific method → `technique`. If it's a broad approach → `strategy`. If it's a real-world example → `example`. If it's data or benchmarks → `reference`. If it's a rule or principle → `principle`. If unclear → `reference`.
- **Category:** Group entries by their dominant topic. After reading all entries, identify 3-8 natural clusters and create category slugs for them. If an entry doesn't fit a cluster, use "general".
- **Tags:** Extract the 5-10 most important keywords and phrases from the content. Focus on domain-specific terms, not generic words.
- **Summary:** Write a one-sentence blockquote summary capturing the core insight.

**6b. Build the Content Body:**

1. **H1 Title** — the page title
2. **Blockquote summary** — your one-sentence summary of the content
3. **Main content** — restructure the page content with clear H2/H3 sections if it doesn't already have them

### Web Clippings and Bookmarks

If a Notion page is primarily a saved web link with notes:
- The **source** field should be the original URL or site name
- The **content** should be the user's notes and annotations, not the full web page content
- If the page is just a URL with no notes, flag it: "Note: [page title] is a bookmark with no notes — want me to skip it or add it with just the title?"

### Content Cleanup (applies to all paths)

For all imported content:
- Preserve all headings (H2, H3) and their content
- Preserve lists, bold, italic formatting
- Remove Notion-specific artifacts (empty image references like `![]()`, relation links like `[\[1\]](...notion.so...)`)
- Remove any trailing blank lines or whitespace
- If the Notion content already has a "When to Apply" section, don't duplicate it
- Collapse excessive nesting (H4, H5, H6) up to H3 max

### 6c. Generate Tags

Auto-generate keyword tags from:
- Words from the title (excluding common words like "the", "a", "for", "and", "in", "of", "to", "with")
- The category name
- Any explicit tags from Notion
- Key terms from the summary/insight field
- Aim for 5-10 tags per entry

### 6d. Generate Filename

Create a filename slug from the title:
- Lowercase everything
- Replace spaces with hyphens
- Remove special characters except hyphens
- Truncate to 60 characters max
- Example: "The 3-Second Rule for Hooks" → "the-3-second-rule-for-hooks.md"

### 6e. Organise into Category Folders

Create a subdirectory under `references/` for each unique category slug. Place each file in its matching category folder.

## Step 7: Cross-Reference Related Entries

After all entries are transformed, make a second pass to populate the `related` fields:

1. **Check Notion relations** — if the database has relation properties linking entries to each other, use those connections.
2. **Check content references** — if entries mention other entries by name in their content, add those as related.
3. **Check category proximity** — entries in the same category that cover complementary topics are likely related.
4. **Limit to 2-5 connections per entry** — don't over-connect.

Update each file's frontmatter `related` field with the filename slugs (without `.md`) of connected entries.

## Step 8: Present Results to the User

After transformation is complete, show the user what was imported:

- Total entries imported
- Category breakdown (entries per category)
- Table of contents organised by category
- Any entries that had issues (missing content, unclear mapping)

AskUserQuestion: "Import complete — [N] entries pulled from Notion and formatted. Does this look right?"

Options: "Yes, looks good" / "I want to review some entries" / "Remove some entries" / "Import more from a different database"

If they want to review, show individual entries on request. If they want to add from another database, loop back to Step 1.

## Error Handling

**Empty pages:** If a Notion page has properties but no body content, still import it but flag it: "Note: [entry name] has metadata but no content — you might want to add detail later."

**Missing title:** Skip the entry and flag it: "Skipped one entry with no title."

**Duplicate titles:** If two entries have the same title, append a number: "hook-techniques.md" and "hook-techniques-2.md"

**Connection lost mid-import:** If a Notion fetch fails during import, save what you have so far, tell the user how many entries were successfully imported, and offer to retry the remaining ones.

**Very large databases (100+ entries):** Warn the user: "This database has [N] entries. Importing all of them will create a very large knowledge base. Would you like to import all of them, or filter to specific categories?" If they want to filter, ask which categories to include.
