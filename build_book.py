"""
Build script for the AI for Business Jupyter Book.

This script:
  1. Creates the chapter directory structure
  2. Writes chapter intro markdown files
  3. Copies notebooks from the code_demos repo (or local ClassDemos directory)
     into the correct chapter folders
  4. Builds the HTML book with jupyter-book

Usage:
    cd AIHandsOnBook
    python build_book.py           # copies notebooks + creates structure
    python build_book.py --build   # also runs jupyter-book build
"""

import os
import sys
import shutil
from pathlib import Path

BOOK_DIR = Path(__file__).parent
# Try to find notebooks from the local ClassDemos directory first, then code_demos
DEMOS_DIR = BOOK_DIR.parent  # ClassDemos_Antigravity

# ---- Chapter intro content ----
CHAPTER_INTROS = {
    "chapters/01-llm-basics/intro.md": """# LLM Foundations

Before building applications, you need to understand how LLMs process text. This chapter covers the four building blocks:

- **Tokenization** — how text is broken into tokens (the LLM's "alphabet")
- **Embeddings** — how tokens are mapped to high-dimensional vectors that capture meaning
- **TF-IDF** — a classical approach to measuring word importance (contrast with embeddings)
- **Attention** — the mechanism that lets transformers understand context and relationships between words

Each notebook is self-contained and runs on Google Colab.
""",

    "chapters/02-llm-providers/intro.md": """# Calling LLMs: Providers and Fallback

LLMs are accessed via APIs from providers like OpenAI, Google (Gemini), Groq, and others. Each has different models, pricing, rate limits, and capabilities.

This chapter introduces the `llm_cascade` package — a simple Python library that auto-detects your API keys and falls back to the next provider when one hits its quota. Every subsequent chapter in this book uses `llm_cascade` so you never have to worry about provider-specific code.

- **8 supported providers:** OpenAI, Gemini, Ollama, Grok (xAI), Groq, HuggingFace, Cohere, OpenRouter
- **One line of code:** `llm = get_cascade()` — that's it
- **Automatic fallback:** if Gemini returns 429, the next call goes to Groq (or whichever is next)
""",

    "chapters/03-rag-first-principles/intro.md": """# RAG from First Principles

Retrieval-Augmented Generation (RAG) is the most important technique for grounding LLM answers in your own data. Instead of hoping the LLM memorized the right facts during training, you *retrieve* relevant documents and *stuff* them into the prompt.

This chapter builds a complete RAG pipeline from scratch — no frameworks, no abstractions. You'll implement every step manually: chunking, embedding, vector search, prompt construction, and generation. This gives you the deepest understanding of what frameworks like LlamaIndex and LangChain do under the hood.
""",

    "chapters/04-rag-vector-databases/intro.md": """# RAG with Vector Databases

The previous chapter built RAG from scratch with numpy arrays. In practice, you use a **vector database** to store and search embeddings efficiently. This chapter explores ChromaDB — a popular open-source vector database — applied to real-world datasets.

You'll see how the same retrieve-augment-generate pattern scales from a few documents to hundreds, and how ChromaDB handles the embedding storage, indexing, and similarity search automatically.
""",

    "chapters/05-rag-structured-data/intro.md": """# RAG with Structured Data

RAG isn't limited to text documents. When your data lives in a **SQL database** or a **graph database**, the "retrieval" step becomes a query (SQL or Cypher) rather than a vector search.

This chapter covers two variants:
- **DBMS RAG** — the LLM generates SQL queries against a SQLite database, executes them, and answers based on the results
- **Graph RAG** — the LLM generates Cypher queries against a Kùzu graph database for relational/network data

Both follow the same pattern: retrieve evidence → stuff into prompt → generate answer. Only the retrieval mechanism changes.
""",

    "chapters/06-rag-multimedia/intro.md": """# RAG with Images and Video

RAG can also work with visual content. Instead of embedding text, we embed **images** (and video frames) using CLIP — a model that maps both text and images into the same vector space.

This chapter builds:
- **Image RAG** — embed product images with CLIP, retrieve by text query ("red circular product"), answer with a multimodal LLM
- **Video RAG** — extract keyframes from a video, embed them with CLIP, retrieve relevant frames, and describe them

The same retrieve-augment-generate pattern applies — just with pixels instead of paragraphs.
""",

    "chapters/07-llamaindex/intro.md": """# LlamaIndex

LlamaIndex is a framework that abstracts the entire RAG pipeline into a few lines of code. Where earlier chapters built everything manually (chunking, embedding, retrieval, prompting), LlamaIndex handles it all with `SimpleDirectoryReader` + `VectorStoreIndex` + `query_engine`.

This chapter demonstrates LlamaIndex with three fictional company document sets, showing how the framework automatically routes questions to the correct company's documents.
""",

    "chapters/08-langchain/intro.md": """# LangChain

LangChain is a modular toolkit for building LLM applications. Unlike LlamaIndex (which is opinionated about how RAG should work), LangChain gives you explicit control over each step: document loaders, text splitters, embeddings, vector stores, and chains.

This chapter covers:
- **LCEL (LangChain Expression Language)** — the modern pipe syntax for composing chains
- **RAG with FAISS** — building a retrieval chain step by step
- **Agents with tools** — LLMs that decide which functions to call, implemented with LCEL pipes
""",

    "chapters/09-langgraph/intro.md": """# LangGraph

LangGraph extends LangChain with **stateful graphs** — pipelines where each step is a visible node connected by edges, and the state flows explicitly between them. This chapter demonstrates three increasingly complex graph patterns:

- **Linear RAG** — `retrieve → generate → END` (same as a LangChain chain, but with visible state)
- **Conditional routing** — a classifier node routes questions to specialized handlers via conditional edges
- **Retry loop** — the graph evaluates its own answer and loops back to retry if insufficient

Each pattern includes a graph visualization and a state trace showing how data flows through the nodes.
""",

    "chapters/10-finetuning/intro.md": """# Fine-Tuning with QLoRA

When RAG isn't enough — when you need the model to learn a new *style*, *tone*, or *core knowledge* — you fine-tune it. QLoRA (Quantized Low-Rank Adaptation) makes this possible on a free Colab T4 GPU by:

- Compressing the model to 4-bit (75% memory reduction)
- Training only ~0.5% of the parameters (LoRA adapters)
- Achieving memorization of new facts in ~2 minutes

This chapter fine-tunes a small model on fictional company data and shows a side-by-side before/after comparison.
""",

    "chapters/11-single-agent/intro.md": """# Single-Agent Systems

An "agent" is an LLM that can use tools — functions it calls to fetch data, run calculations, or interact with external systems. The simplest agent is a single LLM with a single system prompt that handles the entire workflow.

This chapter builds a single-agent database assistant: upload an Excel file, the agent designs a schema, creates a SQLite database, and answers business questions via SQL. One agent, multiple tasks, one system prompt.
""",

    "chapters/12-multi-agent/intro.md": """# Multi-Agent Systems

When one agent isn't enough, you split the work across multiple specialized agents — each with its own system prompt, its own narrow expertise, and a defined handoff protocol.

This chapter builds a five-agent system that:
- **Agent 1 (Data Architect)** designs a logical schema
- **Agent 2 (SQL Developer)** creates the database
- **Agent 3 (SQL Query Writer)** answers questions via SQL
- **Agent 4 (RAG Analyst)** answers the same questions via data context
- **Agent 5 (Evaluator)** compares the two answers

The key question this chapter addresses: *when is multi-agent specialization actually worth the added complexity?*
""",

    "chapters/13-autonomous-agents/intro.md": """# Autonomous Agents

Previous chapters used agents with predefined workflows — humans decided the pipeline, agents just filled the roles. An **autonomous agent** takes a high-level goal and figures out the steps itself.

This chapter builds a Business Idea Validator that autonomously:
- **Plans** its own research questions
- **Executes** each question with accumulated context
- **Synthesizes** findings into a recommendation
- **Self-critiques** with a confidence score

No human tells it what questions to ask — the LLM decides the entire workflow from a one-sentence goal.
""",

    "chapters/14-tool-agents-mcp/intro.md": """# Tool-Using Agents and MCP

This chapter brings together tools, agents, and the **Model Context Protocol (MCP)** — the standard for exposing tools to LLMs as reusable services.

We build a KU Parking Assistant that:
- Uses **real deterministic tools** (Haversine distance, fuzzy building matching, Google Maps URLs)
- The LLM decides *when* to call which tool based on the question
- The same tools are deployed to a **Supabase Edge Function** as an MCP server
- Both a Python notebook and a Dify workflow can call the same tools

Two notebooks contrast:
- **Inline tools** — tools defined as Python functions in the notebook
- **MCP tools** — tools accessed over HTTPS from the Supabase cloud endpoint
""",

    "chapters/15-deployment/intro.md": """# Deployment and No-Code

The final chapter takes AI from notebooks to production:

- **MCP on Supabase** — deploy tools as a serverless Edge Function that any MCP client can call over HTTPS
- **Dify Workflows** — build the same AI applications visually with no code, using Dify's workflow builder

These sections show that the concepts from earlier chapters (RAG, tools, agents) translate directly to production platforms — the same patterns, different delivery mechanisms.
""",

    # Placeholder sections for deployment sub-chapters
    "chapters/15-deployment/mcp_supabase.md": """# MCP Servers on Supabase

Deploying tools as a cloud-hosted MCP server gives every client (notebooks, web apps, Dify, Claude Desktop) access to the same tools via a standard HTTPS interface.

This section walks through deploying the KU Parking MCP server to Supabase Edge Functions and calling it from Python and Dify.

The deployment guide and full source live in this repo under `infra/ku-parking-mcp/`. The TypeScript edge function is at `infra/ku-parking-mcp/supabase/functions/ku-parking/index.ts`. To deploy:

```bash
cd infra/ku-parking-mcp
supabase functions deploy ku-parking --no-verify-jwt
```
""",

    "chapters/15-deployment/dify_workflow.md": """# No-Code AI with Dify

Dify is a visual LLM application builder. This section shows how to replicate two of our notebook-based applications in Dify without writing any code:

**Document RAG** — upload company documents to a Dify Knowledge Base, add a Knowledge Retrieval node + LLM node, and get a working Q&A app in 15 minutes.

**KU Parking via MCP** — connect Dify to the Supabase MCP endpoint using an HTTP Request node, parse the JSON-RPC response, and format the answer with an LLM node.

Step-by-step instructions are included in the respective notebook markdown sections.
""",
}

# ---- Notebook → chapter mapping ----
# Maps (source_relative_path, destination_chapter_filename)
NOTEBOOK_MAP = [
    # Part I: Foundations
    ("Tokenizer_simple_examples.ipynb",                      "chapters/01-llm-basics/tokenizer_examples.ipynb"),
    ("Embedding_example.ipynb",                              "chapters/01-llm-basics/embedding_example.ipynb"),
    ("TFIDF_example.ipynb",                                  "chapters/01-llm-basics/tfidf_example.ipynb"),
    ("Attention_simple_example.ipynb",                       "chapters/01-llm-basics/attention_example.ipynb"),
    # llm_cascade is a markdown page, not a notebook
    ("chapters/02-llm-providers/llm_cascade.md",             None),  # written below

    # Part II: RAG
    ("RAG_first_principles.ipynb",                           "chapters/03-rag-first-principles/rag_first_principles.ipynb"),
    ("RAG_countries_NA.ipynb",                               "chapters/04-rag-vector-databases/rag_countries_chromadb.ipynb"),
    ("RAG_allcountries_ChromaDB.ipynb",                      "chapters/04-rag-vector-databases/rag_allcountries_chromadb.ipynb"),
    ("Simple_RAG_using_featherweightAI.ipynb",               "chapters/04-rag-vector-databases/rag_featherweight.ipynb"),
    ("DBMS_RAG_SQLite.ipynb",                                "chapters/05-rag-structured-data/dbms_rag_sqlite.ipynb"),
    ("GRAPH_RAG_Trade.ipynb",                                "chapters/05-rag-structured-data/graph_rag_trade.ipynb"),
    ("Image_RAG.ipynb",                                      "chapters/06-rag-multimedia/image_rag.ipynb"),
    ("Video_RAG.ipynb",                                      "chapters/06-rag-multimedia/video_rag.ipynb"),

    # Part III: RAG Frameworks
    ("LlamaIndex_RAG.ipynb",                                 "chapters/07-llamaindex/llamaindex_rag.ipynb"),
    ("LangChain_demo.ipynb",                                 "chapters/08-langchain/langchain_demo.ipynb"),
    ("LangGraph_demo.ipynb",                                 "chapters/09-langgraph/langgraph_demo.ipynb"),

    # Part IV: Fine-Tuning
    ("QLoRA_FineTuning.ipynb",                               "chapters/10-finetuning/qlora_finetuning.ipynb"),

    # Part V: Agents
    ("SingleAgent_DB.ipynb",                                 "chapters/11-single-agent/single_agent_db.ipynb"),
    ("MultiAgent_DB_multi_human_input.ipynb",                "chapters/12-multi-agent/multi_agent_multi_human_db.ipynb"),
    ("AutonomousAgent_BusinessValidator.ipynb",              "chapters/13-autonomous-agents/autonomous_agent.ipynb"),
    ("KU_Parking_Assistant.ipynb",                           "chapters/14-tool-agents-mcp/ku_parking_assistant.ipynb"),
    ("KU_Parking_mcp.ipynb",                                 "chapters/14-tool-agents-mcp/ku_parking_mcp.ipynb"),
]

# ---- llm_cascade chapter (markdown, not a notebook) ----
LLM_CASCADE_MD = """# The `llm_cascade` Package

Every notebook in this book uses `llm_cascade` for automatic LLM provider fallback. Here's a quick reference.

## Install

```bash
pip install git+https://github.com/KarAnalytics/llm_cascade.git
```

## Quick start

```python
from llm_cascade import get_cascade

llm = get_cascade()                          # auto-detects your API keys
response = llm.generate("What is Python?")   # falls back if one provider is down
print(response.text)                         # the answer
print(response.provider)                     # which provider answered (e.g., "Gemini")
print(response.model)                        # which model was used
```

## Supported providers

| Provider | Env Variable | Free Tier |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | Limited free credits |
| Gemini | `GEMINI_API_KEY` | 500 req/day |
| Ollama Cloud | `OLLAMA_API_KEY` | Free tier |
| Grok (xAI) | `XAI_API_KEY` | $25/month free |
| Groq | `GROQ_API_KEY` | 30 req/min |
| HuggingFace | `HF_TOKEN` | Free inference |
| Cohere | `COHERE_API_KEY` | 20 req/min |
| OpenRouter | `OPENROUTER_API_KEY` | Free models |

Set any key in your `.env` file or Colab Secrets. The cascade tries them in order and falls back automatically on quota errors, auth failures, or server outages.

## Override models per notebook

```python
llm = get_cascade(models={"Gemini": "gemini-2.5-pro", "OpenAI": "gpt-4o"})
# or after creation:
llm.set_model("Gemini", "gemini-2.5-pro")
```

## Embeddings (local, no API key needed)

```python
embedding = llm.get_embedding("some text")  # uses all-MiniLM-L6-v2 locally
```

Source: [github.com/KarAnalytics/llm_cascade](https://github.com/KarAnalytics/llm_cascade)
"""


def main():
    build_html = "--build" in sys.argv

    print("Setting up AI for Business Jupyter Book...")
    print(f"Book directory: {BOOK_DIR}")
    print()

    # 1. Create chapter directories
    dirs_created = set()
    for rel_path, content in CHAPTER_INTROS.items():
        full_path = BOOK_DIR / rel_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")
        if str(full_path.parent) not in dirs_created:
            dirs_created.add(str(full_path.parent))
            print(f"  Created: {full_path.parent.relative_to(BOOK_DIR)}/")

    # Write the llm_cascade markdown page
    llm_cascade_path = BOOK_DIR / "chapters" / "02-llm-providers" / "llm_cascade.md"
    llm_cascade_path.parent.mkdir(parents=True, exist_ok=True)
    llm_cascade_path.write_text(LLM_CASCADE_MD, encoding="utf-8")
    print(f"  Created: {llm_cascade_path.relative_to(BOOK_DIR)}")

    print()

    # 2. Copy notebooks from code_demos repo
    # Try multiple source locations
    code_demos_dir = None
    candidates = [
        Path.home() / "code_demos",
        DEMOS_DIR.parent / "code_demos",
        Path("C:/Users/k639s258/code_demos"),
    ]
    for c in candidates:
        if c.exists():
            code_demos_dir = c
            break

    copied = 0
    skipped = 0
    for src_name, dest_rel in NOTEBOOK_MAP:
        if dest_rel is None:
            continue  # markdown page, not a notebook

        dest_path = BOOK_DIR / dest_rel
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        # Try to find the source notebook
        src_path = None
        if code_demos_dir and (code_demos_dir / src_name).exists():
            src_path = code_demos_dir / src_name

        if src_path and src_path.exists():
            shutil.copy2(src_path, dest_path)
            copied += 1
            print(f"  Copied: {src_name} -> {dest_rel}")
        else:
            # Create a placeholder
            if not dest_path.exists():
                dest_path.write_text(
                    f"# {src_name}\n\nThis notebook will be added from the "
                    f"[code_demos](https://github.com/KarAnalytics/code_demos) repository.\n"
                    f"\nDownload it from: `https://github.com/KarAnalytics/code_demos/blob/main/{src_name}`\n",
                    encoding="utf-8",
                )
                skipped += 1
                print(f"  Placeholder: {dest_rel} (source not found locally)")

    print(f"\n  Copied: {copied}, Placeholders: {skipped}")

    # 3. Create requirements.txt
    req_path = BOOK_DIR / "requirements.txt"
    req_path.write_text(
        "jupyter-book>=1.0.0\n"
        "sphinx-togglebutton\n",
        encoding="utf-8",
    )

    # 4. Create .gitignore
    gitignore_path = BOOK_DIR / ".gitignore"
    gitignore_path.write_text(
        "_build/\n"
        "__pycache__/\n"
        ".ipynb_checkpoints/\n"
        "*.pyc\n",
        encoding="utf-8",
    )

    # 5. Create GitHub Actions workflow for auto-deploy
    gh_dir = BOOK_DIR / ".github" / "workflows"
    gh_dir.mkdir(parents=True, exist_ok=True)
    (gh_dir / "deploy.yml").write_text("""name: Deploy Jupyter Book to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: jupyter-book build .
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _build/html

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
""", encoding="utf-8")
    print(f"\n  Created: .github/workflows/deploy.yml (auto-deploys to GitHub Pages)")

    print(f"\n{'='*60}")
    print("Book structure ready!")
    print(f"{'='*60}")
    print()
    print("Next steps:")
    print()
    print("  1. Copy notebooks from code_demos into chapter folders:")
    print("     (The build script tried to copy automatically. If notebooks")
    print("      weren't found locally, download them from GitHub and place")
    print("      them in the chapter folders as shown in _toc.yml)")
    print()
    print("  2. Build the book locally:")
    print(f"     cd {BOOK_DIR}")
    print("     jupyter-book build .")
    print()
    print("  3. Preview in browser:")
    print(f"     open {BOOK_DIR / '_build' / 'html' / 'index.html'}")
    print()
    print("  4. Push to GitHub for automatic deployment:")
    print("     git init")
    print("     git remote add origin https://github.com/KarAnalytics/AIHandsOnBook.git")
    print("     git add -A")
    print("     git commit -m 'Initial book structure'")
    print("     git push -u origin main")
    print()
    print("  5. Enable GitHub Pages:")
    print("     GitHub repo -> Settings -> Pages -> Source: 'GitHub Actions'")
    print()
    print("  6. Your book will be live at:")
    print("     https://karanalytics.github.io/AIHandsOnBook/")

    if build_html:
        print(f"\n{'='*60}")
        print("Building HTML...")
        os.system(f'cd "{BOOK_DIR}" && jupyter-book build .')


if __name__ == "__main__":
    main()
