# LangGraph

LangGraph extends LangChain with **stateful graphs** — pipelines where each step is a visible node connected by edges, and the state flows explicitly between them. This chapter demonstrates three increasingly complex graph patterns:

- **Linear RAG** — `retrieve → generate → END` (same as a LangChain chain, but with visible state)
- **Conditional routing** — a classifier node routes questions to specialized handlers via conditional edges
- **Retry loop** — the graph evaluates its own answer and loops back to retry if insufficient

Each pattern includes a graph visualization and a state trace showing how data flows through the nodes.
