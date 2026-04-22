# The `llm_cascade` Package

Every notebook in this book uses `llm_cascade` for automatic LLM provider fallback. Here's a quick reference.

```{figure} images/llm_cascade_flow.svg
:alt: Diagram showing five provider boxes connected left-to-right by arrows; each arrow is labelled "503 / quota", indicating that a failure from the current provider falls through to the next.
:width: 90%
:label: fig-llm-cascade-flow
:align: center

How `llm_cascade` cascades through providers: the first to succeed returns the response; a `503`, `429`, or quota-exceeded error on one provider falls through to the next. The cascade tries all 8 providers in order; only the first five are shown here.
```

As shown in [](#fig-llm-cascade-flow), your notebook call never has to know which provider ultimately served the response — `response.provider` tells you after the fact.

## Install

```bash
pip install git+https://github.com/KarAnalytics/llm_cascade.git
```

## Quick start

```python
from llm_cascade import get_cascade

llm = get_cascade()                          # auto-detects your API keys
response = llm.generate("What is Python?")   # falls back if one provider is down
print(response.text)                         # the answer
print(response.provider)                     # which provider answered (e.g., "Gemini")
print(response.model)                        # which model was used
```

## Supported providers

| Provider | Env Variable | Free Tier |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | Limited free credits |
| Gemini | `GEMINI_API_KEY` | 500 req/day |
| Ollama Cloud | `OLLAMA_API_KEY` | Free tier |
| Grok (xAI) | `XAI_API_KEY` | $25/month free |
| Groq | `GROQ_API_KEY` | 30 req/min |
| HuggingFace | `HF_TOKEN` | Free inference |
| Cohere | `COHERE_API_KEY` | 20 req/min |
| OpenRouter | `OPENROUTER_API_KEY` | Free models |

Set any key in your `.env` file or Colab Secrets. The cascade tries them in order and falls back automatically on quota errors, auth failures, or server outages.

## Override models per notebook

```python
llm = get_cascade(models={"Gemini": "gemini-2.5-pro", "OpenAI": "gpt-4o"})
# or after creation:
llm.set_model("Gemini", "gemini-2.5-pro")
```

## Embeddings (local, no API key needed)

```python
embedding = llm.get_embedding("some text")  # uses all-MiniLM-L6-v2 locally
```

Source: [github.com/KarAnalytics/llm_cascade](https://github.com/KarAnalytics/llm_cascade)
