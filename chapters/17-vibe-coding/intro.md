# Vibe Coding

In February 2025, Andrej Karpathy — co-founder of OpenAI and one of the most influential voices in AI — introduced a term that would quickly enter the mainstream vocabulary of software development: **vibe coding**. "There's a new kind of coding I call 'vibe coding,'" he wrote, "where you fully give in to the vibes, embrace exponentials, and forget that the code even exists." The idea was provocative and deliberately so: instead of writing code line by line, you describe what you want in natural language and let an AI agent write, debug, and iterate on the code for you. You become the director; the AI becomes the programmer.

What began as a half-serious provocation has, by 2026, become a legitimate and widely adopted development practice. The tools have matured rapidly, the models have become remarkably capable at understanding intent and generating correct code, and a growing number of applications — from internal business tools to customer-facing products — have been built primarily or entirely through vibe coding. This chapter surveys the landscape, explains the workflow, examines the tools, and offers practical guidance for business professionals who want to build AI-powered applications without becoming software engineers.

## What Vibe Coding Actually Means

Vibe coding is the practice of building software by describing your intent in natural language and letting an AI coding agent translate that intent into working code. You do not write Python functions, HTML templates, or SQL queries. Instead, you say things like "create a web form that takes a company name and returns the top five competitors from our database" or "build a Gradio interface for uploading Excel files and running SQL queries against them." The AI agent generates the code, creates the files, installs dependencies, runs tests, and reports back. You review the output, point out problems, and iterate.

This is fundamentally different from using an LLM as a code autocomplete tool (though that is related). Autocomplete suggests the next line while you are actively writing code. Vibe coding delegates the entire implementation to the AI while you focus on intent, architecture, and quality review. The cognitive shift is significant: instead of thinking in syntax, you think in specifications.

The instructor's experience from classroom sessions captures both the promise and the reality: "Vibe coding is easy, but it is very error-prone. If you know what the Python code is, knowing how to prototype, knowing how to debug a little bit — that's the secret to successful vibe coding." The skill is not writing code from scratch; the skill is describing what you want clearly enough for the AI to get it right, and knowing enough about code to recognize when it gets it wrong.

## The Major Vibe Coding Tools

The vibe coding ecosystem in 2026 is competitive and fast-moving. Several tools have emerged as leaders, each with a different philosophy and target audience.

**Claude Code** is a terminal-based AI agent from Anthropic that reads your entire codebase, writes code, runs commands, creates files, and edits multiple files simultaneously. It excels at large-scale refactoring and architectural work — handling codebases of 50,000 or more lines of code with a roughly 75 percent success rate on complex multi-file tasks. Claude Code runs alongside your editor, not inside it, communicating via the command line. It is available through Claude Pro at approximately twenty dollars per month. Much of this book — the notebooks, the `llm_cascade` package, the MCP servers, and the book's own build system — was developed with Claude Code.

**Cursor** is an AI-native IDE built as a fork of Visual Studio Code. It offers deep repository awareness, Composer mode for multi-file edits, and project-specific instruction files (`.cursorrules`) that tell the AI how your project is structured. Cursor has the most polished user experience and the largest community among AI coding tools, with user ratings consistently around 4.9 out of 5. A free tier is available; the Pro plan costs approximately twenty dollars per month.

**GitHub Copilot** operates inside Visual Studio Code as an extension and is the most widely adopted AI coding assistant. Its strength is accessibility: if you already use VS Code (which most developers do), Copilot integrates seamlessly. It offers inline code completion, chat, and — as of 2025 — an Agent Mode for multi-file autonomous edits. Critically, Copilot is **free for students and educators** through GitHub Education, making it the natural starting point for classroom use. As the instructor notes: "The Copilot is free for students and instructors, so I got the free version for the education version, and I use it."

**Windsurf**, originally built by Codeium and later acquired by OpenAI, is an AI-enhanced IDE centered around an autonomous agent called Cascade. Rather than waiting for explicit prompts, Cascade proactively gathers context from your project and executes multi-step tasks with minimal guidance. Its free tier is generous, making it a strong option for budget-conscious students and startups.

**Antigravity** is Google's AI coding agent, available as a VS Code extension powered by Gemini models. The combination of Antigravity with Gemini Pro offers a capable vibe coding setup at no cost. The instructor has used this extensively: "You can use Antigravity with a Gemini Pro. That is a pretty powerful combination." Several of the notebooks in this book were initially developed using Antigravity.

**OpenAI Codex** is OpenAI's cloud-based coding agent, accessible from the ChatGPT interface or via API. It runs in a sandboxed environment where it can write code, execute it, run tests, and iterate — all without requiring a local development setup. This makes it particularly accessible for non-developers who want to build simple tools or automate tasks.

## The Vibe Coding Workflow

A typical vibe coding session follows a conversational pattern. You begin with a clear description of what you want to build. The AI generates an initial implementation. You review the output — does it run? Does it do what you intended? You provide feedback, point out errors, or ask for modifications. The AI revises. You test again. This cycle repeats until the result meets your standards.

The workflow is iterative by nature. As observed in classroom sessions: "It is iterative. The secret to successful vibe coding is knowing how to prototype, knowing how to debug a little bit." First attempts are rarely perfect, but each iteration gets closer. The key skill is not coding ability but **specificity of communication** — the more precisely you describe what you want, the more accurately the AI delivers.

A practical example: this book's entire `llm_cascade` package started as a conversational description ("I want a Python package that auto-detects API keys for eight LLM providers and falls back to the next one when quota is hit"). Over multiple iterations, the agent generated the provider list, the fallback logic, the embedding support, the `setup.py`, and the README. The human guided architecture decisions and tested edge cases; the AI wrote the code.

## The 90/10 Problem

Vibe coding has a well-known failure mode that practitioners call the 90/10 problem: the AI gets you 90 percent of the way in 10 percent of the time, but the remaining 10 percent — debugging edge cases, handling errors gracefully, integrating with existing systems — takes 90 percent of the effort. The initial generation is fast and impressive. The polish is where the real work happens.

This is why the instructor's advice is critical: you need to understand enough about code to recognize when the AI has made a mistake. You do not need to be able to write the code from scratch, but you do need to be able to read it, understand its intent, and identify when something is wrong. For business professionals, this means investing time in understanding the basics of Python, SQL, and web development — not to become programmers, but to become effective AI directors.

## Implications for Business Professionals

Vibe coding represents one of the most significant shifts in the relationship between business professionals and technology. Historically, building a software tool required either programming skills or the budget to hire a developer. Vibe coding lowers this barrier dramatically. An MBA student who can describe a business problem clearly can now prototype a working solution in hours, not weeks.

This does not eliminate the need for professional software engineers — production systems still require security auditing, performance optimization, scalability testing, and maintenance that go well beyond what vibe coding produces. But it does mean that the distance between "I have an idea" and "I have a working prototype" has collapsed to nearly zero. For product managers, consultants, entrepreneurs, and analysts, this is transformative.

Every notebook in this book was built using vibe coding tools. The fact that you are reading a functional, deployed, multi-chapter interactive textbook with 30+ runnable notebooks, a cloud-hosted MCP server, and a Supabase Edge Function — all created through conversational AI interactions — is itself a demonstration of what vibe coding makes possible.

For a related approach, see [RAG from First Principles](../03-rag-first-principles/intro.md).

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- Vibe coding delegates entire implementation tasks to an AI agent while you focus on intent, architecture, and quality review — it is fundamentally different from code autocomplete.
- The major tools (Claude Code, Cursor, GitHub Copilot, Windsurf, Antigravity, OpenAI Codex) each target different workflows: terminal-based agents, AI-native IDEs, editor extensions, and cloud sandboxes.
- The 90/10 problem is vibe coding's central challenge: the AI gets you 90% of the way in 10% of the time, but debugging, edge cases, and integration consume the remaining effort.
- Effective vibe coding requires specificity of communication — the more precisely you describe what you want, the more accurately the AI delivers — plus enough code literacy to recognize errors.
- Vibe coding collapses the distance between "I have an idea" and "I have a working prototype" to nearly zero, making it transformative for product managers, consultants, and analysts who are not full-time programmers.
:::

## Exercises

**Easy:** Choose one vibe coding tool (GitHub Copilot, Cursor, or Antigravity) and use it to generate a Python function that takes a list of product names and prices and returns the three most expensive items. Evaluate whether the output is correct on the first attempt.

**Easy:** Describe the 90/10 problem in your own words. Give a concrete example of a "last 10%" issue that an AI-generated prototype might have that would prevent it from being production-ready.

**Medium:** Using a vibe coding tool, build a simple Gradio interface that accepts a CSV file upload and displays basic summary statistics (mean, median, min, max for each numeric column). Document the number of iteration cycles required and the specific corrections you had to request.

**Challenge:** Use a vibe coding tool to build a multi-page Streamlit dashboard that connects to a SQLite database, displays interactive charts, and includes a natural-language query input that generates SQL. Track the full session: record each prompt you gave, each error the AI produced, and each correction cycle. Write a one-page retrospective analyzing where the AI excelled and where it struggled.

## References

- Karpathy, A. (2025). *Vibe coding* [Social media post]. https://x.com/karpathy/status/1886192184808149383
- Nucamp. (2026). Top 10 Vibe Coding Tools in 2026. https://www.nucamp.co/blog/top-10-vibe-coding-tools-in-2026-cursor-copilot-claude-code-more
- Appwrite. (2026). Comparing the best vibe coding tools: Cursor, Claude Code, Windsurf, VS Code, Lovable and Bolt. https://appwrite.io/blog/post/comparing-vibe-coding-tools
- Lushbinary. (2026). AI Coding Agents 2026: Claude Code vs Antigravity vs Codex vs Cursor vs Kiro vs Copilot vs Windsurf. https://lushbinary.com/blog/ai-coding-agents-comparison-cursor-windsurf-claude-copilot-kiro-2026/
- GitHub. (2026). *GitHub Copilot Documentation*. https://docs.github.com/en/copilot
- Anthropic. (2026). *Claude Code Documentation*. https://docs.anthropic.com/en/docs/claude-code
