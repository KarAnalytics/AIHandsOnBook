# LlamaIndex

LlamaIndex is a framework that abstracts the entire RAG pipeline into a few lines of code. Where earlier chapters built everything manually (chunking, embedding, retrieval, prompting), LlamaIndex handles it all with `SimpleDirectoryReader` + `VectorStoreIndex` + `query_engine`.

This chapter demonstrates LlamaIndex with three fictional company document sets, showing how the framework automatically routes questions to the correct company's documents.
