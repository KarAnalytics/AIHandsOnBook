# RAG with Vector Databases

In the previous chapter, you built a RAG pipeline from scratch using NumPy arrays to store embeddings and brute-force cosine similarity to find relevant passages. That approach is excellent for learning, but it does not scale. When your document collection grows from a handful of passages to thousands or millions of chunks, storing all embeddings in a Python list and comparing every one of them against every query becomes prohibitively slow and memory-intensive. This is the problem that vector databases were designed to solve.

## What Vector Databases Do

A vector database is a specialized data store optimized for three operations: storing high-dimensional embedding vectors alongside their metadata, indexing those vectors using data structures that enable fast approximate search, and retrieving the most similar vectors to a given query vector without scanning the entire collection. Traditional relational databases are built around exact matches on structured fields -- find all customers where `state = 'Kansas'`. Vector databases are built around similarity -- find the ten document chunks whose meaning is closest to this question.

Under the hood, vector databases use approximate nearest neighbor (ANN) algorithms such as HNSW (Hierarchical Navigable Small World) graphs or IVF (Inverted File Index) structures. These algorithms trade a small amount of accuracy for massive speed improvements. Instead of computing similarity against every vector in the collection, they navigate an index structure that quickly narrows the search to a small neighborhood of likely candidates. The result is that a query against a million vectors can return results in milliseconds rather than seconds.

## ChromaDB: A Practical Starting Point

This book uses ChromaDB as its primary vector database because it strikes an ideal balance between simplicity and capability. ChromaDB is open-source, installs with a single `pip install` command, runs entirely in-process without requiring a separate server, and provides a clean Python API that closely mirrors the conceptual steps of RAG. For learning purposes, ChromaDB removes all infrastructure friction so you can focus on understanding the patterns rather than wrestling with deployment configurations.

ChromaDB also handles embedding generation automatically if you want it to, though in our notebooks we generate embeddings explicitly using the `llm_cascade` package so that you see every step. Collections in ChromaDB function like tables in a relational database: each collection holds a set of documents, their embedding vectors, and optional metadata that can be used for filtering during search.

## The Indexing Step

Building a searchable knowledge base with a vector database follows the same conceptual pipeline you implemented manually in the previous chapter, but with the storage and indexing handled for you. First, you load your source documents and split them into chunks of appropriate size. Second, you generate an embedding vector for each chunk using an embedding model. Third, you store each chunk's text, embedding, and metadata in a ChromaDB collection. ChromaDB automatically builds an index over the stored vectors so that subsequent searches are fast.

This indexing step is typically performed once (or periodically as documents are updated) and represents the "offline" phase of a RAG system. The computational cost is dominated by the embedding generation, since every chunk must pass through the embedding model. Once indexed, the collection is ready to serve queries.

## The Query Step

When a user asks a question, the query step mirrors retrieval in reverse. The question is first converted into an embedding vector using the same embedding model that was used during indexing -- this consistency is essential, since vectors from different models are not comparable. ChromaDB then performs a similarity search against its indexed collection and returns the top-K most similar chunks, along with their text, metadata, and similarity scores. These retrieved chunks are assembled into a prompt, and the LLM generates a grounded answer.

The entire query path -- embed, search, retrieve, generate -- typically completes in one to two seconds, with the LLM generation step accounting for the majority of that latency. The vector search itself, even over large collections, is nearly instantaneous thanks to the ANN index.

## The Broader Vector Database Landscape

ChromaDB is an excellent choice for learning and prototyping, but production applications often require databases with different characteristics. Pinecone is a fully managed cloud service that eliminates all operational overhead and scales automatically, making it popular with teams that want to avoid managing infrastructure. Weaviate is an open-source vector database with a rich feature set including hybrid search that combines semantic and keyword matching. Milvus, originally developed at Zilliz, is designed for very large-scale deployments handling billions of vectors. FAISS, developed by Meta, is a library rather than a database -- it provides highly optimized similarity search algorithms but requires you to manage storage and persistence yourself.

The choice among these options depends on your requirements. For a classroom exercise or an internal prototype, ChromaDB is ideal. For a production application with moderate scale and a preference for managed services, Pinecone is a strong choice. For large-scale enterprise deployments with complex filtering and hybrid search needs, Weaviate or Milvus offer the necessary capabilities. FAISS is best suited for research environments or applications where you need maximum control over the search algorithms.

## What Comes Next

The hands-on notebooks that follow this introduction apply the vector database approach to real-world datasets. You will see how to load documents into ChromaDB, build searchable collections, perform similarity queries, and generate grounded answers -- all following the same retrieve-augment-generate pattern from the previous chapter, but now with infrastructure that scales gracefully beyond toy examples.

## References

1. Chroma. "ChromaDB Documentation." Chroma, 2025. [https://docs.trychroma.com/](https://docs.trychroma.com/)

2. Malkov, Y. A., & Yashunin, D. A. (2020). "Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs." *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 42(4), 824-836. [https://arxiv.org/abs/1603.09320](https://arxiv.org/abs/1603.09320)

3. Johnson, J., Douze, M., & Jegou, H. (2021). "Billion-Scale Similarity Search with GPUs." *IEEE Transactions on Big Data*, 7(3), 535-547. [https://arxiv.org/abs/1702.08734](https://arxiv.org/abs/1702.08734)

4. Pinecone. "What is a Vector Database?" Pinecone Learning Center, 2025. [https://www.pinecone.io/learn/vector-database/](https://www.pinecone.io/learn/vector-database/)
