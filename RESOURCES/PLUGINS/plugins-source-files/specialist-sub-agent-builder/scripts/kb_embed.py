#!/usr/bin/env python3
"""
Embedding Generator — Pre-computes vector embeddings for all KB chunks.

This script must be run before kb_vector_search.py can work. It:
1. Reads all markdown files from references/
2. Splits them into heading-based chunks (same logic as kb_search.py)
3. Sends each chunk's CONTENT to the embedding API (frontmatter excluded)
4. Saves embeddings as .npz and chunk metadata as .json

The metadata (type, category, tags, related entries) is stored in chunks.json
alongside the content but is NOT included in the embedding vectors. This keeps
embeddings focused on semantic meaning rather than metadata noise.

Output:
    kb_data/embeddings.npz  — numpy array of embedding vectors
    kb_data/chunks.json     — chunk metadata + content (title, source, type, etc.)

Usage:
    python scripts/kb_embed.py

Environment variables:
    VOYAGE_API_KEY  — Voyage AI API key (preferred)
    OPENAI_API_KEY  — OpenAI API key (fallback)
"""

import json
import os
import sys
import time
from pathlib import Path

import numpy as np

# Reuse the chunking logic from kb_search
sys.path.insert(0, str(Path(__file__).resolve().parent))
from kb_search import load_references


# ---------------------------------------------------------------------------
# 1. Embedding providers (batch versions)
# ---------------------------------------------------------------------------

def get_embedding_provider():
    """Detect which embedding API is available."""
    if os.environ.get("VOYAGE_API_KEY"):
        return "voyage"
    elif os.environ.get("OPENAI_API_KEY"):
        return "openai"
    else:
        print(
            "Error: No embedding API key found.\n"
            "Set one of these environment variables:\n"
            "  VOYAGE_API_KEY  (recommended — cheaper and high quality)\n"
            "  OPENAI_API_KEY  (alternative)\n",
            file=sys.stderr,
        )
        sys.exit(1)


def embed_batch_voyage(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using Voyage AI."""
    import urllib.request

    api_key = os.environ["VOYAGE_API_KEY"]
    data = json.dumps({
        "input": texts,
        "model": "voyage-3-lite",
        "input_type": "document",
    }).encode()

    req = urllib.request.Request(
        "https://api.voyageai.com/v1/embeddings",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    return [item["embedding"] for item in result["data"]]


def embed_batch_openai(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using OpenAI."""
    import urllib.request

    api_key = os.environ["OPENAI_API_KEY"]
    data = json.dumps({
        "input": texts,
        "model": "text-embedding-3-small",
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/embeddings",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    # OpenAI returns embeddings sorted by index
    sorted_data = sorted(result["data"], key=lambda x: x["index"])
    return [item["embedding"] for item in sorted_data]


def embed_batch(texts: list[str], provider: str, batch_size: int = 20) -> list[list[float]]:
    """Embed texts in batches, respecting API limits."""
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        print(f"  Embedding batch {i // batch_size + 1} ({len(batch)} chunks)...")

        if provider == "voyage":
            embeddings = embed_batch_voyage(batch)
        elif provider == "openai":
            embeddings = embed_batch_openai(batch)
        else:
            raise ValueError(f"Unknown provider: {provider}")

        all_embeddings.extend(embeddings)

        # Brief pause between batches to respect rate limits
        if i + batch_size < len(texts):
            time.sleep(0.5)

    return all_embeddings


# ---------------------------------------------------------------------------
# 2. Main
# ---------------------------------------------------------------------------

def main():
    provider = get_embedding_provider()
    print(f"Using embedding provider: {provider}")

    # Locate directories
    script_dir = Path(__file__).resolve().parent
    specialist_dir = script_dir.parent
    refs_dir = str(specialist_dir / "references")
    data_dir = specialist_dir / "kb_data"

    # Load and chunk
    print(f"Loading references from: {refs_dir}")
    chunks = load_references(refs_dir)
    print(f"Found {len(chunks)} chunks across all KB files.")

    if not chunks:
        print("No chunks found. Check your references/ directory.", file=sys.stderr)
        sys.exit(1)

    # Generate embeddings — embed ONLY the content text, not metadata
    # This keeps embeddings focused on semantic meaning
    print("Generating embeddings...")
    texts = [c["content"] for c in chunks]
    embeddings = embed_batch(texts, provider)

    # Save
    data_dir.mkdir(parents=True, exist_ok=True)

    embeddings_array = np.array(embeddings, dtype=np.float32)
    np.savez_compressed(str(data_dir / "embeddings.npz"), embeddings=embeddings_array)

    # Save chunk metadata with all structured fields
    chunks_meta = []
    for c in chunks:
        chunk_entry = {
            "title": c["title"],
            "source": c["source"],
            "content": c["content"],
            "entry_title": c.get("entry_title", ""),
            "type": c.get("type", ""),
            "category": c.get("category", ""),
            "tags": c.get("tags", []),
            "related": c.get("related", []),
            "confidence": c.get("confidence", ""),
        }
        chunks_meta.append(chunk_entry)

    with open(data_dir / "chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks_meta, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Saved {len(chunks)} embeddings to:")
    print(f"  {data_dir / 'embeddings.npz'}")
    print(f"  {data_dir / 'chunks.json'}")
    print(f"\nEmbedding dimensions: {embeddings_array.shape}")

    # Summary of content types found
    types = {}
    for c in chunks:
        t = c.get("type", "untyped") or "untyped"
        types[t] = types.get(t, 0) + 1
    if any(t != "untyped" for t in types):
        print(f"\nContent types: {dict(sorted(types.items()))}")


if __name__ == "__main__":
    main()
