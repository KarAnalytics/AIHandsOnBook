# Setting Up API Keys

Most notebooks in this book call a large language model, and to do that you need at least one API key. The `llm_cascade` package looks for keys for eight providers and falls back automatically if the first one is rate-limited or returns an error — so configuring **any one** of them is enough to get every text notebook working, and configuring two or three gives you comfortable headroom when one hits a daily quota mid-class.

You do not need a credit card for any of the free-tier options. The table below lists the providers the book supports, with signup links and the environment variable names `llm_cascade` looks for:

| Provider | Environment variable | Signup | Tier |
|---|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Free — generous; handles text, images, and video |
| Groq | `GROQ_API_KEY` | https://console.groq.com | Free — very fast inference, with rate limits |
| OpenRouter | `OPENROUTER_API_KEY` | https://openrouter.ai/keys | Free-tier models available (identified by a `:free` suffix) |
| Hugging Face | `HF_TOKEN` | https://huggingface.co/settings/tokens | Free — serverless inference via the HF router |
| Ollama Cloud | `OLLAMA_API_KEY` | https://ollama.com/cloud | Free credits for cloud-hosted open-weight models |
| Cohere | `COHERE_API_KEY` | https://dashboard.cohere.com/api-keys | Free trial tier usable for class-scale experiments |
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Paid (prepaid balance) — not required for this book |
| xAI (Grok) | `XAI_API_KEY` | https://console.x.ai/ | Paid (prepaid balance) — not required for this book |

If you are new to this and want a single recommendation: **start with Gemini**. It is the easiest to sign up for, has the most generous free tier, and is the only provider in the cascade that handles video natively (used by the Image RAG and Video RAG notebooks in Chapter 11). Adding Groq as a second key gives you a fast fallback when Gemini hits its daily quota.

## Storing keys in Colab

If you are running notebooks in Google Colab — the recommended path for most readers — use Colab's built-in **Secrets** panel so your keys are never pasted into the notebook itself:

1. Click the key icon in the left sidebar of a Colab notebook.
2. Click **Add new secret**.
3. Name the secret exactly as it appears in the *Environment variable* column above (for example, `GEMINI_API_KEY`).
4. Paste your key into the value field.
5. Toggle **Notebook access** on for each secret the current notebook should read.

The `llm_cascade` package auto-detects Colab secrets at runtime, so no code changes are needed once you have added them. Secrets persist across Colab sessions and are scoped to your Google account.

## Storing keys locally

If you are running notebooks locally in VS Code or JupyterLab, create a plain-text file named `.env` in the project root with one line per key:

```
GEMINI_API_KEY=paste_your_actual_key_here
GROQ_API_KEY=paste_your_actual_key_here
```

`llm_cascade` looks for `.env` in the current working directory and one level up, loading the keys into environment variables at import time. **Never commit `.env` to a public repository** — add it to your `.gitignore` before the first commit if you are starting a new project.
