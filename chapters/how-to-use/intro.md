# How to Use This Book

This book is designed to be practical, modular, and immediately useful — whether you are reading it cover to cover, referencing a specific chapter to solve a problem, or feeding its notebooks to an AI coding agent to build something new. Different readers will use it differently, and that is by design. This short chapter explains the recommended approaches for different audiences and offers guidance on how to get the most value from the hands-on materials.

## For Hobbyists and Casual Readers

If you are exploring AI out of curiosity or professional interest, the simplest approach is to read the chapters sequentially from beginning to end. Each chapter builds on the ones before it, introducing concepts in the order that makes them easiest to absorb. Start with the big picture in Chapter 1 (AI at a Glance), work through the foundations of how LLMs process language, set up your own local models and coding environment, and then move into the application chapters — RAG, frameworks, fine-tuning, and agents. You do not need to run every notebook. Reading the chapter introductions and skimming the code will give you a solid conceptual understanding. But when a topic catches your interest, clicking the Colab link and running the notebook yourself will deepen your understanding far beyond what reading alone can achieve.

## For Students in a Course

If you are using this book as part of a university course, the recommended approach is to treat it as a **practical companion** to conceptual textbooks, not as a replacement for them. The chapter introductions provide context and motivation, but they are intentionally concise — they cover the "what" and "why" at a level sufficient to understand the code, not at the depth required to truly master the underlying theory.

For deeper conceptual grounding, pair this book with one or more of the textbooks and resources listed in the References section below. Read the theory in a textbook first, then come to this book to see that theory put into practice. For example, read about attention mechanisms and transformer architectures in a textbook, then run the attention notebook in Chapter 2 to see attention weights computed and visualized on real data. Read about retrieval-augmented generation in a research paper, then build a RAG pipeline from scratch in Chapter 8. The combination of conceptual depth from a textbook and hands-on practice from this book produces a far richer understanding than either alone.

## For Practitioners Solving Specific Problems

If you already have a working knowledge of AI and are looking for starter code or reference implementations for a specific task, use this book as a **reference manual**. The table of contents is organized by application pattern, so you can jump directly to the chapter that matches your problem:

- Need to build a document Q&A system? Start with Chapter 8 (RAG from First Principles) or Chapter 12 (LlamaIndex).
- Need to query a SQL database with natural language? Go to Chapter 10 (RAG with Structured Data).
- Need to build an agent-based workflow? Chapters 16–18 cover agentic, autonomous, and tool-using architectures.
- Need to fine-tune a model on company-specific data? Chapter 15 (QLoRA) has a complete working example.
- Need to deploy an AI tool as a cloud service? Chapter 19 covers MCP servers on Supabase and no-code workflows with Dify.

Each notebook is self-contained — you can run it independently without working through the preceding chapters. The `llm_cascade` package handles API key management and provider fallback, so you only need to set one API key to get any notebook running. See Chapter 4 for step-by-step instructions on acquiring a free API key and storing it in Colab or a local `.env` file.

## Feeding Notebooks to AI Coding Tools

One of the most powerful ways to use this book is as **seed material for vibe coding**. Take any notebook, feed it to Claude Code, Cursor, GitHub Copilot, or Antigravity, and ask the AI to adapt it to your specific business problem. For instance, you might take the KU Parking Assistant notebook and say: "Adapt this to find the nearest coffee shops to any office in our company's building directory." The AI coding agent understands the pattern (tool-calling agent with distance calculation) and can restructure the code for your use case in minutes.

This approach works because the notebooks are well-structured with clear function boundaries, consistent naming conventions, and explanatory markdown between code cells. They serve as effective templates that an AI agent can read, understand, and modify — far more effectively than starting from a blank file.

## A Word of Caution: Stay Grounded

While the tools covered in this book — from llm_cascade to vibe coding — make AI development remarkably accessible, it is critically important to **understand what you are doing**. Do not blindly trust AI-generated outputs. Do not run code expecting it to produce correct results magically. Large language models are statistical systems that can hallucinate, make logical errors, and produce plausible-sounding but incorrect answers.

Every chapter in this book emphasizes grounding: RAG grounds answers in retrieved evidence, fine-tuning grounds the model in domain-specific knowledge, and tool-using agents ground reasoning in deterministic computations. But the final line of defense is always you — the human who understands the problem domain, can evaluate whether an answer makes sense, and takes responsibility for the decisions made with AI assistance.

As you work through the hands-on exercises, develop the habit of asking: *Does this output make sense given what I know about the problem?* This critical evaluation skill is what separates effective AI practitioners from those who merely run code and hope for the best.

## Recommended Textbooks and Resources

The following resources provide deeper conceptual coverage of the topics in this book. They are listed in order of relevance to the material covered here.

**Textbooks:**

- Chen, W., & Chen, L. (2025). *Generative AI for Business: Frameworks, Techniques, and Governance*. GenAI Flows Publishing. ISBN 979-8-9997161-0-1. https://genai4all.org/ — Comprehensive coverage of generative AI frameworks and governance considerations for business applications.

- Alammar, J., & Grootendorst, M. (2024). *Hands-On Large Language Models: Language Understanding and Generation*. O'Reilly Media. https://www.amazon.com/Hands-Large-Language-Models-Understanding/dp/1098150961 — Excellent visual explanations of transformer architectures, embeddings, and language generation.

- Bouchard, L. F., & Peters, L. (2024). *Building LLMs for Production: Enhancing LLM Abilities and Reliability with Prompting, Fine-Tuning, and RAG*. Towards AI, Inc. https://a.co/d/5a0kIUx — Practical guide to production RAG systems, prompt engineering, and fine-tuning.

- Raschka, S. (2024). *Build a Large Language Model (From Scratch)*. Manning Publications. https://www.manning.com/books/build-a-large-language-model-from-scratch — For readers who want to understand every layer of the transformer by implementing one.

**Video Lectures:**

- Karpathy, A. (2025). *Deep Dive into LLMs like ChatGPT* [Video, 3.5 hours]. YouTube. https://www.youtube.com/watch?v=7xTGNNLPyMI — The single best overview of how LLMs are built, from pre-training to RLHF to System 2 reasoning. Highly recommended before starting this book.

- Karpathy, A. (2024). *Let's Build GPT: From Scratch, in Code, Spelled Out* [Video]. YouTube. https://www.youtube.com/watch?v=kCc8FmEb1nY — A hands-on coding walkthrough of building a GPT-style model from the ground up.

**Online Courses and Workshops:**

- Google & Kaggle. (2025). *5-Day Gen AI Intensive Course*. https://www.kaggle.com/learn-guide/5-day-genai — A structured five-day workshop covering embeddings, RAG, agents, and MLOps with hands-on Kaggle notebooks.

- LangChain Academy. (2026). *LangChain and LangGraph Courses*. https://academy.langchain.com/collections — Official courses from the LangChain team covering chains, agents, and graph-based orchestration.

- Gábors Data Analysis. (2026). *AI Course Materials*. https://gabors-data-analysis.com/ai-course/ — Data analysis and AI course materials with a focus on practical applications.

- DeepLearning.AI. (2026). *Short Courses on LLMs and RAG*. https://www.deeplearning.ai/short-courses/ — A growing library of focused courses by Andrew Ng and collaborators on specific AI topics including RAG, fine-tuning, and agents.

Each of these resources complements this book from a different angle. The textbooks provide theoretical depth. The video lectures build intuition. The online courses offer structured learning paths. This book provides the hands-on practice environment where all of those concepts come to life.
