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
import json
import re
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# Book-side -> code_demos-side structural transform
# -----------------------------------------------------------------------------
# Layout:
#
#   Chapter:
#     [0] `# Chapter Title`   (title-only cell)
#     [1] intro paragraph + cross-reference
#     [2..N-2] content
#     [N-1] "## Run the code" cell (plain-text URL for PDF readers)
#
#   code_demos:
#     [0] Colab badge + runtime blockquote
#     [1] `# Chapter Title`   (== chapter[0])
#     [2] intro paragraph + cross-reference  (== chapter[1])
#     [3..N-1] content                       (== chapter[2..N-2])
#
# Chapter positions 0..N-2 map straight to code_demos positions 1..N-1.
# Chapter has an extra "Run the code" cell at [N-1] (PDF readers); code_demos
# has the Colab badge at [0] instead. The title cell is kept on both sides so
# a Colab reader lands on a properly-titled notebook.
#
# Forward sync (chapter -> code_demos):
#   1. drop chapter[-1] ("Run the code"), extracting the runtime blockquote.
#   2. prepend a Colab-badge + runtime cell at position 0.
#   (The title cell at chapter[0] is carried through to code_demos[1].)

_COLAB_BADGE_SRC = "https://colab.research.google.com/assets/colab-badge.svg"
_RUNTIME_RE = re.compile(r"^\s*>\s*\*\*Estimated run time:\*\*")


def _is_run_the_code_cell(cell: dict) -> bool:
    # Join source before searching: some legacy notebooks have source stored
    # as a list of one-character strings instead of lines, which defeats
    # a per-element substring check.
    if cell.get("cell_type") != "markdown":
        return False
    return "## Run the code" in "".join(cell.get("source", []))


def _extract_runtime_line(cell: dict) -> str | None:
    text = "".join(cell.get("source", []))
    for line in text.splitlines():
        if _RUNTIME_RE.match(line):
            return line
    return None


def _badge_html(code_demos_filename: str) -> str:
    colab_url = (
        "https://colab.research.google.com/github/KarAnalytics/code_demos/blob/main/"
        + code_demos_filename
    )
    return (
        f'<a href="{colab_url}" target="_parent">'
        f'<img src="{_COLAB_BADGE_SRC}" alt="Open In Colab"/></a>'
    )


def transform_for_code_demos(data: bytes, code_demos_filename: str) -> bytes:
    try:
        nb = json.loads(data)
    except json.JSONDecodeError:
        return data
    if not isinstance(nb, dict) or "cells" not in nb:
        return data

    cells = nb["cells"]

    # Pull the runtime out of the bottom "Run the code" cell before dropping it.
    runtime_line: str | None = None
    while cells and _is_run_the_code_cell(cells[-1]):
        if runtime_line is None:
            runtime_line = _extract_runtime_line(cells[-1])
        cells.pop()

    # The title cell at chapter[0] is preserved (it carries through to
    # code_demos[1], right below the injected Colab badge).

    # Build the injected top cell: badge, optional runtime blockquote.
    top_source: list[str] = [_badge_html(code_demos_filename) + "\n"]
    if runtime_line is not None:
        top_source.append("\n")
        top_source.append(runtime_line + "\n")

    cells.insert(0, {
        "cell_type": "markdown",
        "id": "colab-badge",
        "metadata": {},
        "source": top_source,
    })

    had_trailing_newline = data.endswith(b"\n")
    out = json.dumps(nb, indent=1, ensure_ascii=False)
    if had_trailing_newline and not out.endswith("\n"):
        out += "\n"
    return out.encode("utf-8")

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
    # Chapter 01 -- LLM basics
    ("chapters/01-llm-basics/attention_example.ipynb",           "Attention_simple_example.ipynb"),
    ("chapters/01-llm-basics/attention_image_analysis.ipynb",    "Attention_in_Image_Analysis.ipynb"),
    ("chapters/01-llm-basics/embedding_example.ipynb",           "Embedding_example.ipynb"),
    ("chapters/01-llm-basics/simple_transformers.ipynb",         "SimpleTransformers.ipynb"),
    ("chapters/01-llm-basics/tfidf_example.ipynb",               "TFIDF_example.ipynb"),
    ("chapters/01-llm-basics/tokenizer_examples.ipynb",          "Tokenizer_simple_examples.ipynb"),

    # Chapter 02 -- LLM providers
    ("chapters/02-llm-providers/google_api.ipynb",               "Google_Studio_API_call.ipynb"),
    ("chapters/02-llm-providers/groq_api.ipynb",                 "Groq_Cloud_API_Call.ipynb"),
    ("chapters/02-llm-providers/lm_studio.ipynb",                "LMStudioAccess.ipynb"),
    ("chapters/02-llm-providers/openai_api.ipynb",               "OpenAI_API_call.ipynb"),

    # Chapter 03 -- RAG first principles
    ("chapters/03-rag-first-principles/rag_first_principles.ipynb", "RAG_first_principles.ipynb"),

    # Chapter 04 -- RAG vector databases
    ("chapters/04-rag-vector-databases/lancedb.ipynb",                  "LanceDB_vectorDB.ipynb"),
    ("chapters/04-rag-vector-databases/pinecone.ipynb",                 "Pinecone_vectorDB.ipynb"),
    ("chapters/04-rag-vector-databases/rag_allcountries_chromadb.ipynb","RAG_allcountries_ChromaDB.ipynb"),
    ("chapters/04-rag-vector-databases/rag_countries_chromadb.ipynb",   "RAG_countries_NA.ipynb"),
    ("chapters/04-rag-vector-databases/rag_featherweight.ipynb",        "Simple_RAG_using_featherweightAI.ipynb"),

    # Chapter 05 -- RAG over structured data
    ("chapters/05-rag-structured-data/dbms_rag_sqlite.ipynb",    "DBMS_RAG_SQLite.ipynb"),
    ("chapters/05-rag-structured-data/graph_rag_trade.ipynb",    "GRAPH_RAG_Trade.ipynb"),

    # Chapter 06 -- RAG over multimedia
    ("chapters/06-rag-multimedia/image_rag.ipynb",               "Image_RAG.ipynb"),
    ("chapters/06-rag-multimedia/video_rag.ipynb",               "Video_RAG.ipynb"),

    # Chapter 07 -- LlamaIndex
    ("chapters/07-llamaindex/llamaindex_rag.ipynb",              "LlamaIndex_RAG.ipynb"),
    ("chapters/07-llamaindex/llamaindex_simple.ipynb",           "LlamaIndex_RAG_simple_single_company.ipynb"),

    # Chapter 08 -- LangChain
    ("chapters/08-langchain/langchain_demo.ipynb",               "LangChain_demo.ipynb"),

    # Chapter 09 -- LangGraph
    ("chapters/09-langgraph/langgraph_demo.ipynb",               "LangGraph_demo.ipynb"),

    # Chapter 10 -- Fine-tuning
    ("chapters/10-finetuning/qlora_finetuning.ipynb",            "QLoRA_FineTuning.ipynb"),

    # Chapter 11 -- Single agent
    ("chapters/11-single-agent/single_agent_db.ipynb",           "SingleAgent_DB.ipynb"),

    # Chapter 12 -- Multi-agent
    ("chapters/12-multi-agent/multi_agent_multi_human_db.ipynb", "MultiAgent_DB_multi_human_input.ipynb"),
    ("chapters/12-multi-agent/multi_agent_single_input.ipynb",   "MultiAgent_DB_single_human_input.ipynb"),

    # Chapter 13 -- Autonomous agents
    ("chapters/13-autonomous-agents/autonomous_agent.ipynb",     "AutonomousAgent_BusinessValidator.ipynb"),
    ("chapters/13-autonomous-agents/autonomous_multivendor.ipynb","AutonomousAgent_multivendor.ipynb"),

    # Chapter 14 -- tool agents & MCP
    ("chapters/14-tool-agents-mcp/ku_parking_assistant.ipynb",   "KU_Parking_Assistant.ipynb"),
    ("chapters/14-tool-agents-mcp/ku_parking_mcp.ipynb",         "KU_Parking_mcp.ipynb"),
]

# -----------------------------------------------------------------------------


def copy_pair(src: Path, dst: Path, code_demos_filename: str) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(transform_for_code_demos(src.read_bytes(), code_demos_filename))


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
            copy_pair(src, dst, dst_name)
            print(f"  synced  {src_rel}  ->  code_demos/{dst_name}")
        print()

    # Phase 2: verify code_demos matches the transformed source (always runs)
    print("Verifying pairs match book-side source (after badge prepend / run-cell strip)...")
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
        expected = transform_for_code_demos(src.read_bytes(), dst_name)
        if expected == dst.read_bytes():
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
