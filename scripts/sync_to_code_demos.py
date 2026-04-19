#!/usr/bin/env python3
"""
sync_to_code_demos.py -- publish chapter notebooks to the code_demos repo.

The AIHandsOnBook chapters are the single source of truth for every notebook.
The sibling `code_demos` repo (nested working copy at AIHandsOnBook/code_demos/,
which is git-ignored here and maintained as its own GitHub repo) must stay a
bit-identical copy so the "Open in Colab" badges in the book keep working.

Workflow:

    # After editing a chapter notebook:
    python scripts/sync_to_code_demos.py

    # Then, inside AIHandsOnBook/code_demos/, commit and push as usual.

Add a new entry to NOTEBOOK_PAIRS whenever a new chapter notebook should be
published to code_demos. Until an entry is added, the notebook will appear in
the ORPHANS section of the output -- that's the early-warning signal that the
two repos have drifted.

Exit codes:
    0   all mapped pairs are identical after sync
    1   drift detected, a source file is missing, or --strict is set and
        there are orphan code_demos notebooks with no mapping
"""

from __future__ import annotations

import argparse
import filecmp
import shutil
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------

# Script lives at AIHandsOnBook/scripts/, so the book root is one level up.
BOOK_ROOT = Path(__file__).resolve().parent.parent
CODE_DEMOS = BOOK_ROOT / "code_demos"

# -----------------------------------------------------------------------------
# Mapping table -- the only place you edit when adding a notebook
# -----------------------------------------------------------------------------
# (chapter path relative to BOOK_ROOT,   code_demos filename)
NOTEBOOK_PAIRS: list[tuple[str, str]] = [
    # Chapter 14 -- tool agents & MCP
    ("chapters/14-tool-agents-mcp/ku_parking_assistant.ipynb", "KU_Parking_Assistant.ipynb"),
    ("chapters/14-tool-agents-mcp/ku_parking_mcp.ipynb",       "KU_Parking_mcp.ipynb"),

    # Add more pairs below as each chapter notebook is brought under sync.
    # Example:
    # ("chapters/01-llm-basics/attention_example.ipynb", "Attention_simple_example.ipynb"),
]

# -----------------------------------------------------------------------------


def copy_pair(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--check",
        action="store_true",
        help="Verify pairs are identical; do not copy. Useful as a pre-push check.",
    )
    ap.add_argument(
        "--strict",
        action="store_true",
        help="Treat unmapped notebooks in code_demos/ as an error (exit 1).",
    )
    args = ap.parse_args()

    if not CODE_DEMOS.is_dir():
        print(f"ERROR: code_demos/ not found at {CODE_DEMOS}", file=sys.stderr)
        return 1

    failed = False

    # Phase 1: copy (skipped with --check)
    if not args.check:
        print(f"Syncing {len(NOTEBOOK_PAIRS)} notebook(s) -> code_demos/")
        for src_rel, dst_name in NOTEBOOK_PAIRS:
            src = BOOK_ROOT / src_rel
            dst = CODE_DEMOS / dst_name
            if not src.is_file():
                print(f"  MISSING SOURCE: {src_rel}")
                failed = True
                continue
            copy_pair(src, dst)
            print(f"  synced  {src_rel}  ->  code_demos/{dst_name}")
        print()

    # Phase 2: verify identical (always runs)
    print("Verifying pairs are byte-identical...")
    for src_rel, dst_name in NOTEBOOK_PAIRS:
        src = BOOK_ROOT / src_rel
        dst = CODE_DEMOS / dst_name
        if not src.is_file():
            print(f"  MISSING SOURCE: {src_rel}")
            failed = True
            continue
        if not dst.is_file():
            print(f"  MISSING DEST:   code_demos/{dst_name}")
            failed = True
            continue
        if filecmp.cmp(src, dst, shallow=False):
            print(f"  ok      {src_rel}")
        else:
            print(f"  DRIFT:  {src_rel}  !=  code_demos/{dst_name}")
            failed = True
    print()

    # Phase 3: orphans -- notebooks in code_demos/ not covered by the map
    mapped_names = {dst_name for _, dst_name in NOTEBOOK_PAIRS}
    orphans = sorted(
        p.name for p in CODE_DEMOS.glob("*.ipynb") if p.name not in mapped_names
    )
    if orphans:
        label = "ERROR" if args.strict else "WARN"
        print(f"{label}: {len(orphans)} notebook(s) in code_demos/ not mapped:")
        for name in orphans:
            print(f"  - {name}")
        print("Add an entry to NOTEBOOK_PAIRS (or delete the file) to bring it under sync.")
        if args.strict:
            failed = True
        print()

    if failed:
        print("Sync FAILED -- see messages above.")
        return 1
    print("Sync OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
