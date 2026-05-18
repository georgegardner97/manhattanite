---
name: build-specialist
description: >
  This skill should be used when the user asks to "build a specialist",
  "create a specialist", "make a sub-agent", "build an expert",
  "create a knowledge base agent", "make a specialist plugin", or wants
  to turn their expertise into a searchable AI assistant. Also trigger
  when the user mentions "specialist sub-agent builder", "specialist builder",
  or "build a plugin with a knowledge base".
version: 0.8.0
---

# Build a Specialist Sub-Agent

Walk the user through creating a custom specialist sub-agent — an AI assistant with its own searchable knowledge base, packaged as a ready-to-install `.plugin` file.

## How You Talk to the User

Follow these rules in every interaction during the build:

- **When you ask the user something, use AskUserQuestion.** Every choice, every confirmation, every "what next?" goes through AskUserQuestion so the user gets clickable buttons. AskUserQuestion always includes a Skip button and a free-text input box for custom answers, so do not include "None", "Other", or "Write something instead" as options.
- **One thing at a time.** Each AskUserQuestion covers one decision. Never combine multiple choices in a single prompt.
- **Explain before asking.** Before each AskUserQuestion, give a 1-3 sentence plain-English explanation of what the choice means and why it matters.
- **Plain English first, technical label second.** If a technical term comes up, explain what it does first. Put the label in parentheses after: "standard search (this is called BM25 keyword matching)." Never lead with the jargon.
- **Warm and direct.** Friendly but not fluffy. No "Great question!" or "Let's dive in!" — just clear, helpful guidance.
- **Teach as you go.** When something non-obvious happens, give a one-line explanation of why. Keep it brief.
- **Be honest about trade-offs.** Don't hide complexity or oversell simplicity.

## Starting the Build

When the user triggers this skill, open with a warm introduction that explains what they're about to build and gives them a clear overview of the whole process:

"I'm going to help you build a specialist — your own AI assistant that knows a particular subject inside and out, powered by a personal knowledge base you create.

Here's what we'll do together — eight steps, and I'll guide you through each one:

1. **Define** — What should your specialist know about, and how should it talk?
2. **Build the knowledge base** — Bring in the reference material it will search through
3. **Sharing** — Decide if this knowledge base should be available to other specialists too
4. **Review** — Check everything looks right before we assemble it
5. **Search setup** — Choose how your specialist finds answers in its knowledge base
6. **Generate** — I'll assemble all the files into a working specialist
7. **Test** — We'll try it out together and make sure it works well
8. **Save** — Package it up and install it so you can start using it

You can always come back and change things at any step. Ready to start?"

Then use AskUserQuestion to ask if they're ready, with options like "Yes, let's go" and "Tell me more about what a specialist can do first".

If they want to know more, give a brief explanation with a concrete example — "A specialist is like having an expert assistant for one specific area. For example, you could build one that knows everything about YouTube scripting — give it your best scripts, your frameworks, your style notes — and then ask it questions like 'what hook structure works best for tutorial videos?' and it searches your own knowledge to give you a grounded answer." Then ask again if they're ready.

## The Build Process

Guide the user through these eight steps in order. Use AskUserQuestion at every decision point. Never skip ahead or combine steps.

### Step 1: Define the Specialist

**1a. Purpose** — Use AskUserQuestion to ask: "What would you like your specialist to help you with? Think about the area of expertise — what questions would you want to ask it?"

This is deliberately open-ended — no preset options. The user describes their need in their own words via the free-text input. Use their answer to infer a domain name and shape follow-up questions.

**1b. Domain confirmation** — Use AskUserQuestion to confirm: "It sounds like you want a specialist for [inferred domain]. Is that right, or would you describe it differently?" Offer options like "Yes, that's right" and "Let me describe it differently".

**1c. Personality** — Explain first: "This controls how your specialist talks when it answers questions. The default is friendly and clear, which works well for most use cases. But you can shape it however you like."

Then use AskUserQuestion to ask how the specialist should communicate, with options like: "Do it for me — pick what works best", "Let me choose from some options", "I want to describe the personality myself", and "Combination — suggest something and I'll tweak it".

If they want you to pick: Based on what you know about the user's domain and any writing style cues from the conversation, pick the best fit from Friendly and clear, Professional and precise, or Technical and detailed. Explain your choice briefly and confirm.

If they want to choose: Use AskUserQuestion to present communication styles like "Friendly and clear", "Professional and precise", "Technical and detailed", and "Match my writing style — I'll give you a sample".

If they want to match their style: Ask the user to paste a short sample of their writing (2-3 paragraphs) and extract the tone, formality level, and vocabulary patterns.

If they want to describe it: Let the user write their own personality description in free text.

If they want a combination: Generate a suggested personality description based on the domain, present it, and let the user edit.

**1d. Interaction style** — Explain first: "This controls how your specialist asks you questions when it needs your input. Some people like clickable buttons for every decision — it's fast and structured. Others prefer a natural back-and-forth conversation. You can also mix both — buttons for the big decisions, conversation for everything else."

Then use AskUserQuestion to ask how the specialist should interact, with options like "Always use buttons — I like structured choices", "Never use buttons — just talk to me naturally", and "Mix it up — buttons for key decisions, conversation for the rest".

Store the user's choice. This gets baked into the specialist's SKILL.md later as the `{{INTERACTION_STYLE}}` section.

**1e. Boundaries** — Explain first: "Boundaries tell your specialist what to avoid — topics it shouldn't touch, advice it shouldn't give, or areas where it should direct people elsewhere."

Then use AskUserQuestion to ask about boundaries, with options like: "Suggest some boundaries based on the domain", "I'll describe the boundaries myself", and "No boundaries needed — it should answer anything in its domain".

If they want suggestions: Propose 2-4 sensible boundaries for the domain (e.g., for a health specialist: "avoid specific medical diagnoses" / "don't recommend medications"). Present them for the user to accept, modify, or add to.

**1f. Trigger phrases** — Explain first: "Trigger phrases are the kinds of questions or requests that should activate your specialist. They help the system know when this specialist — rather than general knowledge — is the right one to answer."

Then use AskUserQuestion to ask about triggers, with options like: "Suggest triggers based on what you know", "I'll write my own trigger phrases", and "Do both — suggest some and I'll add more".

If they want suggestions: Generate 5-8 realistic trigger phrases based on the domain and purpose. Present them as a list for the user to accept, modify, or extend.

If they want both: Generate suggestions first, then ask the user to add any they want.

**1g. Step 1 summary** — After all sub-steps are complete, present a clear summary of everything captured:

"Here's what I've got for your specialist so far:
- **Domain:** [domain]
- **Purpose:** [one-line summary]
- **Personality:** [style description]
- **Interaction style:** [always buttons / never buttons / selective]
- **Boundaries:** [list or 'none set']
- **Triggers:** [list of phrases]"

Then use AskUserQuestion to confirm: "Does this look right?" with options like "Yes, let's move on to the knowledge base" and "I want to change something".

If they want changes, loop back to the relevant sub-step.

**1h. Architecture check** — Based on the scope defined in Steps 1a-1f, consider whether this specialist would work better as a single skill or as multiple skills working together.

**Single skill** (the default for most specialists):
- One SKILL.md handles everything
- Simpler to build, test, and maintain
- Best when: the specialist has one clear job, one knowledge base, and a straightforward question-and-answer pattern
- This is what we'll build unless there's a clear reason not to

**Multi-skill with orchestration** (for more complex specialists):
- Multiple SKILL.md files, each handling a different aspect of the specialist's job
- A routing layer decides which skill to activate based on the user's request
- Best when: the specialist covers genuinely distinct workflows (e.g., a marketing specialist that does both strategy analysis AND content creation — these are different enough to warrant separate skills with separate instructions)
- Trade-off: more powerful but harder to build and maintain. Each skill needs to be independently useful, and the routing between them adds complexity

**How to decide:** If everything the user described in Steps 1a-1e feels like variations of the same kind of task (searching knowledge, answering questions, applying frameworks), single skill is the right choice. If the specialist needs to do fundamentally different types of work depending on the request, multi-skill is worth considering.

If the specialist scope suggests multi-skill might be beneficial, raise it. Use AskUserQuestion to explain that the specialist does a few quite different things and ask whether to keep it as one skill or split it up, with options like "Keep it simple — one skill", "Split it up — separate skills for each area", and "Tell me more about the trade-offs".

If they choose multi-skill: Plan the skill split — define what each skill covers, how they'll share (or not share) the knowledge base, and how routing will work. Then run through Steps 2-8 for each skill, keeping a master plan of how they fit together.

If the scope is clearly suited to a single skill (which most will be), skip this question entirely and proceed to Step 2.

### Step 2: Seed the Knowledge Base

Explain: "Now let's give your specialist some knowledge to work with. This is the reference material it will search through when answering questions.

Think of it like building a library for your specialist — everything it knows will come from what you put in here. We'll do this in rounds, so you can bring in as much as you like from different places."

Read `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/organisation-guide.md` for the full formatting specification. Apply this format to every entry you create.

#### The Import Loop

Repeat this loop until the user says they're done adding content:

**Ask what to import:** Use AskUserQuestion to ask where their knowledge lives, with options like "In Notion (databases or pages)", "In files on my computer (PDF, Word, or other documents)", "I'll paste or type it into the chat", and "A combination of these".

**For Notion:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/notion-import-guide.md`. This handles connection setup, database discovery, field mapping, and transformation — for structured databases, loose pages, and everything in between.

**For files:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/file-import-guide.md`. This handles PDFs, Word documents, CSVs, spreadsheets, markdown, plain text, and any other file type.

**For pasted text:** Read and follow the "Pasted Text" section of `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/file-import-guide.md`.

**For a combination:** Do sources in sequence. Between each source, continue through the loop.

#### Large Document Handling

When a source document is substantial (roughly 20+ pages or 5,000+ words), don't try to compress it into a handful of entries. Work through it section by section and extract many focused entries.

1. **Scan the structure first.** Identify chapters, sections, or natural breaks in the document. Present the structure to the user: "This document has [N] chapters/sections. Here's what I can see: [list of section titles or topics]."

2. **The golden rule: one concept per entry.** Each knowledge base entry should cover one idea, one framework, one technique, or one principle. If a chapter contains three distinct frameworks, that becomes three separate entries — not one large entry about the chapter.

   Entry length varies with the content. A single principle might be 150-200 words. A detailed workflow with steps and examples might be 400-800 words. The goal is that each entry is about one thing, not that every entry is the same length. A complete step-by-step workflow that needs all its steps to make sense should stay as one entry — don't artificially split it.

3. **Work through sections in order.** For each major section:
   - Extract the distinct concepts, frameworks, and ideas it contains
   - Create a separate entry for each one
   - Show the user what you've created after each section

4. **Tell the user what to expect.** Before processing a large document, explain: "This is a substantial document, so I'll work through it section by section. For a book-length source you might end up with 30-50+ individual entries — that's normal and actually makes your specialist much better at finding the right answer, because each entry is focused on one specific concept."

5. **Prioritise if needed.** If the document is very large (100+ pages), use AskUserQuestion to ask whether to work through everything or start with the most important sections, with options like "Work through everything", "Let me pick the most important sections", and "Start with the first few chapters and we'll see how it goes".

6. **Progress updates.** After every 5-10 entries created, give a brief update: "I've processed [section name] — that gave us [N] entries so far. Moving on to [next section]."

#### Entry Structure

**Structure each entry** with a metadata header (title, type, category, confidence, source, date_added, related, tags) followed by a title, a one-line summary, and the content itself broken into clear sections. Leave the `related` field empty for now — it gets populated in the post-import pass.

The metadata header is the bit between the `---` marks at the top of each entry — it stores information about the entry that helps with searching and organisation. Here's what each field means:
- **title** — the name of this entry
- **type** — what kind of knowledge it is (framework, technique, principle, etc.)
- **category** — which topic group it belongs to
- **confidence** — how well-established the information is (High, Medium, Low)
- **source** — where the information came from
- **date_added** — when it was added to the knowledge base
- **related** — links to connected entries (filled in later)
- **tags** — search keywords that help your specialist find this entry

**Previewing entries.** After creating the first 1-2 entries from a new source, show the user what an entry looks like:

"Here's an example of what I've created — this is how your specialist will store and search through information:"

Show them one completed entry. Then ask:

Use AskUserQuestion to check: "Does this format make sense? Happy with how I'm breaking down the content?" with options like "Yes, carry on", "I'd like the entries to be more detailed", "I'd like them to be more concise", and "Can you explain the structure?". Adjust the level of detail based on their feedback and continue.

#### 2a. Content Type Classification

As entries come in, classify each one. The types are:

| Type | What it means |
|------|---------------|
| `framework` | A multi-step system or methodology — something with stages or phases |
| `technique` | A specific tactical method — one thing you can do |
| `strategy` | A high-level approach or mental model — a way of thinking about something |
| `template` | A fill-in-the-blank structure someone can reuse |
| `example` | A case study or worked example — showing how something played out |
| `reference` | Data, benchmarks, or lookup material — facts to check against |
| `principle` | A fundamental truth or rule — something that's always (or almost always) true |

Explain to the user once (at the first classification): "I'm classifying each piece of knowledge by type — like whether it's a step-by-step framework, a specific technique, or a real-world example. This helps your specialist give more targeted answers later."

#### 2b. Overlap Detection

**Every time new entries are about to be added**, check them against what already exists in the knowledge base. For each new entry, compare its title, tags, and core topic against all existing entries.

There are three possible outcomes:

1. **No overlap** — the entry covers new ground. Add it normally.
2. **Partial overlap** — the new entry covers similar territory to an existing one but adds meaningful new detail, a different angle, or comes from a different source. Recommend: "This overlaps with [existing entry title] but adds [what's new]. I'd suggest keeping both — they complement each other." Or: "This overlaps significantly with [existing entry title]. Want me to merge the new information into the existing entry instead of creating a separate one?"
3. **Near-duplicate** — the new entry says essentially the same thing as an existing one. Recommend: "This is very similar to [existing entry title] that already exists. I'd recommend skipping it, or I can add any missing details to the existing entry."

Present overlap findings as a simple list before writing any files:

"Before I add these, here's what I found:
- [Entry A] — new, no overlap
- [Entry B] — overlaps with [existing entry] — recommend merging
- [Entry C] — new, no overlap
- [Entry D] — near-duplicate of [existing entry] — recommend skipping"

Use AskUserQuestion to ask how to handle the overlaps, with options like "Add them all as suggested", "Let me decide on each one", and "Add everything — I'll sort it out later".

**After each batch completes**, report progress and use AskUserQuestion to ask whether they want to bring in more content, with options like "Yes — I have more to add" and "No — I'm happy with what's in there". If yes, loop back to the import question. If no, proceed to the Post-Import Pass (Step 2c).

#### 2c. Post-Import: Categories, Types, and Connections

**Only run this after the user confirms they're done adding content.** This is where the knowledge base gets its structure.

Explain: "Now that everything's in, I'm going to look across all the entries together to tidy up the categories, check the classifications are right, and map out how entries connect to each other. This takes a minute but makes your specialist much better at finding related information."

**Categories:** Look at all entries and check — are there categories with only 1 entry that should be merged? Categories that are too broad and should be split? Duplicate category names? Propose any changes and confirm with the user.

**Types:** Scan all entries and flag any where the content type might be wrong — e.g., something classified as a "framework" that's really more of a "principle". Propose changes and confirm.

**Connections:** Identify natural connections between entries — things commonly used together, entries that build on each other, complementary perspectives on the same topic. Update each entry's `related` field with connected entries. Aim for 2-5 connections per entry.

Show the user a summary of the connections you've mapped.

Use AskUserQuestion to confirm the connections look right, with options like "Yes, looks good", "I want to adjust some", and "Can you explain why [X] connects to [Y]?".

**Tags:** Final pass on search keywords — make sure each entry has 5-10 tags including the main topic words, common synonyms, related concepts someone might search for, and abbreviations.

### Step 3: KB Sharing Decision

Explain: "You can make this knowledge base available to other specialists you build later — useful if you have knowledge that applies across multiple areas. For example, a 'writing style' knowledge base could be shared between a blog specialist and a social media specialist."

Use AskUserQuestion to ask whether the knowledge base should be shared, with options like "Yes, save as a shared knowledge base", "No, keep it exclusive to this specialist", and "Connect to an existing shared knowledge base".

If shared: Save a copy of the KB to `_shared-kbs/{kb-name}/` in the user's projects folder. Read `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/kb-sharing-guide.md` for implementation details.

If connecting to existing: List available shared KBs from `_shared-kbs/` and let the user choose.

### Step 4: Organise and Review

Present the user with a clear summary of what's in their knowledge base:

- Total entry count
- Category breakdown (how many entries per category)
- Table of contents (entry names organised by category)
- Any obvious gaps or thin areas — "I notice you have a lot about [X] but nothing about [Y] — is that intentional, or should we add something?"

Use AskUserQuestion to ask if the knowledge base looks complete, with options like "Yes, looks good — let's move on", "I want to add more", "Remove some entries", and "Reorganise the categories". Loop back to Step 2 if they want to add more, or handle removals/reorganisation inline. Only proceed when the user confirms they're happy.

### Step 5: Choose Search Tier

Explain the choice in plain terms:

"Your specialist needs a way to search through its knowledge base when someone asks a question. There are two options:

**Standard search** matches keywords — it's simple, works straight away, and doesn't need any extra setup. If your knowledge base mentions 'retention' and someone asks about 'retention', it finds it. This works well for most specialists.

**Advanced search** understands meaning — so if someone asks about 'keeping viewers watching' it can find your content about 'retention hooks' even though the exact words are different. It's more powerful but needs a small bit of extra setup (an API key from an embedding service, which has a free tier)."

Use AskUserQuestion to ask how the specialist should search, with options like "Standard search (recommended — simple and works straight away)", "Advanced search (understands meaning — needs a quick setup step)", and "Tell me more about the difference".

If they want more detail: Give a concrete example showing the same query against both methods, then ask again.

**If Standard search:**
Note to Claude: The specialist will use `kb_search.py` (a standard keyword search script). No additional setup needed. Copy the script from `${CLAUDE_PLUGIN_ROOT}/scripts/kb_search.py`.

**If Advanced search:**
Walk through setup step by step:

1. "You'll need an API key from either Voyage AI or OpenAI. Voyage AI is recommended — it's designed specifically for search and has a generous free tier."
2. Provide numbered instructions for getting a Voyage AI key
3. Ask the user to provide the key (they'll need to set it as an environment variable)
4. Copy both search scripts from `${CLAUDE_PLUGIN_ROOT}/scripts/`
5. Run the embedding script to pre-compute vectors:
   ```
   python ${CLAUDE_PLUGIN_ROOT}/scripts/kb_embed.py
   ```
6. Confirm embeddings generated successfully

### Step 6: Generate the Specialist

Explain: "Now I'm going to assemble everything into a working specialist. This creates all the files it needs — the instruction file that tells it how to behave, the search scripts, the knowledge base, and the packaging information."

**6a. Create the specialist directory** at a working location:
```
{specialist-slug}/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── {specialist-slug}/
│       └── SKILL.md
├── references/
│   └── {categories}/
│       └── {files}.md
├── scripts/
│   ├── kb_search.py
│   ├── kb_vector_search.py  (always include for upgrade path)
│   └── kb_embed.py          (always include for upgrade path)
└── README.md
```

**6b. Fill the SKILL.md template.** Read the appropriate template from references:
- Standard search: `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/skill-template-bm25.md`
- Advanced search: `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/skill-template-vector.md`

Replace all `{{PLACEHOLDER}}` variables with the values gathered in Steps 1-5:

| Placeholder | Source |
|-------------|--------|
| `{{SPECIALIST_SLUG}}` | Kebab-case version of the domain name |
| `{{SPECIALIST_NAME}}` | Human-readable specialist name |
| `{{SKILL_DESCRIPTION}}` | Third-person trigger description with quoted phrases |
| `{{PERSONALITY_DESCRIPTION}}` | From Step 1c personality choice |
| `{{DOMAIN}}` | Domain name confirmed in Step 1b |
| `{{COMMUNICATION_STYLE}}` | Built from personality choice + communication baseline |
| `{{KB_SUMMARY}}` | Category list with descriptions from Step 4 |
| `{{INTERACTION_STYLE}}` | From Step 1d interaction style choice (see variants below) |
| `{{EMBEDDING_PROVIDER}}` | "Voyage AI" or "OpenAI" (advanced search only) |

**`{{INTERACTION_STYLE}}` variants** — use the one matching the user's choice in Step 1d:

*If "Always use buttons":*
> When you need the user's input — whether it's a choice between approaches, a confirmation, or a "what next?" — use AskUserQuestion so they get clickable buttons. AskUserQuestion always includes a free-text input and a Skip option automatically, so don't add "Other" or "None" as choices. One question per AskUserQuestion — never combine multiple decisions. Give a brief explanation before each question so the user knows what they're choosing and why it matters.

*If "Never use buttons":*
> Ask questions conversationally — just ask in plain text as part of your response. Keep questions clear and specific. When there are distinct options, lay them out naturally in your message (e.g., "We could go with A, which does X, or B, which does Y — what sounds right?"). One question at a time — don't stack multiple questions in a single response.

*If "Mix it up — selective":*
> For most interactions, just ask questions naturally in conversation. But when the user faces a meaningful decision with distinct options — choosing between approaches, confirming something important, or picking a direction — use AskUserQuestion so they get clickable buttons. AskUserQuestion always includes a free-text input and a Skip option automatically, so don't add "Other" or "None" as choices. The rule of thumb: if there are 2-4 clear options and the choice matters, use buttons. If it's a simple yes/no or open-ended question, just ask conversationally.

For `{{COMMUNICATION_STYLE}}`, start from the communication baseline in `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/communication-baseline.md` and adjust based on the user's personality choice.

For `{{SKILL_DESCRIPTION}}`, write it in third-person with trigger phrases: "This skill should be used when the user asks about [domain topics], [example phrases in quotes], or needs help with [specific tasks]."

**6c. Fill the plugin.json template.** Read `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/plugin-json-template.json` and replace:

| Placeholder | Value |
|-------------|-------|
| `{{PLUGIN_SLUG}}` | Same as specialist slug |
| `{{PLUGIN_DESCRIPTION}}` | Short description of what the specialist does |
| `{{AUTHOR_NAME}}` | Ask the user or default to "Built with Specialist Sub-Agent Builder" |

**6d. Fill the README template.** Read `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/readme-template.md` and replace all placeholders using the gathered information.

**6e. Copy search scripts** from `${CLAUDE_PLUGIN_ROOT}/scripts/` into the specialist's scripts/ folder. Always copy all three scripts (kb_search.py, kb_vector_search.py, kb_embed.py) — even for standard search specialists, the advanced search scripts are included so the user can upgrade later without rebuilding.

**6f. Copy KB content** — move the organised reference files into the specialist's references/ folder.

**6g. If advanced search tier** — also copy the generated kb_data/ folder with embeddings.npz and chunks.json.

### Step 7: Test

Explain: "Let's test your specialist before we package it up. I'll run a few searches and show you how it responds."

Run a three-part test:

**7a. Search quality test** — Generate 3-5 questions that someone in this domain would ask. For each question, run the search script and show the user what was found:

```
python {specialist-dir}/scripts/kb_search.py "test question" --top 3
```

Show the results in plain language: "For the question '[question]', your specialist found these entries: [list with brief descriptions of why each matched]."

Use AskUserQuestion to ask how the search results looked, with options like "Good — it found relevant content", "It missed something important", "The results weren't relevant", and "Let me try my own question". If results are poor, diagnose: Are keyword tags missing? Is the content too sparse? Suggest fixes and re-test.

**7b. Live interaction test** — Simulate a real question. Search the KB, then compose a response as the specialist would, grounding it in the search results. Show this to the user.

Use AskUserQuestion to ask how the response was, with options like "Good", "Tone needs adjusting", "It missed important context", and "Let me ask a different question".

**7c. Edge case test** — Ask a question clearly outside the specialist's domain. Verify the specialist identifies its boundaries and responds appropriately.

Use AskUserQuestion to ask if they're happy with the boundary handling, with options like "Yes", "It should have known that — let me add more content", and "The boundary message needs tweaking". Loop back to earlier steps if the user wants to make changes. Only proceed to packaging when they're satisfied.

### Step 8: Save and Install

Package the specialist using the packaging script:

```bash
python ${CLAUDE_PLUGIN_ROOT}/scripts/package_specialist.py {specialist-dir}/ /tmp/{specialist-slug}.plugin
```

Then save the .plugin file to `RESOURCES/PLUGINS/` in the user's workspace. This is where all plugins live in CoWork OS. If the folder doesn't exist, create it.

Explain: "Your specialist is packaged and saved to RESOURCES/PLUGINS/. Now let's install it."

Present the .plugin file using the `present_files` tool so the user gets a "Copy to your skills" install button.

Use AskUserQuestion to ask what they'd like to do next, with options like "Install it now", "I'll install it later", and "Make some changes first".

If they want to install: Point out the "Copy to your skills" button that appeared when the file was presented. Explain: "Click that button to install it. Once installed, it'll be available the next time you start a conversation. The file is also saved in your RESOURCES/PLUGINS/ folder for safekeeping."

If they want to install later: Explain: "No problem. It's saved in RESOURCES/PLUGINS/ whenever you're ready. Just drag the .plugin file into any CoWork chat to install it."

If they want changes: Ask what they want to change and loop back to the relevant step.

## Builder Templates and Scripts

The following files are bundled with this builder and used during specialist creation:

**Templates** (in `${CLAUDE_PLUGIN_ROOT}/skills/build-specialist/references/`):
- `skill-template-bm25.md` — SKILL.md template for standard search specialists
- `skill-template-vector.md` — SKILL.md template for advanced search specialists
- `plugin-json-template.json` — Plugin manifest template
- `readme-template.md` — README template
- `communication-baseline.md` — Default communication style rules
- `organisation-guide.md` — How to structure a good knowledge base
- `kb-sharing-guide.md` — How shared knowledge bases work
- `notion-import-guide.md` — How to import KB entries from Notion (databases, pages, or mixed)
- `file-import-guide.md` — How to import KB entries from files (PDF, DOCX, CSV, pasted text, transcripts)

**Scripts** (in `${CLAUDE_PLUGIN_ROOT}/scripts/`):
- `kb_search.py` — Standard keyword search (copied into every specialist)
- `kb_vector_search.py` — Advanced meaning-based search (copied for upgrade path)
- `kb_embed.py` — Embedding generation for advanced search (copied for upgrade path)
- `package_specialist.py` — Plugin packaging
