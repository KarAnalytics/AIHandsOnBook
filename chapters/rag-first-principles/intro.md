# RAG from First Principles

Retrieval-Augmented Generation (RAG) is the most important technique for grounding LLM answers in your own data. Instead of hoping the LLM memorized the right facts during training, you *retrieve* relevant documents and *stuff* them into the prompt.

This chapter builds a complete RAG pipeline from scratch — no frameworks, no abstractions. You'll implement every step manually: chunking, embedding, vector search, prompt construction, and generation. This gives you the deepest understanding of what frameworks like LlamaIndex and LangChain do under the hood.
