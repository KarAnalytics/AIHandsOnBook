# Deployment and No-Code

## From Notebooks to Production

Every application built in this book so far has lived inside a Jupyter notebook running on Google Colab. Notebooks are ideal for learning, experimentation, and rapid prototyping. They let you see intermediate outputs, inspect variables, and iterate on prompts in real time. But a notebook is not a production system. It requires a human to open it, run cells in order, and keep the runtime alive. It cannot serve multiple users simultaneously, it does not persist across sessions, and it offers no guarantees about availability or performance.

Taking AI from notebooks to production means answering two questions. First, how do you make your tools and data accessible to any application, not just the notebook where you developed them? Second, how do you build end-user applications that non-technical stakeholders can use and maintain without writing code? This chapter addresses both questions through two complementary approaches: deploying tools as serverless MCP endpoints on Supabase Edge Functions, and building complete AI workflows visually using the Dify platform.

## MCP Servers on Supabase Edge Functions

The previous chapter introduced the Model Context Protocol as a standard for tool interoperability. This chapter shows how to deploy an MCP server to a real cloud environment so that it becomes a permanent, publicly accessible service.

Supabase Edge Functions are serverless TypeScript functions that run on Deno at the edge, close to your users, with no infrastructure to manage. You write a TypeScript file that handles incoming HTTP requests, deploy it with a single command, and Supabase gives you a public HTTPS URL. There are no servers to provision, no containers to build, and no scaling decisions to make. The function spins up when a request arrives and shuts down when it finishes.

The KU Parking MCP server, deployed as a Supabase Edge Function, implements the JSON-RPC 2.0 protocol that MCP requires. When a client sends a POST request with the method `tools/list`, the function returns a catalog of available tools and their parameter schemas. When a client sends `tools/call` with a tool name and arguments, the function executes the tool and returns the result. The parking data, the Haversine distance formula, the fuzzy building matcher, and the Google Maps URL generator all live inside this single Edge Function, written in TypeScript and deployed to the cloud.

The deployment workflow is straightforward. You initialize a Supabase project, write the Edge Function in the `supabase/functions/` directory, and deploy with `supabase functions deploy`. The `--no-verify-jwt` flag makes the endpoint publicly accessible without authentication, which is appropriate for a classroom demo but would be replaced with proper authentication in a production setting. Once deployed, the function is available at a permanent URL that any HTTP client can call.

This architecture offers a clean separation between tool development and tool consumption. The team that maintains the parking data and distance logic works on the Edge Function. The teams that build user-facing applications, whether notebooks, web apps, or no-code workflows, simply call the endpoint. Changes to tool logic or data propagate automatically to all consumers on their next request.

## No-Code Workflows with Dify

Dify is a visual platform for building LLM-powered applications without writing code. It provides a drag-and-drop workflow builder where each node represents a processing step: an LLM call, a knowledge base retrieval, an HTTP request, a code transformation, or a conditional branch. Nodes are connected by edges that define data flow, and the entire workflow can be published as a web application, an API, or a chatbot with a single click.

Two capabilities of Dify are particularly relevant to this book's themes. First, **Knowledge Bases** provide document RAG without any code. You upload documents such as PDFs, markdown files, or text files. Dify automatically chunks them, generates vector embeddings, and indexes them for retrieval. A Knowledge Retrieval node in a workflow performs semantic search over these documents and passes the relevant chunks to an LLM node for answer generation. This replicates the RAG pipeline built from scratch in earlier chapters, but the entire process is configured through a visual interface rather than Python code.

Second, **HTTP Request nodes** enable Dify workflows to call external APIs, including MCP endpoints. To connect Dify to the KU Parking MCP server, you add an HTTP Request node that sends a JSON-RPC POST to the Supabase URL, follow it with a Code node that extracts the tool result from the JSON-RPC response, and then pass the extracted text to an LLM node for formatting. The result is a no-code parking assistant that calls the same MCP tools used by the Python notebook, producing identical results through a completely different delivery mechanism.

For Dify instances with the MCP plugin installed, the integration is even simpler. The plugin connects directly to the MCP server, discovers its tools automatically via `tools/list`, and exposes them as native Dify tool nodes that you can drag onto the canvas. The HTTP Request and Code node dance is eliminated entirely, and the workflow reduces to a start node, a tool node, an LLM formatting node, and an end node.

## When to Build Code vs. When to Use No-Code

The choice between writing code and using a no-code platform is not about technical capability but about organizational fit. Code-based approaches offer maximum flexibility, full control over every detail of the pipeline, and the ability to implement custom logic that no visual builder supports. They are the right choice when the application requires complex conditional logic, custom model fine-tuning, or integration with proprietary systems that lack standard APIs.

No-code platforms like Dify excel when the goal is rapid deployment, when the primary users of the application are business analysts or domain experts rather than engineers, and when the workflow follows a standard pattern of retrieval, generation, and formatting. They dramatically reduce the time from idea to deployed application, often from days to hours. They also lower the maintenance burden by providing visual debugging, built-in logging, and one-click publishing.

In practice, many production AI systems use both approaches. The computationally intensive or logic-heavy components, such as distance calculations, data transformations, or custom model inference, are implemented in code and deployed as API endpoints or MCP servers. The orchestration layer that ties these components together and presents them to end users is built in a no-code platform. This hybrid architecture gives you the precision of code where it matters and the speed of visual building where it does not.

The sub-chapters that follow provide step-by-step instructions for both deployment paths: setting up the Supabase Edge Function as an MCP server and building the corresponding Dify workflows that consume it.

## References

- Anthropic. (2024). Model Context Protocol Specification. https://modelcontextprotocol.io/
- Supabase. (2024). Edge Functions Documentation. https://supabase.com/docs/guides/functions
- Dify.AI. (2024). Dify Platform Documentation. https://docs.dify.ai/
- Deno. (2024). Deno Runtime Documentation. https://deno.land/
- Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J., Wang, M., & Wang, H. (2024). Retrieval-Augmented Generation for Large Language Models: A Survey. *arXiv preprint arXiv:2312.10997*.
