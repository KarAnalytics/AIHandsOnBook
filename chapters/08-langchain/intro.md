# LangChain

LangChain is a modular, open-source toolkit for building applications powered by large language models. Where LlamaIndex offers an opinionated, batteries-included approach that gets you from documents to answers in three lines of code, LangChain takes the opposite philosophy: it gives you a collection of composable components and lets you wire them together explicitly. You choose the document loader, the text splitter, the embedding model, the vector store, and the chain architecture. Nothing is hidden and nothing is assumed. This makes LangChain more verbose for simple use cases but far more flexible when your application outgrows a standard RAG template. If LlamaIndex is a point-and-shoot camera, LangChain is a camera with interchangeable lenses, manual focus, and full exposure control.

## Core Components

LangChain organizes its functionality into a set of well-defined component categories. Document Loaders handle ingestion from various sources, much like LlamaIndex's data loaders. The `DirectoryLoader` and `TextLoader` classes read local files, while community-contributed loaders handle PDFs, web pages, databases, and cloud services. Text Splitters break documents into chunks, with `RecursiveCharacterTextSplitter` being the most commonly used option. It splits on natural boundaries (paragraphs, sentences, words) and supports configurable chunk sizes and overlap, giving you fine-grained control over the chunking strategy. Embeddings convert text into vectors using models from HuggingFace, OpenAI, or other providers. Vector Stores handle storage and similarity search, with LangChain supporting FAISS, ChromaDB, Pinecone, Weaviate, and many others through a unified interface. Finally, Chains and Runnables compose these components into end-to-end pipelines.

## LCEL: The Pipe Syntax for Composing Chains

The modern way to build pipelines in LangChain is through LCEL, the LangChain Expression Language. LCEL uses Python's pipe operator (`|`) to chain processing steps together, creating a syntax that reads like a data flow diagram. A typical RAG chain in LCEL looks like this:

```
chain = retriever | format_docs | prompt | llm | parser
```

Reading left to right: the retriever fetches relevant document chunks, `format_docs` joins them into a single context string, the prompt template inserts that context alongside the user's question, the LLM generates a response, and the output parser extracts the final text. Each component in the pipe is a Runnable, an object with an `.invoke()` method that accepts input and returns output. The pipe operator connects the output of one Runnable to the input of the next, much like Unix pipes connect shell commands.

This syntax is more than cosmetic convenience. LCEL chains automatically support streaming (`.stream()` for token-by-token output), batch processing (`.batch()` for parallel execution across multiple inputs), async execution (`.ainvoke()` for non-blocking calls), and integration with LangSmith for tracing and debugging. A hand-written Python class that does the same RAG logic would need to implement all of these features manually.

## RunnableLambda: Bridging Plain Functions into LCEL Pipes

There is one subtlety that trips up newcomers. LCEL's pipe operator only works between Runnables, objects that implement the `.invoke()` interface. A plain Python function does not have this interface, so writing `my_function | another_function` would fail with a `TypeError`. The solution is `RunnableLambda(func)`, which wraps any plain function into a Runnable. You only need to wrap the first function in a pipe explicitly; once the left side of a pipe is a Runnable, LangChain automatically coerces any plain functions on the right into Runnables. This small utility is what makes it possible to inject arbitrary custom logic into an LCEL pipeline without writing a full Runnable subclass.

## Agents with Tools

RAG is just one pattern that LangChain supports. Its real power emerges with Agents, LLMs that can decide which functions to call based on the user's question. An agent is given a set of tools, plain Python functions with descriptions, and a system prompt that instructs it to reason about which tool to invoke. When the user asks "What was Acme's revenue last quarter?", the agent might call a `company_lookup` tool. When asked "What is 15% of 2.4 million?", it calls a `calculator` tool. When no tool is needed, it answers directly.

This decision-making process follows the ReAct pattern: Reason about the question, Act by calling a tool, Observe the result, and then either act again or produce a final answer. In the accompanying notebook, the agent loop is implemented as an LCEL pipe where each iteration sends the conversation to the LLM, parses the response for a tool-call JSON, executes the tool if one is requested, and appends the result to the conversation history. A Python loop drives the iteration because LCEL chains are inherently linear and cannot express "repeat until a condition is met." This limitation is precisely what motivates LangGraph, which you will encounter in the next chapter.

## When to Use LangChain vs. LlamaIndex

The choice between the two frameworks is not about which is better in the abstract but about which fits your use case. LlamaIndex excels at document question-answering scenarios where you want a working prototype quickly and the default chunking, indexing, and retrieval behavior is good enough. Its high-level abstractions minimize boilerplate and let you focus on the data rather than the plumbing. LangChain excels when you need fine-grained control over the pipeline, when your application involves agents and tool use, when you want to compose non-standard workflows, or when you need to integrate with a broad ecosystem of vector stores, LLM providers, and community extensions. Many production teams use both: LlamaIndex for straightforward document ingestion and indexing, and LangChain for the orchestration and agent logic that sits on top.

## The Hands-On Notebook

The notebook that follows this introduction builds a complete RAG pipeline with LangChain using the same three fictional companies (Acme Analytics, Globex Cybersecurity, and Nextera Green Solutions) that you encountered in the LlamaIndex chapter. You will load documents with `DirectoryLoader`, split them with `RecursiveCharacterTextSplitter`, embed and index them in a FAISS vector store, and build a retrieval chain using LCEL pipe syntax. The notebook then goes beyond RAG to demonstrate a tool-calling agent that can look up company information, perform calculations, and report the current date, all orchestrated through an LCEL-based ReAct loop. This progression from retrieval to agency illustrates why LangChain has become the default framework for LLM application development.

## References

1. LangChain Documentation. "Introduction." LangChain, 2025. [https://python.langchain.com/docs/introduction/](https://python.langchain.com/docs/introduction/)

2. LangChain Documentation. "LangChain Expression Language (LCEL)." LangChain, 2025. [https://python.langchain.com/docs/concepts/lcel/](https://python.langchain.com/docs/concepts/lcel/)

3. Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). "ReAct: Synergizing Reasoning and Acting in Language Models." *International Conference on Learning Representations (ICLR)*. [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)

4. Johnson, J., Douze, M., & Jegou, H. (2021). "Billion-Scale Similarity Search with GPUs." *IEEE Transactions on Big Data*, 7(3), 535-547. [https://github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)

5. Chase, H. "LangChain: Building Applications with LLMs through Composability." GitHub, 2025. [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)
