# Specialist Sub-Agent Builder

Build custom AI specialist sub-agents — AI assistants with their own searchable knowledge bases, packaged as ready-to-install `.plugin` files.

## What It Does

Turn your expertise into a specialist that can answer questions grounded in your specific knowledge. The builder walks you through the whole process step by step — no technical skills needed.

You define what the specialist knows, how it communicates, and what topics it covers. The builder handles the rest: organising your knowledge, setting up search, testing, and packaging.

## How to Use

Say "build a specialist" or "create a specialist" and the guided workflow starts.

The builder will ask you:
1. What should the specialist help with?
2. Where does your knowledge live? (files or manual entry)
3. Should the knowledge base be shared across specialists?
4. How should the search work? (standard keyword search or advanced semantic search)
5. How does it look after testing?

At the end, you get a `.plugin` file ready to install.

## What's Inside

**Skill:** `build-specialist` — The guided creation workflow

**Scripts:**
- `kb_search.py` — Standard keyword search (BM25)
- `kb_vector_search.py` — Advanced semantic search (requires API key)
- `kb_embed.py` — Generates search embeddings for advanced tier
- `package_specialist.py` — Packages the finished specialist

**Reference material:**
- Organisation guide — how to structure knowledge for best search results
- Communication baseline — default tone for generated specialists
- Templates — SKILL.md, plugin.json, README for generated specialists

## Search Tiers

**Standard (recommended):** Matches keywords. Free, instant, no setup. Works well for clearly written knowledge bases under ~100 documents.

**Advanced:** Understands meaning. Finds content even when different words are used. Requires an embedding API key (Voyage AI or OpenAI). Best for large or conceptually diverse knowledge bases.

Specialists start with standard search and can be upgraded to advanced later without rebuilding the knowledge base.

## Created By

[Better Creating](https://bettercreating.com)
