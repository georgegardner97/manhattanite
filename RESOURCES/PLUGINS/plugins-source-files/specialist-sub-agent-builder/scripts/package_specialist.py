#!/usr/bin/env python3
"""
Specialist Plugin Packager — Assembles a specialist sub-agent into a .plugin file.

Takes a specialist build directory and packages it into a ready-to-install
.plugin file (which is just a zip archive with the right structure).

Usage:
    python package_specialist.py /path/to/specialist-dir /path/to/output.plugin

What it does:
    1. Validates the specialist directory has required files
    2. Creates the .claude-plugin/plugin.json manifest
    3. Packages everything into a .plugin zip file
    4. Reports the final file size and contents

The builder skill calls this script after all files have been created.
"""

import argparse
import json
import os
import sys
import zipfile
from pathlib import Path


# ---------------------------------------------------------------------------
# 1. Validation
# ---------------------------------------------------------------------------

def validate_specialist(specialist_dir: Path) -> list[str]:
    """Check that all required files exist. Returns list of issues."""
    issues = []

    # Must have a skill directory with SKILL.md
    skills = list(specialist_dir.glob("skills/*/SKILL.md"))
    if not skills:
        issues.append("No SKILL.md found in skills/ directory")

    # Must have references with at least one .md file
    refs = list(specialist_dir.glob("references/**/*.md"))
    if not refs:
        issues.append("No reference files found in references/ directory")

    # Must have at least one search script
    has_bm25 = (specialist_dir / "scripts" / "kb_search.py").exists()
    has_vector = (specialist_dir / "scripts" / "kb_vector_search.py").exists()
    if not has_bm25 and not has_vector:
        issues.append("No search script found in scripts/ directory")

    # If vector search is the ONLY search method, embeddings are required
    if has_vector and not has_bm25:
        if not (specialist_dir / "kb_data" / "embeddings.npz").exists():
            issues.append("Vector search script exists but no embeddings.npz found in kb_data/")
    # If both exist but no embeddings, just warn (BM25 is still functional)
    elif has_vector and has_bm25:
        if not (specialist_dir / "kb_data" / "embeddings.npz").exists():
            pass  # BM25 specialist with vector script included for future upgrade — fine

    # Must have plugin.json
    if not (specialist_dir / ".claude-plugin" / "plugin.json").exists():
        issues.append("No .claude-plugin/plugin.json manifest found")

    # Must have README
    if not (specialist_dir / "README.md").exists():
        issues.append("No README.md found")

    return issues


# ---------------------------------------------------------------------------
# 2. Packaging
# ---------------------------------------------------------------------------

def package_plugin(specialist_dir: Path, output_path: Path) -> dict:
    """Create a .plugin zip file from the specialist directory."""
    stats = {"files": 0, "total_size": 0, "file_list": []}

    # Write to /tmp first, then move (avoids permission issues with output dirs)
    tmp_path = Path("/tmp") / output_path.name

    with zipfile.ZipFile(str(tmp_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(str(specialist_dir)):
            # Skip hidden dirs (except .claude-plugin), __pycache__, etc.
            dirs[:] = [
                d for d in dirs
                if d == ".claude-plugin" or (not d.startswith(".") and d != "__pycache__")
            ]

            for fname in sorted(files):
                if fname.startswith(".") and fname != ".mcp.json":
                    continue
                if fname == ".DS_Store":
                    continue
                if fname.endswith(".pyc"):
                    continue

                full_path = Path(root) / fname
                arc_name = str(full_path.relative_to(specialist_dir))

                zf.write(str(full_path), arc_name)
                file_size = full_path.stat().st_size
                stats["files"] += 1
                stats["total_size"] += file_size
                stats["file_list"].append(arc_name)

    # Move from tmp to final location
    import shutil
    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(tmp_path), str(output_path))

    stats["output_path"] = str(output_path)
    stats["output_size"] = output_path.stat().st_size

    return stats


# ---------------------------------------------------------------------------
# 3. Reporting
# ---------------------------------------------------------------------------

def format_report(stats: dict, issues: list[str]) -> str:
    """Format a human-readable packaging report."""
    lines = []

    if issues:
        lines.append("VALIDATION ISSUES:")
        for issue in issues:
            lines.append(f"  - {issue}")
        lines.append("")

    lines.append(f"Packaged {stats['files']} files into: {stats['output_path']}")
    lines.append(f"Plugin size: {stats['output_size'] / 1024:.1f} KB")
    lines.append("")
    lines.append("Contents:")
    for f in stats["file_list"]:
        lines.append(f"  {f}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 4. CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Package a specialist as a .plugin file")
    parser.add_argument("specialist_dir", help="Path to the specialist directory")
    parser.add_argument("output", help="Path for the output .plugin file")
    parser.add_argument("--force", action="store_true",
                        help="Package even if validation fails (not recommended)")
    args = parser.parse_args()

    specialist_dir = Path(args.specialist_dir).resolve()
    output_path = Path(args.output).resolve()

    if not specialist_dir.exists():
        print(f"Error: Directory not found: {specialist_dir}", file=sys.stderr)
        sys.exit(1)

    # Validate
    issues = validate_specialist(specialist_dir)
    if issues and not args.force:
        print("Validation failed:", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
        print("\nUse --force to package anyway (not recommended).", file=sys.stderr)
        sys.exit(1)

    # Package
    stats = package_plugin(specialist_dir, output_path)
    print(format_report(stats, issues))


if __name__ == "__main__":
    main()
