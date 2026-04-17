# Learning Path and Chapter Dependencies

This page maps the dependencies between chapters. Use it to plan your reading order if you want to skip ahead to a specific topic.

## The Recommended Sequential Path

```
Ch 1 (AI at a Glance)
  ↓
Ch 2 (LLM Foundations)
  ↓
Ch 3 (LLM Providers) ──→ Ch 4 (Local LLMs)
  ↓                         ↓
Ch 5 (Vibe Coding) ←────────┘
  ↓
Ch 6 (RAG First Principles)
  ↓
Ch 7 (Vector DBs) ──→ Ch 8 (Structured Data) ──→ Ch 9 (Multimedia)
  ↓
Ch 10-12 (LlamaIndex → LangChain → LangGraph)
  ↓
Ch 13 (Fine-Tuning)
  ↓
Ch 14-17 (Single Agent → Multi-Agent → Autonomous → Tool Agents/MCP)
  ↓
Ch 18 (Deployment)
```

## What You Can Skip To

If you already have experience with a topic, here is what each chapter actually requires:

| Chapter | Prerequisites | Can skip if you know... |
|---|---|---|
| Ch 1: AI at a Glance | None | How LLMs are trained (pre-training, SFT, RLHF) |
| Ch 2: LLM Foundations | None | Tokenization, embeddings, attention, transformers |
| Ch 3: LLM Providers | Ch 2 | How to call OpenAI/Gemini APIs |
| Ch 4: Local LLMs | Ch 3 | How to run LM Studio or Ollama |
| Ch 5: Vibe Coding | Ch 3 | How to use Cursor, Copilot, or Claude Code |
| Ch 6: RAG First Principles | Ch 2, Ch 3 | Chunking, embedding, cosine similarity, prompt stuffing |
| Ch 7: RAG with Vector DBs | Ch 6 | ChromaDB, Pinecone, FAISS |
| Ch 8: RAG with Structured Data | Ch 6 | Text-to-SQL, Cypher, schema-as-context |
| Ch 9: RAG with Multimedia | Ch 6 | CLIP, image/video embeddings |
| Ch 10: LlamaIndex | Ch 6 | LlamaIndex SimpleDirectoryReader, VectorStoreIndex |
| Ch 11: LangChain | Ch 6 | LCEL pipe syntax, LangChain chains and agents |
| Ch 12: LangGraph | Ch 11 | StateGraph, conditional edges, graph loops |
| Ch 13: Fine-Tuning | Ch 2, Ch 3 | LoRA, QLoRA, SFTTrainer |
| Ch 14: Single Agent | Ch 3 | LLM + tools pattern, system prompts |
| Ch 15: Multi-Agent | Ch 14 | Agent handoff, LLM-as-a-judge |
| Ch 16: Autonomous Agents | Ch 14 | Plan-Execute-Synthesize-Reflect pattern |
| Ch 17: Tool Agents and MCP | Ch 14 | MCP protocol, JSON-RPC, Supabase Edge Functions |
| Ch 18: Deployment | Ch 17 | Supabase deployment, Dify workflows |

## Three Fast Tracks

**"I just want to build a document Q&A app":**
Ch 1 → Ch 2 → Ch 3 → Ch 6 → Ch 10 (LlamaIndex)

**"I want to understand agents":**
Ch 1 → Ch 2 → Ch 3 → Ch 14 → Ch 15 → Ch 16 → Ch 17

**"I want to fine-tune a model":**
Ch 1 → Ch 2 → Ch 3 → Ch 13
