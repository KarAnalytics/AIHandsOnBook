# Tool-Using Agents and MCP

This chapter brings together tools, agents, and the **Model Context Protocol (MCP)** — the standard for exposing tools to LLMs as reusable services.

We build a KU Parking Assistant that:
- Uses **real deterministic tools** (Haversine distance, fuzzy building matching, Google Maps URLs)
- The LLM decides *when* to call which tool based on the question
- The same tools are deployed to a **Supabase Edge Function** as an MCP server
- Both a Python notebook and a Dify workflow can call the same tools

Two notebooks contrast:
- **Inline tools** — tools defined as Python functions in the notebook
- **MCP tools** — tools accessed over HTTPS from the Supabase cloud endpoint
