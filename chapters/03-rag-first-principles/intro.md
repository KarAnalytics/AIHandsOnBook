# RAG from First Principles

Large language models are remarkably capable, but they share three fundamental limitations that create serious problems for business applications. First, LLMs hallucinate: they generate confident, fluent answers that are factually wrong. A model asked about your company's Q3 revenue might invent a plausible-sounding number rather than admitting it does not know. Second, LLMs have a knowledge cutoff. Every model was trained on a snapshot of the world that ends on a specific date, meaning it cannot answer questions about events, policies, or data that emerged after training. Third, and most critically for enterprises, LLMs have no access to private data. Your internal HR policies, proprietary research reports, customer records, and strategic documents were never part of any model's training set, so the model simply cannot reason about them.

Retrieval-Augmented Generation, or RAG, solves all three problems with a single architectural pattern. Instead of asking the LLM to recall facts from memory, you first retrieve relevant documents from your own data sources, then augment the prompt with that retrieved context, and finally let the model generate an answer grounded in the evidence you provided. The model is no longer guessing. It is reading your documents and synthesizing an answer from them, much like a well-prepared analyst who reviews the relevant files before writing a memo.

## The Retrieve-Augment-Generate Pipeline

A RAG system follows a straightforward three-stage pipeline. In the retrieval stage, the user's question is used to search a collection of documents and find the passages most relevant to the query. In the augmentation stage, those retrieved passages are assembled into a prompt alongside the user's question and any system-level instructions. In the generation stage, the LLM reads the augmented prompt and produces an answer that draws on the retrieved evidence.

What makes this elegant is that each stage is modular. You can swap out the retrieval mechanism (keyword search, semantic search, hybrid approaches) without changing the generation step. You can switch LLM providers without touching the retrieval logic. And you can update your document collection at any time without retraining anything. This modularity is what makes RAG the dominant approach for knowledge-grounded AI applications in production today.

## Chunking Documents

Before documents can be searched, they must be broken into smaller pieces called chunks. A 50-page PDF cannot be fed into a model's context window in its entirety, nor would doing so help with precise retrieval. Instead, the document is split into passages, typically ranging from 200 to 1,000 tokens each, that are individually indexed and searchable.

Chunk size is a critical design decision that involves a genuine tradeoff. Small chunks (say, 200 tokens) provide high precision: when a chunk matches a query, the retrieved text is tightly focused on the relevant topic, and less irrelevant context is injected into the prompt. However, small chunks risk losing important surrounding context. A sentence that says "the company exceeded its targets" is meaningless without knowing which company and which targets. Larger chunks (800 to 1,000 tokens) preserve more context but may include irrelevant material that dilutes the signal or wastes precious tokens in the model's context window.

In practice, most RAG systems experiment with chunk sizes and use overlapping windows, where each chunk shares some text with the preceding and following chunks, to ensure that important information at chunk boundaries is not lost. There is no universally optimal chunk size; the right choice depends on the nature of your documents, the types of questions users ask, and the context window of your chosen LLM.

## Embeddings and Semantic Search

The magic of modern RAG lies in semantic search powered by embeddings. As you explored in Chapter 1, an embedding is a dense numerical vector that captures the meaning of a piece of text. When two passages discuss similar concepts, their embedding vectors point in similar directions in high-dimensional space, even if they use completely different words. This is a dramatic improvement over traditional keyword search, which would fail to connect a query about "employee attrition" with a document discussing "staff turnover."

To perform semantic search, every chunk in your document collection is converted into an embedding vector and stored alongside its text. When a user asks a question, that question is also embedded into a vector using the same model. The system then computes the cosine similarity between the question vector and every chunk vector. Cosine similarity measures the angle between two vectors: a value of 1.0 means the vectors are identical in direction (maximally similar), while a value of 0.0 means they are orthogonal (unrelated). The chunks with the highest cosine similarity scores are returned as the most relevant results.

This entire process -- embedding documents, embedding the query, computing similarities, and ranking results -- can be implemented in a few dozen lines of Python using nothing more than an embedding API and NumPy. Building it from scratch, as you will do in the hands-on notebook that follows this introduction, is the best way to internalize how semantic search actually works before relying on frameworks that abstract it away.

## Prompt Construction: Stuffing Context

Once the top-K most relevant chunks have been retrieved, they are "stuffed" into the LLM prompt. A typical prompt template looks something like: "You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know." This is followed by the concatenated chunk texts and then the user's question.

This approach is called context stuffing, and it is deliberately simple. The LLM does not need any special fine-tuning or modification to work with retrieved context. You are simply providing it with reference material in the prompt, the same way you might hand a colleague a stack of documents before asking them a question. The quality of the answer depends heavily on the quality of the retrieved chunks: if the retrieval stage surfaces the right passages, the LLM will generally produce an accurate, well-grounded answer. If retrieval fails, no amount of prompt engineering will compensate.

## RAG vs. Fine-Tuning

A common question is when to use RAG versus fine-tuning. Fine-tuning permanently modifies a model's weights by training it on additional data, effectively teaching the model new knowledge or behaviors. RAG leaves the model's weights untouched and instead provides external knowledge at inference time through the prompt.

RAG is the right choice when your knowledge base changes frequently (product catalogs, policy documents, news), when you need to cite sources and provide provenance for answers, when you want to maintain a single general-purpose model across multiple use cases, and when you need to get started quickly without the expense and complexity of training. Fine-tuning is more appropriate when you need to change the model's style or behavior (such as adopting a specific brand voice), when the task requires specialized reasoning patterns that prompting alone cannot achieve, or when you need the knowledge baked into the model for latency-critical applications where retrieval would add unacceptable delay.

In practice, many production systems combine both approaches: a fine-tuned model that has learned the organization's tone and reasoning style, augmented with RAG to provide up-to-date factual grounding. But for the vast majority of business use cases, RAG alone is sufficient and dramatically easier to implement and maintain.

## What Comes Next

The hands-on notebook that follows this introduction walks you through building a complete RAG pipeline from scratch. You will chunk real documents, generate embeddings using an API, compute cosine similarity with NumPy, retrieve relevant passages, construct augmented prompts, and generate grounded answers -- all without any frameworks or abstractions. This from-scratch implementation gives you the foundational understanding that will make the framework-based approaches in later chapters feel intuitive rather than magical.

For a related approach, see [RAG with Vector Databases](../04-rag-vector-databases/intro.md).

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- RAG solves three fundamental LLM limitations simultaneously: hallucinations (by grounding answers in retrieved evidence), knowledge cutoffs (by providing current documents), and lack of private data access (by retrieving from your own sources).
- The retrieve-augment-generate pipeline is modular — you can swap retrieval mechanisms, LLM providers, or document collections independently without changing the other components.
- Chunk size is a critical design tradeoff: smaller chunks give higher retrieval precision but risk losing surrounding context; larger chunks preserve context but may include irrelevant material and waste tokens.
- Semantic search via embeddings and cosine similarity dramatically outperforms keyword search because it connects queries to documents based on meaning, not exact word matches (e.g., "employee attrition" matches "staff turnover").
- RAG is preferred over fine-tuning when your knowledge base changes frequently, you need source citations, or you want to get started quickly — fine-tuning is better for changing model style or baking in specialized reasoning.
:::

## Exercises

**Easy:** Explain in your own words why RAG is preferred over fine-tuning for a company that updates its product catalog weekly. Identify at least two specific advantages of RAG in this scenario.

**Easy:** Take a one-page document and manually chunk it into pieces of approximately 200 tokens each. Then re-chunk it at 500 tokens. Compare the two approaches: which chunks better preserve the context needed to answer a specific question about the document?

**Medium:** Using the from-scratch RAG notebook, experiment with retrieving the top-1 vs. top-3 vs. top-5 chunks for the same query. Compare the generated answers and identify the point where adding more chunks stops improving answer quality and starts introducing noise.

**Challenge:** Build a from-scratch RAG pipeline for a new domain: download three Wikipedia articles on a topic of your choice, chunk them, generate embeddings, and implement cosine similarity retrieval with NumPy. Test with five questions and evaluate whether the grounded answers are more accurate than the LLM's ungrounded responses. Document any cases where retrieval fails and explain why.

## References

1. Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Kuttler, H., Lewis, M., Yih, W., Rocktaschel, T., Riedel, S., & Kiela, D. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*, 33, 9459-9474. [https://arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)

2. Gao, Y., Xiong, Y., Dibia, V., Zhang, L., & Han, J. (2024). "Retrieval-Augmented Generation for Large Language Models: A Survey." *arXiv preprint arXiv:2312.10997*. [https://arxiv.org/abs/2312.10997](https://arxiv.org/abs/2312.10997)

3. OpenAI. "Embeddings Guide." OpenAI Platform Documentation, 2025. [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings)

4. Karpukhin, V., Oguz, B., Min, S., Lewis, P., Wu, L., Edunov, S., Chen, D., & Yih, W. (2020). "Dense Passage Retrieval for Open-Domain Question Answering." *Proceedings of EMNLP 2020*. [https://arxiv.org/abs/2004.04906](https://arxiv.org/abs/2004.04906)
