# LangChain

LangChain is a modular toolkit for building LLM applications. Unlike LlamaIndex (which is opinionated about how RAG should work), LangChain gives you explicit control over each step: document loaders, text splitters, embeddings, vector stores, and chains.

This chapter covers:
- **LCEL (LangChain Expression Language)** — the modern pipe syntax for composing chains
- **RAG with FAISS** — building a retrieval chain step by step
- **Agents with tools** — LLMs that decide which functions to call, implemented with LCEL pipes
