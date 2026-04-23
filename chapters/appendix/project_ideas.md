# What to Build Next

After working through the chapters, here are project ideas organized by difficulty and the chapters they build on. Each project combines concepts from multiple chapters, giving you practice integrating what you have learned.

## Beginner Projects

**Company FAQ Bot** (Chapters 8, 12)
Collect your company's FAQ page or internal documentation as text files. Build a RAG pipeline that answers employee questions grounded in the actual documents. Start with the RAG First Principles approach, then upgrade to LlamaIndex for a production-ready version.

**Meeting Notes Summarizer** (Chapters 2, 5, 7)
Take meeting transcripts (or record your own with a transcription tool) and build a system that summarizes key decisions, action items, and owners. Use llm_cascade for the LLM call and experiment with different prompt structures to get the best summaries.

**Product Review Analyzer** (Chapters 2, 8)
Scrape product reviews from a public dataset, embed them, and build a system that answers questions like "What do customers complain about most?" and "What features do people love?" This is RAG applied to customer feedback.

## Intermediate Projects

**SQL Business Intelligence Assistant** (Chapters 10, 16)
Connect to a real database (your company's data warehouse, a public dataset, or a Kaggle dataset loaded into SQLite) and build a text-to-SQL system. Users ask business questions in plain English; the system generates SQL, executes it, and explains the results.

**Internal Knowledge Base with Access Control** (Chapters 9, 12, 19)
Build a RAG system over internal company documents with role-based access. HR documents are only retrievable by HR staff; engineering docs by engineers. Deploy as a Dify workflow with authentication. This teaches RAG at a production level.

**Competitive Intelligence Monitor** (Chapters 8, 9, 17)
Scrape competitor websites and press releases periodically, chunk and embed them, and build a RAG system that answers questions like "What did Competitor X announce this quarter?" Use a local LLM for privacy if the competitive data is sensitive.

**Multi-Format Document Q&A** (Chapters 8, 9, 10, 11)
Build a system that ingests PDFs, Word documents, spreadsheets, and images into a single searchable index. Use LlamaIndex's data loaders for document ingestion, ChromaDB for storage, and a multimodal LLM for image-containing documents.

## Advanced Projects

**Autonomous Research Agent** (Chapters 17, 18)
Extend the Business Idea Validator from Chapter 17 with real tools: web search, database queries, and document retrieval. The agent should plan its own research, execute each step with actual data sources, synthesize findings, and self-critique. Add an iteration loop so it can refine its plan based on its own critique.

**Customer Support Multi-Agent System** (Chapters 16, 18, 19)
Build a multi-agent customer support system where:
- Agent 1 classifies the ticket (billing, technical, account)
- Agent 2 retrieves relevant knowledge base articles (RAG)
- Agent 3 drafts a response
- Agent 4 checks the response for accuracy and tone
Deploy as an MCP server on Google Cloud Run so it can be called from a web app or Dify.

**Fine-Tuned Domain Expert** (Chapters 8, 15, 16)
Fine-tune a small model (Qwen 0.5B or 1.5B) on domain-specific Q&A pairs from your industry. Compare its answers to RAG-based answers from the same knowledge base. When does fine-tuning win? When does RAG win? Build a hybrid system that uses both.

**Campus Services App with MCP** (Chapters 18, 19)
Extend the KU Parking Assistant pattern to other campus services: dining hall menus, library hours, bus schedules, event calendars. Each service is a separate MCP tool. Build a single agent that can answer any campus question by calling the appropriate tool. Deploy the tools on Google Cloud Run and build a Dify frontend.

**AI-Powered Business Dashboard** (Chapters 7, 10, 13, 16)
Connect to a business database, build text-to-SQL for ad-hoc queries, add RAG over company reports for qualitative insights, and create a Gradio or Streamlit dashboard that combines both. Users can ask "What were Q3 sales by region?" (SQL) and "What does our annual report say about expansion plans?" (RAG) in the same interface.

## Tips for Project Success

**Start small, then expand.** Get a minimal working version first (one data source, one question type, one agent). Then add complexity: more data, more agents, better error handling, a nicer UI.

**Use vibe coding.** Feed any notebook from this book to Claude Code, Cursor, or Antigravity and say "Adapt this for [your use case]." The AI will restructure the code for your specific data and requirements.

**Document your prompts.** The most important artifact in any LLM project is not the code — it is the system prompts. Keep a log of which prompts worked and which did not, and why.

**Measure, do not assume.** Always compare your AI system's output against a known-correct answer for at least 10-20 test cases. Accuracy on your test set is the only metric that matters — not how impressive the demo looks.
