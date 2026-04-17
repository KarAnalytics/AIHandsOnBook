# Multi-Agent Systems

When one agent isn't enough, you split the work across multiple specialized agents — each with its own system prompt, its own narrow expertise, and a defined handoff protocol.

This chapter builds a five-agent system that:
- **Agent 1 (Data Architect)** designs a logical schema
- **Agent 2 (SQL Developer)** creates the database
- **Agent 3 (SQL Query Writer)** answers questions via SQL
- **Agent 4 (RAG Analyst)** answers the same questions via data context
- **Agent 5 (Evaluator)** compares the two answers

The key question this chapter addresses: *when is multi-agent specialization actually worth the added complexity?*
