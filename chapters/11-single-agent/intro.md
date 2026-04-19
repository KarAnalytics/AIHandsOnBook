# Single-Agent Systems

An "agent" is an LLM that can use tools — functions it calls to fetch data, run calculations, or interact with external systems. The simplest agent is a single LLM with a single system prompt that handles the entire workflow.

This chapter builds a single-agent database assistant: upload an Excel file, the agent designs a schema, creates a SQLite database, and answers business questions via SQL. One agent, multiple tasks, one system prompt.
