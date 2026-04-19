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
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# Book-side -> code_demos-side transformation
# -----------------------------------------------------------------------------
# Chapter notebooks encode underscores in Colab badge URLs as %5F because
# Typst (the PDF backend) escapes a literal `_` in URLs to `\_`, which then
# gets triple-URL-encoded by Colab and breaks the "Open in Colab" button in
# the PDF. %5F is pass-through-safe through Typst.
#
# On the code_demos side we need the opposite: literal underscores, because
# GitHub's "Open in Colab" shortcut re-encodes `%` -> `%25` -> `%2525` on
# each hop and breaks if the URL already contains a %5F.
#
# Hence the one-way translation applied here during sync.

def transform_for_code_demos(data: bytes) -> bytes:
    return data.replace(b"%5F", b"_")

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


def copy_pair(src: Path, dst: Path) -> None:
    """Copy with book -> code_demos transformation (see transform_for_code_demos)."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(transform_for_code_demos(src.read_bytes()))


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

    # Phase 2: verify code_demos matches the transformed source (always runs)
    print("Verifying pairs are identical (after %5F -> _ transform)...")
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
        expected = transform_for_code_demos(src.read_bytes())
        actual = dst.read_bytes()
        if expected == actual:
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
