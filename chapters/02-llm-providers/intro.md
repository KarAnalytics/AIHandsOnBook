# Calling LLMs: Providers and Fallback

LLMs are accessed via APIs from providers like OpenAI, Google (Gemini), Groq, and others. Each has different models, pricing, rate limits, and capabilities.

This chapter introduces the `llm_cascade` package — a simple Python library that auto-detects your API keys and falls back to the next provider when one hits its quota. Every subsequent chapter in this book uses `llm_cascade` so you never have to worry about provider-specific code.

- **8 supported providers:** OpenAI, Gemini, Ollama, Grok (xAI), Groq, HuggingFace, Cohere, OpenRouter
- **One line of code:** `llm = get_cascade()` — that's it
- **Automatic fallback:** if Gemini returns 429, the next call goes to Groq (or whichever is next)
