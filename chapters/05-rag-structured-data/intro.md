# RAG with Structured Data

The previous chapters built RAG pipelines that retrieve text chunks from documents and vector databases. That approach works well when your knowledge base consists of unstructured text, but most enterprise data does not live in PDFs or markdown files. It lives in relational databases, data warehouses, and increasingly in graph databases that capture complex relationships between entities. The good news is that RAG is not limited to text documents. Any data source that can provide evidence for an LLM's answer can serve as the retrieval backend. This chapter explores two structured-data variants of RAG that follow the same retrieve-augment-generate pattern you already know, but replace vector similarity search with query execution against a database.

## DBMS RAG: Grounding Answers on SQL Query Results

When your data is structured and tabular, the most natural retrieval mechanism is a SQL query. DBMS RAG implements this idea through a two-phase retrieval process that is conceptually different from document RAG.

In the first phase, the system retrieves the database schema rather than any actual data. The schema, consisting of CREATE TABLE statements, column names, data types, foreign key constraints, and a handful of sample rows, is injected into the prompt as context. This schema context tells the LLM what tables exist, how they relate to each other, and what the data looks like. The LLM then uses this context to generate a SQL query that answers the user's natural-language question. This text-to-SQL step is the first LLM call in the pipeline.

In the second phase, the generated SQL query is executed against the database, and the actual query results are fed back to the LLM in a second prompt. The LLM now composes a natural-language answer grounded entirely on the retrieved rows. This two-call architecture is what distinguishes DBMS RAG from document RAG, where retrieval and grounding happen in a single step. In document RAG, the chunks you retrieve are the evidence. In DBMS RAG, the schema is retrieved first to enable query generation, and then the query results become the evidence.

This distinction has profound practical implications. Because the database engine handles aggregations, joins, and filtering, DBMS RAG produces exact numerical answers. When a user asks "What is the total quantity of all shipments?", the LLM generates `SELECT SUM(Quantity) FROM SHIPMENTS`, the database returns the precise total, and the LLM reports it. Document RAG would have to retrieve individual shipment records as text chunks, hope that all relevant chunks were found, and then rely on the LLM to add them up correctly in its head. For structured, numeric, analytical questions, DBMS RAG is simply the right tool.

## Graph RAG: Traversing Relationships with Cypher

Some data is inherently relational in a way that goes beyond what tables and foreign keys express conveniently. International trade networks, social graphs, supply chains, and organizational hierarchies are all examples where the relationships between entities are as important as the entities themselves. Graph databases model this data as nodes and edges, and query languages like Cypher allow you to express complex traversal patterns that would require deeply nested joins in SQL.

Graph RAG follows exactly the same pattern as DBMS RAG but substitutes a graph database for the relational database and Cypher queries for SQL. The system extracts the graph schema, which describes node labels, relationship types, and their properties, and provides it to the LLM as context. The LLM generates a Cypher query, the query is executed against the graph database, and the results ground the final answer. The accompanying notebook uses Kuzu, an embedded graph database, loaded with international trade data where countries are nodes and trade flows are directed edges with export values and year attributes.

The power of Graph RAG becomes apparent with multi-hop questions. A query like "Find countries in Africa that exported to both the USA and China in 2017" requires matching a pattern across multiple relationships simultaneously. In Cypher, this is a natural pattern match. In SQL, it would require multiple self-joins, subqueries, and careful filtering. Graph RAG makes these relationship-heavy questions accessible through natural language by leveraging the LLM's ability to generate appropriate graph traversal patterns.

It is worth noting that Graph RAG is not infallible. The LLM must correctly map entity names in the user's question to the identifiers stored in the graph. If the user says "USA" but the database stores "United States," the generated Cypher query may return empty results even though the data exists. The accompanying notebook demonstrates this pitfall explicitly and shows how manually correcting the query produces the expected answer. This is an important lesson: the retrieval mechanism is only as good as the LLM's understanding of the schema and data conventions.

## The Shared Pattern: Retrieve, Augment, Generate

Despite their differences in retrieval mechanism, both DBMS RAG and Graph RAG follow the same fundamental pattern that underlies all RAG systems. First, context is retrieved from an external data source. Second, that context is augmented into a prompt alongside the user's question. Third, the LLM generates an answer grounded on the retrieved evidence. The only thing that changes across RAG variants is how the retrieval step works: vector similarity for documents, SQL execution for relational data, and Cypher execution for graph data.

This modularity is what makes RAG such a flexible architecture. You are not locked into a single retrieval mechanism. In a real enterprise application, you might combine multiple RAG backends: a vector database for searching policy documents, a SQL backend for querying sales figures, and a graph database for exploring supplier relationships, all feeding context into the same LLM.

## When to Choose Which Approach

The choice between document RAG, DBMS RAG, and Graph RAG depends on the nature of your data and the types of questions you need to answer. Document RAG is the right choice when your knowledge base consists of unstructured text such as articles, reports, contracts, and manuals. It excels at finding semantically relevant passages even when the user's phrasing differs from the source text.

DBMS RAG is the right choice when your data is structured, tabular, and numeric. Questions involving aggregations, filtering, sorting, and joins over well-defined schemas are best answered by letting a database engine do what it was designed to do. The LLM's role is to translate natural language into SQL and then narrate the results.

Graph RAG is the right choice when the relationships in your data are first-class concerns. If users ask questions about paths, connections, influence, or multi-hop relationships, a graph database expresses these patterns far more naturally than relational tables. Supply chain analysis, fraud detection in transaction networks, and organizational network analysis are all strong candidates for Graph RAG.

## The Notebooks

The two notebooks that follow put these ideas into practice. The first notebook, **DBMS_RAG_SQLite**, builds a SQLite database from the classic Supplier-Parts schema, extracts schema context, generates SQL from natural-language questions, and compares grounded answers against ungrounded LLM responses. The second notebook, **GRAPH_RAG_Trade**, constructs a Kuzu graph database from international trade data, generates Cypher queries, and visualizes the retrieved subgraphs to help you verify the LLM's answers. Together, they demonstrate that RAG is a general-purpose architecture whose retrieval mechanism can be adapted to whatever data source holds the evidence your application needs.

## References

- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Kuttler, H., Lewis, M., Yih, W., Rocktaschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33.
- Rajkumar, N., Li, R., & Baber, D. (2022). Evaluating the Text-to-SQL Capabilities of Large Language Models. *arXiv preprint arXiv:2204.00498*.
- Jin, Z., Guo, R., & Shi, S. (2023). A Survey on Text-to-SQL Parsing: Concepts, Methods, and Future Directions. *arXiv preprint arXiv:2208.13629*.
- Feng, J., Chen, Z., Li, D., & Cai, J. (2023). Knowledge Graph-Augmented Language Models for Knowledge-Grounded Dialogue Generation. *arXiv preprint arXiv:2305.18846*.
- Kuzu Documentation. (2024). Kuzu: An Embeddable Property Graph Database Management System. https://kuzudb.com/
