# Glossary

Key terms used throughout this book, listed alphabetically.

**Agent** — An LLM that can use tools (functions, APIs, databases) to take actions beyond text generation. Agents decide which tools to call based on the user's question.

**Attention** — The mechanism that allows a transformer model to weigh the relevance of different parts of the input when producing each output token. Self-attention computes relationships between all pairs of tokens in a sequence.

**Base Model** — An LLM after pre-training but before any fine-tuning or instruction tuning. Base models are good at text completion but not at following instructions.

**BPE (Byte Pair Encoding)** — A subword tokenization algorithm that iteratively merges the most frequent pairs of characters or tokens. Used by GPT models.

**Cascade (llm_cascade)** — The automatic provider fallback system used in this book. When one LLM provider hits its quota, the cascade automatically tries the next available provider.

**ChromaDB** — An open-source vector database used for storing and searching embeddings. Used in several RAG chapters of this book.

**CLIP (Contrastive Language-Image Pre-training)** — A model by OpenAI that embeds both text and images into the same vector space, enabling cross-modal retrieval. Used in the Image RAG and Video RAG chapters.

**Cosine Similarity** — A measure of how similar two vectors are, computed as the cosine of the angle between them. Ranges from -1 (opposite) to 1 (identical). Used in RAG to find the most relevant document chunks for a query.

**Cypher** — A query language for graph databases, analogous to SQL for relational databases. Used with Kùzu in the Graph RAG chapter.

**Dify** — A visual LLM application builder that supports workflows, chatflows, knowledge bases, and tool integration. Used in the Deployment chapter.

**Embedding** — A dense vector representation of a token, word, sentence, or document. Embeddings capture semantic meaning: similar concepts have similar vectors.

**FAISS (Facebook AI Similarity Search)** — A library for efficient similarity search of dense vectors. Used in the LangChain chapter.

**Fine-Tuning** — Updating a pre-trained model's weights on a specific dataset to teach it new knowledge or behavior. Contrasts with RAG, which retrieves knowledge at query time.

**GGUF** — A file format for quantized LLM weights optimized for CPU inference. Used by LM Studio and Ollama.

**GloVe (Global Vectors)** — A pre-trained word embedding model that captures semantic relationships from co-occurrence statistics. Used in the Embeddings notebook.

**Hallucination** — When an LLM generates confident but factually incorrect information. RAG and tool use are designed to reduce hallucination by grounding answers in retrieved evidence.

**Haversine Formula** — A formula for computing the great-circle distance between two points on a sphere given their latitudes and longitudes. Used in the KU Parking Assistant.

**JSON-RPC** — A remote procedure call protocol encoded in JSON. The MCP protocol uses JSON-RPC 2.0 for communication between clients and tool servers.

**LCEL (LangChain Expression Language)** — LangChain's pipe syntax for composing chains. Uses the `|` operator: `retriever | format_docs | prompt | llm | parser`.

**LlamaHub** — A registry of 300+ data loaders for LlamaIndex, supporting sources like Google Drive, Notion, GitHub, databases, and local files.

**LLM (Large Language Model)** — A neural network trained on vast text data to predict the next token. Examples: GPT-4, Gemini, Claude, Llama.

**LM Studio** — A desktop application for downloading, managing, and running open-weight LLMs locally with a visual interface.

**LoRA (Low-Rank Adaptation)** — A parameter-efficient fine-tuning technique that injects small trainable matrices into model layers, training only ~0.5% of parameters while keeping the rest frozen.

**MCP (Model Context Protocol)** — A standard protocol for exposing tools to LLMs. MCP servers provide tool discovery (`tools/list`) and execution (`tools/call`) over a standard interface.

**Multimodal** — Models or systems that process multiple types of input (text, images, audio, video) using the same architecture.

**NF4 (NormalFloat4)** — A 4-bit quantization format optimized for fine-tuning. Used in QLoRA to compress model weights to 25% of their original size.

**Ollama** — A command-line tool for running open-weight LLMs locally. Exposes an OpenAI-compatible API server.

**Prompt Engineering** — The practice of crafting input prompts to elicit desired behavior from an LLM. Includes techniques like few-shot examples, chain-of-thought, and system prompts.

**QLoRA (Quantized Low-Rank Adaptation)** — Combines 4-bit quantization with LoRA to enable fine-tuning of large models on consumer GPUs. Covered in the Fine-Tuning chapter.

**Quantization** — Compressing model weights from higher precision (FP16/FP32) to lower precision (INT4/INT8) to reduce memory usage and increase inference speed.

**RAG (Retrieval-Augmented Generation)** — A technique that retrieves relevant documents from a knowledge base and includes them in the LLM prompt, grounding the model's answer in evidence rather than parametric memory.

**ReAct (Reasoning + Acting)** — An agent pattern where the LLM reasons about which tool to call, calls it, observes the result, and repeats until it has enough information to answer.

**RLHF (Reinforcement Learning from Human Feedback)** — A post-training technique where human evaluators rank model outputs, and a reward model trains the LLM to produce higher-ranked responses.

**RunnableLambda** — A LangChain wrapper that converts a plain Python function into a Runnable, enabling it to participate in LCEL pipe chains.

**SFT (Supervised Fine-Tuning)** — Training a base model on curated prompt-response pairs to teach it instruction following. The first step of post-training.

**StateGraph** — LangGraph's core abstraction: a directed graph where nodes are processing functions and edges define the flow of a typed state dictionary.

**Supabase Edge Functions** — Serverless functions (Deno/TypeScript) hosted on Supabase's infrastructure. Used in this book to deploy MCP servers as public HTTPS endpoints.

**System Prompt** — Instructions given to an LLM that define its role, behavior, and constraints. Separate from the user's message.

**TF-IDF (Term Frequency-Inverse Document Frequency)** — A classical text representation that assigns weights to words based on their frequency in a document relative to the corpus. High weight = important to that specific document.

**Token** — The fundamental unit of text that an LLM processes. A token may be a word, subword, or character, depending on the tokenizer.

**Transformer** — The neural network architecture behind all modern LLMs. Introduced in the 2017 paper "Attention Is All You Need." Uses self-attention to process sequences in parallel.

**TypedDict** — A Python typing construct that defines a dictionary with specific key names and value types. Used in LangGraph to define the state that flows through a graph.

**Vector Database** — A database optimized for storing and searching high-dimensional vectors (embeddings). Examples: ChromaDB, Pinecone, FAISS, Weaviate, Milvus, LanceDB.

**Vibe Coding** — Building software by describing intent in natural language and letting an AI agent write the code. Coined by Andrej Karpathy in 2025.

**Word2Vec** — An algorithm that learns word embeddings by predicting context words. Demonstrates that semantic relationships are captured as vector arithmetic (e.g., king - man + woman ≈ queen).
