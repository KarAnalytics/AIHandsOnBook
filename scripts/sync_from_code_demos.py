#!/usr/bin/env python3
"""
sync_from_code_demos.py -- BIDIRECTIONAL sync driven from code_demos.

When you edit a notebook live on Colab (via the code_demos GitHub link) and
push those edits to the code_demos repo, run this script to flow those edits
back into the corresponding chapter notebook -- and then back out to code_demos
one more time to normalize any cosmetic drift Colab introduced on save (most
commonly a duplicate `view-in-github` badge).

Default end-to-end flow (one command):

  1. `git pull` on code_demos/ to grab your latest Colab save.
  2. Reverse sync:  code_demos -> chapter   (pulls your edits into the book).
  3. Forward sync:  chapter -> code_demos   (writes a clean canonical copy
     back over code_demos, wiping Colab drift like duplicate badges).
  4. Round-trip verification (should always pass after step 3).

Layout:

  Chapter:
    [0] `# Chapter Title`                 (== code_demos[1])
    [1] intro paragraph + cross-reference (== code_demos[2])
    [2..N-2] content                      (== code_demos[3..N-1])
    [N-1] "## Run the code" cell          (regenerated with extracted runtime)

  code_demos:
    [0] Colab badge + runtime blockquote  (dropped + runtime extracted)
    [1] `# Chapter Title`                 (copied straight over)
    [2..N-1] intro, content               (copied straight over)

Usage:

    python scripts/sync_from_code_demos.py                    # pull + reverse + forward sync
    python scripts/sync_from_code_demos.py --build-pdf        # ... + also rebuild PDF locally for preview
    python scripts/sync_from_code_demos.py --no-pull          # skip the git pull (use current local state)
    python scripts/sync_from_code_demos.py --no-forward-sync  # reverse sync only; leave code_demos alone
    python scripts/sync_from_code_demos.py --check            # verify round-trip only; no writes, no pull, no build

Note: the PDF (ai-for-business.pdf) is rebuilt automatically by the GitHub
Actions deploy workflow on every push, so `--build-pdf` is no longer required
as part of the regular workflow -- it's here for local previews only (e.g.,
when you want to eyeball the PDF before pushing).

Exit code 0 on success, 1 on any pull / sync / verification / build failure.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parent.parent
CODE_DEMOS = BOOK_ROOT / "code_demos"

# Keep NOTEBOOK_PAIRS authoritative in sync_to_code_demos.py; import here.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sync_to_code_demos import NOTEBOOK_PAIRS  # noqa: E402

_RUNTIME_RE = re.compile(r"^\s*>\s*\*\*Estimated run time:\*\*")


def _extract_runtime_line(cell: dict) -> str | None:
    text = "".join(cell.get("source", []))
    for line in text.splitlines():
        if _RUNTIME_RE.match(line):
            return line
    return None


def _looks_like_title_cell(cell: dict) -> bool:
    if cell.get("cell_type") != "markdown":
        return False
    src = "".join(cell.get("source", [])).strip()
    return src.startswith("# ") and not src.startswith("## ")


def _run_the_code_cell(code_demos_filename: str, runtime_line: str | None) -> dict:
    colab_url = (
        "https://colab.research.google.com/github/KarAnalytics/code_demos/blob/main/"
        + code_demos_filename
    )
    source: list[str] = [
        "---\n",
        "\n",
        "## Run the code\n",
        "\n",
        "To run this notebook, copy the URL below into your browser's address bar. "
        "The link opens the notebook directly in Google Colab. "
        "*(If your PDF viewer makes the URL clickable and lands on a broken page, "
        "copy the full text manually -- the viewer may have truncated the link at a "
        "line break.)*\n",
        "\n",
    ]
    if runtime_line is not None:
        source.append(runtime_line + "\n")
        source.append("\n")
    source.append(f"`{colab_url}`\n")
    return {
        "cell_type": "markdown",
        "id": "run-the-code",
        "metadata": {},
        "source": source,
    }


def _title_cell_fallback(code_demos_filename: str) -> dict:
    # If a chapter file doesn't exist yet (brand-new notebook added to the map),
    # create a placeholder title from the filename.
    title = code_demos_filename.replace(".ipynb", "").replace("_", " ")
    return {
        "cell_type": "markdown",
        "id": "chapter-title",
        "metadata": {},
        "source": [f"# {title}\n"],
    }


def reverse_transform(
    code_demos_bytes: bytes,
    existing_chapter_bytes: bytes | None,
    code_demos_filename: str,
) -> bytes:
    """Return the chapter notebook bytes derived from code_demos + existing chapter."""
    cd = json.loads(code_demos_bytes)
    cd_cells = cd["cells"]

    # Extract runtime from code_demos[0] before we discard it.
    runtime_line = _extract_runtime_line(cd_cells[0]) if cd_cells else None

    # Preserve chapter-level metadata and existing title (if any) — the
    # existing title is used as a fallback when code_demos[1] is not a
    # proper title cell (e.g., after Colab auto-injects a view-in-github
    # badge that shifts the title out of position).
    existing_title = None
    if existing_chapter_bytes is not None:
        existing = json.loads(existing_chapter_bytes)
        meta = existing.get("metadata", {})
        if existing.get("cells") and _looks_like_title_cell(existing["cells"][0]):
            existing_title = existing["cells"][0]
    else:
        meta = {}

    # Build new chapter cells: code_demos[1..N-1] (title + intro + content),
    # followed by a regenerated Run-the-code cell.
    #
    # Scan body for a title cell rather than assuming it is at [0]. Colab
    # round-trips sometimes leave junk between the badge and the title — an
    # auto-injected duplicate `view-in-github` badge, or a runtime blockquote
    # that got split out of cell 0. Dropping anything before the first title
    # cell cleans up that drift in-place. If no title is found, fall back to
    # the chapter's existing title, or a filename-based placeholder for
    # brand-new notebooks.
    body = list(cd_cells[1:])
    title_idx = next(
        (i for i, c in enumerate(body) if _looks_like_title_cell(c)), None
    )
    if title_idx is not None:
        body = body[title_idx:]
    else:
        body.insert(0, existing_title or _title_cell_fallback(code_demos_filename))
    body.append(_run_the_code_cell(code_demos_filename, runtime_line))

    out_nb = {
        "cells": body,
        "metadata": meta,
        "nbformat": cd.get("nbformat", 4),
        "nbformat_minor": cd.get("nbformat_minor", 5),
    }

    had_trailing_newline = code_demos_bytes.endswith(b"\n")
    out = json.dumps(out_nb, indent=1, ensure_ascii=False)
    if had_trailing_newline and not out.endswith("\n"):
        out += "\n"
    return out.encode("utf-8")


def _git_pull_code_demos() -> bool:
    """Run `git pull` inside code_demos/. Return True on success, False on error."""
    print(f"Pulling latest code_demos/ from origin...")
    proc = subprocess.run(
        ["git", "-C", str(CODE_DEMOS), "pull", "--ff-only"],
        capture_output=True,
        text=True,
    )
    if proc.stdout.strip():
        for line in proc.stdout.strip().splitlines():
            print(f"  {line}")
    if proc.returncode != 0:
        print(f"  git pull FAILED (exit {proc.returncode}):", file=sys.stderr)
        if proc.stderr.strip():
            for line in proc.stderr.strip().splitlines():
                print(f"    {line}", file=sys.stderr)
        return False
    print()
    return True


def _build_pdf() -> bool:
    """Run `npx mystmd build --pdf` in the book root. Stream output as-is."""
    print("Building PDF (npx mystmd build --pdf)...")
    # shell=True so npx resolves correctly on Windows where it's npx.cmd.
    proc = subprocess.run(
        "npx mystmd build --pdf",
        shell=True,
        cwd=str(BOOK_ROOT),
    )
    if proc.returncode != 0:
        print(f"  PDF build FAILED (exit {proc.returncode})", file=sys.stderr)
        return False
    print("  PDF build OK.")
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--check",
        action="store_true",
        help="Verify round-trip only; do not pull, do not write chapter files.",
    )
    ap.add_argument(
        "--no-pull",
        action="store_true",
        help="Skip `git pull` on code_demos/ before syncing (use current local state).",
    )
    ap.add_argument(
        "--no-forward-sync",
        action="store_true",
        help="After the reverse sync, skip the default forward sync that normalizes "
             "code_demos. With this flag the script behaves like the legacy "
             "reverse-only command: drift in code_demos (e.g. Colab-injected duplicate "
             "badges) stays put and surfaces as a verification failure.",
    )
    ap.add_argument(
        "--build-pdf",
        action="store_true",
        help="After a successful sync + verification, run `npx mystmd build --pdf` "
             "locally for preview. Not required for deployment -- CI rebuilds the PDF "
             "on every push.",
    )
    args = ap.parse_args()

    if not CODE_DEMOS.is_dir():
        print(f"ERROR: code_demos/ not found at {CODE_DEMOS}", file=sys.stderr)
        return 1

    failed = False

    # Pull first (unless --check or --no-pull). --check implies read-only, so no pull.
    if not args.check and not args.no_pull:
        if not _git_pull_code_demos():
            return 1

    if not args.check:
        print(f"Reverse-syncing {len(NOTEBOOK_PAIRS)} notebook(s) from code_demos/")
        for chapter_rel, code_demos_name in NOTEBOOK_PAIRS:
            chapter_path = BOOK_ROOT / chapter_rel
            cd_path = CODE_DEMOS / code_demos_name
            if not cd_path.is_file():
                print(f"  MISSING SOURCE: code_demos/{code_demos_name}")
                failed = True
                continue
            existing = chapter_path.read_bytes() if chapter_path.is_file() else None
            new_bytes = reverse_transform(cd_path.read_bytes(), existing, code_demos_name)
            chapter_path.parent.mkdir(parents=True, exist_ok=True)
            chapter_path.write_bytes(new_bytes)
            print(f"  synced  code_demos/{code_demos_name}  ->  {chapter_rel}")
        print()

    # Forward sync phase: normalize code_demos with a clean chapter->code_demos
    # rewrite. This wipes Colab-injected drift (duplicate badges, etc.) so the
    # round-trip verification below always passes after a successful reverse sync.
    # Skipped under --check (read-only) or --no-forward-sync (legacy behavior).
    from sync_to_code_demos import transform_for_code_demos  # local import after write
    if not args.check and not args.no_forward_sync:
        print(f"Forward-syncing {len(NOTEBOOK_PAIRS)} notebook(s) back to code_demos/ (normalize drift)")
        for chapter_rel, code_demos_name in NOTEBOOK_PAIRS:
            chapter_path = BOOK_ROOT / chapter_rel
            cd_path = CODE_DEMOS / code_demos_name
            if not chapter_path.is_file():
                # Already reported as MISSING SOURCE in reverse sync; skip here.
                continue
            new_bytes = transform_for_code_demos(chapter_path.read_bytes(), code_demos_name)
            cd_path.parent.mkdir(parents=True, exist_ok=True)
            cd_path.write_bytes(new_bytes)
            print(f"  normalized  code_demos/{code_demos_name}")
        print()

    # Verification phase: confirm that re-applying the FORWARD transform to the
    # chapter reproduces the code_demos bytes. That catches drift in either
    # direction and gives confidence the two halves are consistent.
    print("Verifying round-trip (chapter --forward-transform-> code_demos)...")
    for chapter_rel, code_demos_name in NOTEBOOK_PAIRS:
        chapter_path = BOOK_ROOT / chapter_rel
        cd_path = CODE_DEMOS / code_demos_name
        if not chapter_path.is_file():
            print(f"  MISSING CHAPTER: {chapter_rel}")
            failed = True
            continue
        if not cd_path.is_file():
            print(f"  MISSING DEST:    code_demos/{code_demos_name}")
            failed = True
            continue
        expected = transform_for_code_demos(chapter_path.read_bytes(), code_demos_name)
        actual = cd_path.read_bytes()
        if expected == actual:
            print(f"  ok      {chapter_rel}")
        else:
            print(f"  DRIFT:  {chapter_rel}  !=  code_demos/{code_demos_name}")
            failed = True
    print()

    if failed:
        print("Sync FAILED -- see messages above.")
        return 1
    print("Sync OK.")

    # Optional: rebuild the PDF. Only run if everything above succeeded and the
    # user asked for it via --build-pdf.
    if args.build_pdf and not args.check:
        print()
        if not _build_pdf():
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
