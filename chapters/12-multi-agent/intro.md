# Multi-Agent Systems

## Why Split Work Across Multiple Agents?

The previous chapter demonstrated that a single well-prompted agent can handle an entire workflow from schema design to SQL query generation. So why would anyone introduce the complexity of multiple agents? The answer lies not in the individual tasks but in the spaces between them: the handoffs, the cross-checks, and the distinct cognitive demands that different stages of a workflow impose.

A multi-agent system assigns each agent a narrow, well-defined role with its own system prompt optimized for that specific task. The Data Architect thinks only about table relationships and key constraints. The SQL Developer thinks only about translating logical schemas into valid DDL. The SQL Query Writer thinks only about crafting precise SELECT statements. By constraining each agent's scope, you reduce the chance that a broad, unfocused prompt leads to mediocre performance across the board. More importantly, you gain the ability to evaluate, debug, and improve each stage independently.

The real power of multi-agent architectures, however, comes not from task specialization alone but from the ability to approach the same problem from multiple angles and compare the results. When two independent agents answer the same question using fundamentally different methods, their agreement or disagreement becomes a powerful signal about answer quality.

## The Five-Agent Architecture

The accompanying notebook, `MultiAgent_DB`, implements a five-agent system that turns an uploaded Excel spreadsheet into a queryable database and then answers business questions through two independent pathways.

**Agent 1, the Data Architect**, reads the Excel sheets, examines column names and data types, and proposes a logical database schema in plain English. This agent outputs a bulleted description of tables, primary keys, and foreign key relationships. It writes no SQL; its job is purely analytical. The logical schema it produces becomes the shared plan that downstream agents depend on.

**Agent 2, the SQL Developer**, takes the logical schema from Agent 1 and translates it into executable SQL DDL statements. It creates a fresh SQLite database, runs the CREATE TABLE statements, and populates the tables from the original Excel data using pandas. After this agent completes, the system has a working database ready for queries.

**Agent 3, the SQL Query Writer**, receives a natural-language business question along with the logical schema and generates a SQL SELECT statement to answer it. The query is executed against the database, and the structured result rows are returned. This pathway is precise, verifiable, and excels at numeric aggregations and multi-table joins.

**Agent 4, the RAG Analyst**, answers the same business question using a completely different approach. Instead of writing SQL, it receives the raw data from the first twenty rows of each table as plain-text context and generates a natural-language answer directly. This pathway is more flexible and handles fuzzy or open-ended questions better, but it is limited by the context window and tends to be less precise with numeric calculations.

**Agent 5, the Evaluator**, receives both answers and produces a similarity score from zero to one hundred percent. When the score is high, both approaches arrived at the same conclusion, and you can be confident in the result. When the score is low, the system flags a disagreement that warrants human investigation. This agent closes the loop by turning a multi-agent workflow into a self-auditing system.

## Agent Handoff Protocols

In a multi-agent system, the protocol for passing information between agents is as important as the agents themselves. In the `MultiAgent_DB` notebook, handoffs are simple and explicit: each agent's output is a text string that becomes part of the next agent's input prompt. Agent 1 produces a logical schema as text. That text is injected verbatim into Agent 2's prompt. Agent 2 produces DDL, which is executed to create the database. Agents 3 and 4 both receive the logical schema and the user's question. Agent 5 receives the outputs of Agents 3 and 4.

This text-based handoff protocol has the virtue of transparency. At every stage, you can inspect exactly what one agent passed to the next. There is no hidden state, no shared memory, and no complex message bus. For production systems with more agents or more complex routing, frameworks like LangGraph provide formal state management and conditional edges, but for a five-agent linear pipeline, explicit text handoffs are both sufficient and easier to debug.

## When Specialization Pays Off

Multi-agent specialization delivers genuine value in several scenarios. First, when the workflow includes fundamentally different cognitive tasks, such as analytical schema design versus precise SQL generation versus natural-language synthesis, dedicated prompts tuned for each task can outperform a single generalist prompt. Second, when the workflow is complex enough that debugging a monolithic agent becomes impractical, decomposing the system into agents with clear boundaries makes each component independently testable. Third, and most importantly, when you need cross-validation between independent approaches, as Agents 3, 4, and 5 demonstrate.

## When Specialization Adds Unnecessary Complexity

The comparison table in the `SingleAgent_DB` notebook makes the tradeoffs concrete. The single-agent approach requires one LLM call per business query; the multi-agent approach requires three (SQL, RAG, and evaluation). The single agent is roughly three times faster and three times cheaper per query. For straightforward questions where the SQL is likely to be correct, the additional agents add latency and cost without changing the answer.

The multi-agent architecture adds value mainly through the cross-checking mechanism of Agent 5, not through the specialization of the SQL-writing step. In practice, the same underlying LLM writes similar SQL whether you label it "SQL Developer Agent" or "Data Analyst Agent." The specialized system prompt may help at the margins, but the dominant factor is the quality of the underlying model. This is an important lesson for practitioners: do not build five agents because a framework encourages it. Build one agent, find the failure modes, and add agents specifically to address them.

## The LLM-as-a-Judge Pattern

Agent 5 exemplifies a pattern that has become increasingly important in production AI systems: using one LLM to evaluate the outputs of other LLMs. The Evaluator receives two answers to the same question and returns a quantitative similarity score. This is a form of automated quality assurance that scales with usage. Every query gets evaluated, not just the ones a human happens to review.

The LLM-as-a-judge pattern is not limited to comparing two answers. It can be used to assess factual accuracy against a reference, to score the helpfulness or safety of a response, or to decide whether a generated SQL query is likely to be correct before executing it. In all these cases, the key insight is the same: a second LLM call that evaluates the first is often cheaper than the cost of serving a wrong answer to a user. The pattern appears again in autonomous agents, where a self-critique phase serves a similar quality-assurance function.

## References

- Wu, Q., Bansal, G., Zhang, J., Wu, Y., Li, B., Zhu, E., Jiang, L., Zhang, X., Zhang, S., Liu, J., Awadallah, A. H., White, R. W., Burger, D., & Wang, C. (2023). AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation. *arXiv preprint arXiv:2308.08155*.
- Zhuge, M., Liu, H., Faccio, F., Ashley, D. R., Csord\'as, R., Gober, A., Ding, W., Horv\'ath, B., & Schmidhuber, J. (2024). Agent-as-a-Judge: Evaluate Agents with Agents. *arXiv preprint arXiv:2410.10934*.
- Zheng, L., Chiang, W., Sheng, Y., Zhuang, S., Wu, Z., Zhuang, Y., Lin, Z., Li, Z., Li, D., Xing, E. P., Zhang, H., Gonzalez, J. E., & Stoica, I. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. *Advances in Neural Information Processing Systems (NeurIPS)*.
- Hong, S., Zhuge, M., Chen, J., Zheng, X., Cheng, Y., Zhang, C., Wang, J., Wang, Z., Yau, S. K. S., Lin, Z., Zhou, L., Ran, C., Xiao, L., Wu, C., & Schmidhuber, J. (2024). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. *International Conference on Learning Representations (ICLR)*.
