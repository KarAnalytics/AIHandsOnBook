# The `llm_cascade` Package

Every notebook in this book uses `llm_cascade` for automatic LLM provider fallback. Here's a quick reference.

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
