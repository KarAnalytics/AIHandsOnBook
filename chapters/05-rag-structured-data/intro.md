# RAG with Structured Data

RAG isn't limited to text documents. When your data lives in a **SQL database** or a **graph database**, the "retrieval" step becomes a query (SQL or Cypher) rather than a vector search.

This chapter covers two variants:
- **DBMS RAG** — the LLM generates SQL queries against a SQLite database, executes them, and answers based on the results
- **Graph RAG** — the LLM generates Cypher queries against a Kùzu graph database for relational/network data

Both follow the same pattern: retrieve evidence → stuff into prompt → generate answer. Only the retrieval mechanism changes.
