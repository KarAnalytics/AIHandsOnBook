# AI for Business: A Hands-On Guide

Welcome to this interactive, hands-on guide to building AI-powered applications for business. Every chapter is a runnable Jupyter notebook — you learn by doing, not just reading.

## What this book covers

```{image} https://img.shields.io/badge/Notebooks-15+-blue
```
```{image} https://img.shields.io/badge/Colab-Ready-orange
```
```{image} https://img.shields.io/badge/License-MIT-green
```

This book takes you from zero to deploying AI applications, organized into six parts:

**Part I — Foundations:** How LLMs work under the hood (tokenization, embeddings, attention) and how to call them via APIs with automatic provider fallback.

**Part II — Retrieval-Augmented Generation (RAG):** The core technique for grounding LLM answers in your own data. We build RAG pipelines from scratch, then explore variants: vector databases (ChromaDB), SQL databases, graph databases, and even image/video retrieval.

**Part III — RAG Frameworks:** The same RAG concepts implemented with production frameworks — LlamaIndex, LangChain, and LangGraph — so you see both the manual and the automated approach.

**Part IV — Fine-Tuning:** When RAG isn't enough, QLoRA lets you bake knowledge directly into model weights on a free Colab GPU.

**Part V — Agents:** LLMs that decide which tools to call — from single-agent systems to multi-agent orchestration to autonomous planning workflows. Includes a real-world example (KU Parking Assistant) with tool calling via MCP.

**Part VI — Deployment:** Taking your AI from a notebook to production — MCP servers on Supabase, no-code workflows with Dify, and the `llm_cascade` package for provider management.

## How to use this book

Every chapter is a Jupyter notebook. You can:

- **Read online** — browse the rendered HTML right here
- **Run in Colab** — click the 🚀 rocket icon at the top of any page to open it in Google Colab
- **Run locally** — clone the [source repo](https://github.com/KarAnalytics/code_demos) and run notebooks in VS Code or JupyterLab

All notebooks use the [`llm_cascade`](https://github.com/KarAnalytics/llm_cascade) package for automatic LLM provider fallback. Set any one of 8 API keys (Gemini, OpenAI, Groq, etc.) and every notebook works out of the box.

## Who this is for

- Business students learning AI for the first time
- Data scientists who want hands-on examples of RAG, agents, and deployment
- Anyone who learns best by running code, not reading theory

## About the author

Sameer Verma teaches AI for Business at the University of Kansas School of Business.

---

*Built with [Jupyter Book](https://jupyterbook.org). Source notebooks at [github.com/KarAnalytics/code_demos](https://github.com/KarAnalytics/code_demos).*
