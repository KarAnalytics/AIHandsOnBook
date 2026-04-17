# Tool-Using Agents and MCP

## Real Tools vs. LLM-Only Reasoning

Every agent discussed in previous chapters relied on the LLM to do everything: design schemas, write SQL, analyze data, and generate recommendations. The LLM performed well on these tasks because they are fundamentally language tasks, translating between natural language and structured formats. But there is an entire category of problems where LLM reasoning is the wrong tool for the job. Computing the distance between two geographic coordinates, matching a user's informal building name against a canonical list, or generating a correctly formatted URL are tasks that demand deterministic precision, not probabilistic text generation.

The accompanying notebook, `KU_Parking_Assistant`, makes this distinction concrete by building an agent that helps users find parking near any building at the University of Kansas. The agent uses three real tools implemented as plain Python functions. The first is a Haversine distance calculator that computes the great-circle distance between two latitude-longitude pairs. The second is a fuzzy building name matcher that resolves informal queries like "business school" to the canonical name "Capitol Federal Hall (Business School)" through substring matching. The third generates clickable Google Maps URLs from coordinates.

None of these tools contain an LLM. They are pure deterministic Python code that produces the same output every time for the same input. The LLM's role is to understand the user's natural-language question, decide which tools to call and in what order, and then format the tool outputs into a helpful response. This division of labor, language understanding for the LLM and precise computation for the tools, is the foundation of effective tool-using agent design.

The difference matters in practice. An LLM asked to compute the Haversine distance between two coordinates will sometimes get the math right and sometimes not, depending on the model, the prompt, and the specific numbers involved. A Python function using the standard formula will always get it right. An LLM asked to generate a Google Maps URL may hallucinate the format or transpose digits in the coordinates. A string formatting function will always produce a valid URL. By delegating deterministic tasks to tools and reserving the LLM for what it does best, understanding intent and generating natural language, the overall system becomes both more reliable and more capable than either component alone.

## The Agent Loop

The KU Parking Assistant uses a ReAct-style agent loop that works with any LLM, without requiring special function-calling APIs. The system prompt describes the available tools and instructs the LLM to output a JSON object when it wants to call one. The agent loop parses this JSON, executes the corresponding Python function, feeds the result back into the conversation as a new message, and lets the LLM decide whether to call another tool or produce a final answer. This cycle of reasoning and acting, from which the ReAct pattern derives its name, typically completes in two to three steps for a parking query: one call to find nearby parking lots, one call to get the color legend, and then a final formatted response.

## The Model Context Protocol

The inline-tools approach works well for a single notebook, but it has a fundamental limitation: the tools are trapped inside the notebook. If you want to use the same parking tools in a web application, a Dify workflow, or Claude Desktop, you would have to reimplement them in each environment. This is where the Model Context Protocol, or MCP, enters the picture.

MCP is an open standard, originally introduced by Anthropic, that defines how AI applications communicate with tool servers. It specifies a simple JSON-RPC 2.0 interface over HTTP. A client sends a request to a server, the server executes a tool, and the server returns the result. Two methods form the core of the protocol: `tools/list`, which allows a client to discover what tools a server offers along with their parameter schemas, and `tools/call`, which executes a specific tool with provided arguments.

The critical insight behind MCP is separation of concerns. The tool server is responsible for implementing and hosting the tools. The client is responsible for deciding when and how to call them. Because the interface is standardized, any MCP-compatible client can work with any MCP-compatible server without custom integration code. This is the same principle that made REST APIs transformative for web development: a standard interface enables an ecosystem of interchangeable components.

## From Inline Tools to Local MCP Server to Cloud Endpoint

The progression across the two KU Parking notebooks illustrates a natural evolution that many AI applications follow in practice.

In the first stage, tools are defined as **inline Python functions** within the notebook. The agent calls them directly as local function invocations. This is the fastest way to prototype and debug. You can set breakpoints, inspect intermediate values, and iterate on tool logic without any network overhead. The limitation is that the tools exist only within that notebook's runtime.

In the second stage, the same tools are deployed to a **cloud MCP endpoint**. The `KU_Parking_mcp` notebook demonstrates this by calling a Supabase Edge Function that implements the identical parking tools in TypeScript. From the agent's perspective, almost nothing changes. The system prompt still lists the same three tools. The agent loop still parses JSON actions and feeds results back. The only difference is that tool calls now go through an HTTP POST to the Supabase URL instead of a local function invocation. The `mcp_tool()` helper function is a thin wrapper around Python's `requests` library, roughly ten lines of code, that handles the JSON-RPC formatting.

This progression matters because it shows that the transition from prototype to production does not require rearchitecting the agent. The agent logic, the system prompt, the ReAct loop, and the output formatting all remain the same. Only the transport layer changes, from a function call to an HTTP request.

## Multi-Client Reuse

The real payoff of MCP becomes visible when multiple clients consume the same tools. The Supabase Edge Function hosting the KU Parking tools is a single HTTPS endpoint. The Python notebook calls it from Colab. A Dify workflow calls it using an HTTP Request node. Claude Desktop could call it as a configured MCP server. A custom web application could call it from JavaScript. In every case, the clients call the same `find_parking_near_building` tool, send the same parameters, and receive the same results.

This architecture means that updating data or tool logic happens in exactly one place. If a new parking lot opens on campus, you update the data in the Supabase Edge Function, redeploy with a single command, and every client sees the new lot on its next request. No notebook reruns, no Dify workflow edits, no client code changes. This is the operational advantage of treating tools as services rather than embedded code.

Tool discovery reinforces this advantage. When a client connects to an MCP server, it calls `tools/list` to learn what tools are available and what parameters each tool accepts. If you add a new tool to the server, such as a `find_parking_by_color` function, existing clients can discover it automatically without code changes. The server's tool catalog is the single source of truth for what capabilities are available.

## Connecting the Concepts

The KU Parking Assistant brings together several threads from across this book. The fuzzy building name matching is a form of retrieval, mapping an informal query to a canonical entity, that echoes the retrieval step in RAG pipelines. The Haversine distance calculation is an example of a task that should never be delegated to an LLM when a formula exists. The ReAct agent loop is the same pattern used by LangChain agents, simplified here to work with any LLM provider. And the MCP deployment pathway connects directly to the deployment chapter that follows, where the same Supabase Edge Function is integrated into production workflows.

The broader lesson is about knowing when to use an LLM and when to use a tool. Language understanding, intent classification, natural-language formatting, and open-ended reasoning are LLM tasks. Distance calculations, data lookups, URL generation, and any operation with a known correct algorithm are tool tasks. The best agents combine both, letting each component do what it does best.

## References

- Anthropic. (2024). Model Context Protocol Specification. https://modelcontextprotocol.io/
- Schick, T., Dwivedi-Yu, J., Dess\`i, R., Raileanu, R., Lomeli, M., Hambro, E., Zettlemoyer, L., Cancedda, N., & Scialom, T. (2024). Toolformer: Language Models Can Teach Themselves to Use Tools. *Advances in Neural Information Processing Systems (NeurIPS)*.
- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. *International Conference on Learning Representations (ICLR)*.
- Qin, Y., Liang, S., Ye, Y., Zhu, K., Yan, L., Lu, Y., Lin, Y., Cong, X., Tang, X., Qian, B., Zhao, S., Hong, L., Tian, R., Xie, R., Zhou, J., Gerber, M., Li, D., Liu, Z., & Sun, M. (2024). ToolLLM: Facilitating Large Language Models to Master 16000+ Real-World APIs. *International Conference on Learning Representations (ICLR)*.
- Supabase. (2024). Edge Functions Documentation. https://supabase.com/docs/guides/functions
