# Autonomous Agents

Previous chapters used agents with predefined workflows — humans decided the pipeline, agents just filled the roles. An **autonomous agent** takes a high-level goal and figures out the steps itself.

This chapter builds a Business Idea Validator that autonomously:
- **Plans** its own research questions
- **Executes** each question with accumulated context
- **Synthesizes** findings into a recommendation
- **Self-critiques** with a confidence score

No human tells it what questions to ask — the LLM decides the entire workflow from a one-sentence goal.
