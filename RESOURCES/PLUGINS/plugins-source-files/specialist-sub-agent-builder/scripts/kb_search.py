#!/usr/bin/env python3
"""
BM25 Knowledge Base Search — Default search tier for Specialist Sub-Agents.

Reads markdown files from the references/ folder, splits them into chunks
by heading, builds a BM25 index, and returns the top N most relevant chunks
for a given query.

Supports YAML frontmatter for structured metadata (type, category, tags,
related entries, confidence). Metadata is stored alongside chunks for
filtering and context — not stuffed into chunk text.

Usage:
    python scripts/kb_search.py "your search query" --top 5
    python scripts/kb_search.py "hook framework" --type framework --top 3

How it works:
    1. Walks the references/ directory for .md files
    2. Parses YAML frontmatter (if present) into structured metadata
    3. Splits each file into chunks at H1/H2/H3 headings
    4. Tokenises chunks into lowercase words
    5. Builds a BM25 index using rank_bm25
    6. Scores every chunk against the query (tags boost matching)
    7. Returns the top N chunks with source info and metadata
"""

import argparse
import os
import re
import sys
from pathlib import Path

from rank_bm25 import BM25Okapi


# ---------------------------------------------------------------------------
# 1. YAML frontmatter parsing
# ---------------------------------------------------------------------------

def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter from markdown text.

    Returns (metadata_dict, body_text). If no frontmatter is found,
    returns an empty dict and the original text.

    Handles the --- delimited YAML block at the top of markdown files.
    Uses simple key-value parsing (no PyYAML dependency needed).
    """
    frontmatter_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
    match = frontmatter_pattern.match(text)

    if not match:
        return {}, text

    yaml_block = match.group(1)
    body = text[match.end():]

    metadata = {}
    current_key = None
    current_list = None

    for line in yaml_block.split("\n"):
        stripped = line.strip()

        # Skip empty lines and comments
        if not stripped or stripped.startswith("#"):
            continue

        # Check for list item (indented line starting with -)
        if stripped.startswith("- ") and current_key:
            if current_list is None:
                current_list = []
            current_list.append(stripped[2:].strip())
            metadata[current_key] = current_list
            continue

        # Check for key: value pair
        if ":" in stripped:
            # Save any pending list
            current_list = None

            colon_idx = stripped.index(":")
            key = stripped[:colon_idx].strip()
            value = stripped[colon_idx + 1:].strip()

            current_key = key

            if value:
                # Inline value — could be a simple string or inline list
                metadata[key] = value
            # If no value, it might be followed by a list (handled in next iterations)

    return metadata, body


# ---------------------------------------------------------------------------
# 2. Load and chunk markdown files
# ---------------------------------------------------------------------------

def load_references(references_dir: str) -> list[dict]:
    """Walk references/ and split every .md file into heading-based chunks.

    Each chunk carries structured metadata from YAML frontmatter.
    """
    chunks = []
    ref_path = Path(references_dir)

    if not ref_path.exists():
        print(f"Error: references directory not found at {references_dir}", file=sys.stderr)
        sys.exit(1)

    for md_file in sorted(ref_path.rglob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        source = str(md_file.relative_to(ref_path))

        # Parse frontmatter
        metadata, body = parse_frontmatter(text)

        # Extract structured fields
        entry_meta = {
            "entry_title": metadata.get("title", ""),
            "type": metadata.get("type", ""),
            "category": metadata.get("category", ""),
            "confidence": metadata.get("confidence", ""),
            "source_ref": metadata.get("source", ""),
            "date_added": metadata.get("date_added", ""),
            "tags": _parse_list_field(metadata.get("tags", "")),
            "related": _parse_list_field(metadata.get("related", "")),
        }

        file_chunks = split_by_headings(body, source=source, entry_meta=entry_meta)
        chunks.extend(file_chunks)

    return chunks


def _parse_list_field(value) -> list[str]:
    """Parse a field that could be a list or comma-separated string."""
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value:
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def split_by_headings(text: str, source: str, entry_meta: dict = None) -> list[dict]:
    """Split markdown text at H1/H2/H3 boundaries into self-contained chunks.

    Metadata from frontmatter is attached to each chunk as structured data,
    NOT prepended to the chunk text. This keeps chunk content clean for
    embedding while preserving metadata for filtering and context.

    Legacy support: if no frontmatter was found, falls back to detecting
    bold-text metadata blocks (Tags, Category, etc.) and extracts them.
    """
    if entry_meta is None:
        entry_meta = {}

    heading_pattern = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)
    matches = list(heading_pattern.finditer(text))

    if not matches:
        # No headings — treat whole file as one chunk
        content = text.strip()
        if content:
            chunk = {
                "title": entry_meta.get("entry_title", source),
                "content": content,
                "source": source,
            }
            chunk.update(entry_meta)
            return [chunk]
        return []

    chunks = []

    # Content before the first heading — in new format this is the blockquote
    # summary. In legacy format this is the bold-text metadata block.
    preamble = text[: matches[0].start()].strip()

    # Legacy detection: if no frontmatter metadata was found, try to extract
    # tags from the bold-text preamble (backwards compatibility)
    if not entry_meta.get("tags") and preamble:
        legacy_meta = _extract_legacy_metadata(preamble)
        if legacy_meta:
            entry_meta.update(legacy_meta)

    for i, match in enumerate(matches):
        heading_text = match.group(2).strip()
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()

        # For BM25, prepend the blockquote summary (if any) to give context.
        # But NOT the full preamble with metadata — that's in structured fields now.
        blockquote = _extract_blockquote(preamble)
        if blockquote:
            body = blockquote + "\n\n" + body

        if len(body.split()) < 5:
            continue  # Skip near-empty chunks

        chunk = {
            "title": heading_text,
            "content": body,
            "source": source,
        }
        chunk.update(entry_meta)
        chunks.append(chunk)

    return chunks


def _extract_blockquote(preamble: str) -> str:
    """Extract blockquote summary from preamble text (> lines)."""
    lines = []
    for line in preamble.split("\n"):
        stripped = line.strip()
        if stripped.startswith(">"):
            lines.append(stripped[1:].strip())
    return " ".join(lines) if lines else ""


def _extract_legacy_metadata(preamble: str) -> dict:
    """Extract metadata from bold-text format (backwards compatibility).

    Parses lines like:
        **Tags:** hooks, opening, first seconds
        **Category:** Hook & Structure
    """
    meta = {}
    for line in preamble.split("\n"):
        stripped = line.strip()
        if stripped.startswith("**Tags:**"):
            tags_str = stripped.replace("**Tags:**", "").strip()
            meta["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
        elif stripped.startswith("**Category:**"):
            meta["category"] = stripped.replace("**Category:**", "").strip()
        elif stripped.startswith("**Confidence:**"):
            meta["confidence"] = stripped.replace("**Confidence:**", "").strip()
        elif stripped.startswith("**Source:**"):
            meta["source_ref"] = stripped.replace("**Source:**", "").strip()
        elif stripped.startswith("**Date Added:**"):
            meta["date_added"] = stripped.replace("**Date Added:**", "").strip()
    return meta


# ---------------------------------------------------------------------------
# 3. Tokenise
# ---------------------------------------------------------------------------

def tokenise(text: str) -> list[str]:
    """Lowercase word tokenisation — simple but effective for BM25."""
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower())


# ---------------------------------------------------------------------------
# 4. Search
# ---------------------------------------------------------------------------

def search(query: str, chunks: list[dict], top_n: int = 5,
           type_filter: str = None) -> list[dict]:
    """Run a BM25 search and return the top N chunks with scores.

    Tags from each chunk's metadata are appended to the chunk text during
    tokenisation to boost keyword matching — without permanently altering
    the stored content.

    Optionally filter by content type (framework, technique, strategy, etc.).
    """
    if not chunks:
        return []

    # Apply type filter if specified
    filtered = chunks
    if type_filter:
        filtered = [c for c in chunks if c.get("type", "").lower() == type_filter.lower()]
        if not filtered:
            # Fall back to all chunks if filter matches nothing
            filtered = chunks

    # Build corpus with tag boosting — tags are added to tokenisation input
    # but not stored in the chunk content
    corpus = []
    for c in filtered:
        text = c["content"]
        tags = c.get("tags", [])
        if tags:
            text = text + " " + " ".join(tags)
        corpus.append(tokenise(text))

    bm25 = BM25Okapi(corpus)

    query_tokens = tokenise(query)
    scores = bm25.get_scores(query_tokens)

    # Pair chunks with scores, sort descending
    ranked = sorted(zip(filtered, scores), key=lambda x: x[1], reverse=True)

    results = []
    for chunk, score in ranked[:top_n]:
        if score <= 0:
            break
        result = {
            "title": chunk["title"],
            "source": chunk["source"],
            "score": round(float(score), 4),
            "content": chunk["content"],
            "entry_title": chunk.get("entry_title", ""),
            "type": chunk.get("type", ""),
            "category": chunk.get("category", ""),
            "tags": chunk.get("tags", []),
            "related": chunk.get("related", []),
            "confidence": chunk.get("confidence", ""),
        }
        results.append(result)

    return results


# ---------------------------------------------------------------------------
# 5. Output
# ---------------------------------------------------------------------------

def format_results(results: list[dict], query: str) -> str:
    """Format search results for Claude to read, including metadata."""
    if not results:
        return f"No results found for: {query}"

    lines = [f"Search results for: {query}", f"Found {len(results)} relevant chunks:", ""]

    for i, r in enumerate(results, 1):
        lines.append(f"--- Result {i} (score: {r['score']}) ---")
        lines.append(f"Source: {r['source']}")
        lines.append(f"Section: {r['title']}")

        # Include metadata when available
        if r.get("entry_title"):
            lines.append(f"Entry: {r['entry_title']}")
        if r.get("type"):
            lines.append(f"Type: {r['type']}")
        if r.get("category"):
            lines.append(f"Category: {r['category']}")
        if r.get("confidence"):
            lines.append(f"Confidence: {r['confidence']}")
        if r.get("related"):
            lines.append(f"Related: {', '.join(r['related'])}")

        lines.append("")
        lines.append(r["content"])
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 6. CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="BM25 Knowledge Base Search")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top", type=int, default=5, help="Number of results (default: 5)")
    parser.add_argument("--type", default=None,
                        help="Filter by content type (framework, technique, strategy, etc.)")
    parser.add_argument("--refs", default=None,
                        help="Path to references/ directory (default: auto-detect)")
    args = parser.parse_args()

    # Auto-detect references/ relative to this script's location
    if args.refs:
        refs_dir = args.refs
    else:
        script_dir = Path(__file__).resolve().parent
        refs_dir = str(script_dir.parent / "references")

    chunks = load_references(refs_dir)

    if not chunks:
        print("No content found in references directory.", file=sys.stderr)
        sys.exit(1)

    results = search(args.query, chunks, top_n=args.top, type_filter=args.type)
    print(format_results(results, args.query))


if __name__ == "__main__":
    main()
