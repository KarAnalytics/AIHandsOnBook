# Agentic Systems

An "agent" is an LLM that can use tools — functions it calls to fetch data, run calculations, or interact with external systems. When the workload is larger than a single prompt can handle, you have two design choices. You can break the work into **specialized agents**, each with its own system prompt and a defined handoff protocol. Or you can stay with **a single agent** that holds one richer prompt and does everything itself. This chapter takes both.

The first two notebooks build a five-agent database system where every task gets its own specialist:

- **Agent 1 (Data Architect)** designs a logical schema from the uploaded Excel sheets.
- **Agent 2 (SQL Developer)** turns that schema into a SQLite database.
- **Agent 3 (SQL Query Writer)** answers user questions by generating SQL.
- **Agent 4 (RAG Analyst)** answers the same questions by reading the raw data directly.
- **Agent 5 (Evaluator)** compares the SQL and RAG answers and scores their agreement.

You will see this same five-agent workflow in two UI flavours — one that surfaces every intermediate step to the user, and one that collapses the pipeline into a single submit button.

The third notebook re-implements the workflow with a *single* agent: one LLM, one system prompt, all three data-analyst tasks (design schema, write DDL, write SQL) routed to the same model with slightly different instructions. Running it alongside the multi-agent version surfaces a design question that matters more than the usual "how many agents?" debate: *what does specialization actually buy you?* As you will see, the honest answer is "less than you might expect" — the SQL the agents write is remarkably similar whether the prompt calls the LLM a "SQL Developer" or a "Data Analyst." The real value of the multi-agent architecture in this example comes from the cross-check between SQL and RAG answers (Agent 5), not from the specialization of the SQL-writing step itself.

This reveal is deliberate. Multi-agent systems are the loud topic in agentic AI, but many real-world applications only need single-agent reasoning with tool use. Knowing which design your problem actually calls for — before you wire up six agents — is a more important skill than knowing how to wire up six agents.
