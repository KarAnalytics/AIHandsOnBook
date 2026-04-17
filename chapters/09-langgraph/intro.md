# LangGraph

The previous chapter demonstrated that LangChain can build powerful RAG pipelines and tool-calling agents using LCEL's pipe syntax. But LCEL has a fundamental constraint: pipes are linear. Data flows from left to right through a fixed sequence of steps, and there is no native way to express "if this condition is true, take a different path" or "repeat this section until the answer is good enough." In practice, real-world AI workflows demand exactly these patterns. A customer support system might need to route technical questions to one handler and billing questions to another. A research assistant might need to evaluate its own answer and retry with a broader search if the first attempt is insufficient. LangGraph was created to handle these scenarios. It extends LangChain with stateful, directed graphs where each processing step is a node, each connection is an edge, and the data flowing between them is an explicit, inspectable state object.

## Why Graphs Matter

A linear chain is a special case of a graph: it is a graph with no branches and no loops. LangGraph generalizes this by allowing conditional edges that route execution to different nodes based on runtime data, and back-edges that loop execution to a previous node. This seemingly simple extension opens up an entirely new class of applications. You can build pipelines that classify incoming requests and dispatch them to specialized handlers. You can build quality-control loops where the system evaluates its own output and retries if it falls short. You can build multi-agent systems where different AI personas take turns contributing to a shared state. None of these patterns can be cleanly expressed as a linear pipe, but all of them are natural as graphs.

## State Management with TypedDict

The central concept in LangGraph is the state, a Python `TypedDict` that defines every piece of data flowing through the graph. Unlike LangChain chains, where intermediate values are passed implicitly between steps, LangGraph requires you to declare your state schema upfront. A simple RAG state might contain fields for the question, the retrieved context, and the generated answer. A more complex retry state adds fields for the attempt count and a boolean flag indicating whether the answer was sufficient.

This explicitness is a feature, not a limitation. When you inspect a node's output, you see the complete state at that point in the pipeline. There is no hidden data, no implicit variables carried along inside the framework. Every field that matters is named and typed in the `TypedDict`, making the pipeline self-documenting and easy to debug. If a node produces an unexpected result, you can examine exactly what state it received and what state it returned.

## Three Graph Patterns

The accompanying notebook demonstrates three increasingly powerful graph patterns, each building on the one before.

The first pattern is a linear RAG graph. It contains two nodes, `retrieve` and `generate`, connected by a simple edge. The retrieve node takes the user's question, searches the vector store, and writes the retrieved context into the state. The generate node reads the question and context from the state, sends them to the LLM, and writes the answer back into the state. The flow is `START` to `retrieve` to `generate` to `END`. This is functionally identical to a LangChain LCEL chain, but the graph representation gives you something chains do not: you can visualize the pipeline as a diagram and trace the state at every node.

The second pattern introduces conditional routing. A `classify` node uses the LLM to categorize the user's question (product inquiry, financial analysis, security concern, or general question), and a conditional edge routes execution to the appropriate specialized handler. Each handler uses a tailored system prompt to produce a more focused answer. At runtime, only one branch executes. This pattern is invaluable for enterprise applications where different question types require different expertise, retrieval strategies, or even different LLMs.

The third pattern demonstrates a retry loop. After retrieval and generation, an `evaluate` node asks the LLM whether the answer adequately addresses the question. If the answer is deemed insufficient and the maximum number of retries has not been reached, a conditional edge loops execution back to the `retrieve` node, which broadens its search query on the retry attempt. If the answer is sufficient, or if three attempts have been exhausted, the graph exits to `END`. This loop structure is impossible in a linear chain. It is the kind of pattern that production RAG systems use to ensure answer quality without human intervention, and it illustrates why graphs are a fundamentally more expressive abstraction than pipes.

## Graph Visualization

LangGraph includes built-in support for rendering compiled graphs as visual diagrams using `draw_mermaid_png()`. The linear RAG graph appears as a simple three-node flow. The routing graph shows the conditional edge fanning out from the classify node to four specialized handlers. The retry graph reveals the critical back-edge from `evaluate` to `retrieve`, the visual signature of a loop. These diagrams are not just documentation aids. They serve as executable specifications: the picture and the code are the same thing. When you add a node or change an edge, the diagram updates automatically because it is generated from the compiled graph object.

## State Tracing with .stream()

LangGraph's `.stream()` method lets you observe state evolution in real time. Instead of receiving only the final answer, you see a dictionary update for each node as it executes. For the linear RAG graph, you see the retrieve node populate the context field and then the generate node populate the answer field. For the routing graph, you see the classify node set the category field and then the selected handler produce the answer. For the retry graph, you can watch the attempts counter increment and the is_sufficient flag flip from false to true as the loop converges on a satisfactory answer. This node-by-node visibility is the key advantage of LangGraph for debugging and for building trust in complex AI pipelines. When a stakeholder asks "how did the system arrive at this answer?", you can show them exactly which nodes executed, in what order, and what data each one contributed.

## When to Use LangGraph vs. Plain LangChain

For straightforward, linear pipelines like a basic RAG chain or a single-step LLM call, plain LangChain with LCEL is simpler and more than sufficient. LangGraph adds value when your workflow requires conditional branching, when you need loops or retry logic, when you want explicit state management for debugging and auditing, or when you are building multi-step agent systems where visibility into each step matters. As a rule of thumb, if your pipeline can be drawn as a straight line, use LangChain. If it needs to branch or loop, use LangGraph.

## The Hands-On Notebook

The notebook that follows implements all three graph patterns using the same fictional company documents from the LlamaIndex and LangChain chapters. You will define state schemas with `TypedDict`, build graphs with `StateGraph`, add conditional edges for routing and looping, visualize each graph with `draw_mermaid_png()`, and trace state evolution with `.stream()`. By the end, you will have a concrete understanding of how graph-based orchestration extends the capabilities of linear chains and when that extension is worth the additional complexity.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- LangGraph extends LangChain by replacing linear pipes with directed graphs that support conditional branching and loops, enabling workflows that classify-and-route or retry-until-sufficient.
- Explicit state management via `TypedDict` makes every piece of data flowing through the graph named, typed, and inspectable at each node, eliminating hidden state.
- The `.stream()` method provides node-by-node state tracing, giving full visibility into how the system arrived at its answer --- critical for debugging and stakeholder trust.
:::

## Exercises

**Easy:** Build a two-node linear RAG graph (retrieve then generate) using `StateGraph` and `TypedDict`. Visualize it with `draw_mermaid_png()` and trace the state updates with `.stream()`.

**Medium:** Add a `classify` node and conditional edges to route questions to at least three specialized handler nodes based on question category. Test with questions from different categories and verify that the correct branch executes.

**Challenge:** Implement a retry loop where an `evaluate` node judges answer quality and conditionally loops back to `retrieve` with a broadened query. Cap the loop at three attempts and use `.stream()` to observe the attempts counter incrementing across iterations.

For learning how to modify model weights directly instead of relying on retrieval at inference time, see **Ch 13 Fine-Tuning**.

## References

1. LangGraph Documentation. "Introduction to LangGraph." LangChain, 2025. [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)

2. LangChain Documentation. "LangGraph: Multi-Actor Applications with LLMs." LangChain, 2025. [https://python.langchain.com/docs/langgraph/](https://python.langchain.com/docs/langgraph/)

3. Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). "ReAct: Synergizing Reasoning and Acting in Language Models." *International Conference on Learning Representations (ICLR)*. [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)

4. Besta, M., Blach, N., Kubicek, A., Gerstenberger, R., Podstawski, M., Gianinazzi, L., Gajber, J., Lehmann, T., Niewiadomski, H., Nyczyk, P., & Hoefler, T. (2024). "Graph of Thoughts: Solving Elaborate Problems with Large Language Models." *Proceedings of AAAI 2024*. [https://arxiv.org/abs/2308.09687](https://arxiv.org/abs/2308.09687)

5. Chase, H. "LangGraph: Build Stateful, Multi-Actor Applications." GitHub, 2025. [https://github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
