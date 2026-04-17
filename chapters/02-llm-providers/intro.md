# Calling LLMs: Providers and Fallback

Large language models are not monolithic. They are offered by a growing number of providers, each with its own models, pricing tiers, rate limits, and areas of strength. Understanding this landscape is essential for any business professional who wants to build reliable AI-powered applications rather than fragile prototypes that break the moment a single API goes down.

## The Provider Landscape

The most recognizable name in the space is OpenAI, whose GPT family of models set the standard for conversational AI and general-purpose text generation. OpenAI offers powerful models such as GPT-4o through a pay-per-token API, making it straightforward to integrate into applications but potentially expensive at scale. Google's Gemini platform represents a strong alternative, with models that excel at multimodal tasks involving text, images, and code. For students and early-stage projects, Gemini is particularly attractive because it offers a generous free tier of 500 requests per day, enough for coursework and experimentation without spending a dollar.

Beyond these two commercial giants, a vibrant ecosystem of open-source and inference-optimized providers has emerged. Groq provides lightning-fast inference on open-source models like LLaMA and Mixtral using custom hardware, offering 30 requests per minute at no cost. HuggingFace hosts thousands of open-source models and provides free inference endpoints for many of them. Cohere offers 20 requests per minute on its free plan and specializes in enterprise retrieval and generation tasks. Grok, offered by xAI, provides $25 per month in free credits. OpenRouter acts as a unified gateway to dozens of models from multiple providers, including several free-tier options. Finally, Ollama allows you to run open-source models entirely on your own machine, which eliminates API costs altogether and keeps your data private.

Why does this diversity matter? In a business context, relying on a single LLM provider creates risk. Providers experience outages, impose rate limits that can throttle your application during peak usage, and adjust pricing without warning. Different models also have different strengths: one model may produce more creative marketing copy while another is better at structured data extraction. Having access to multiple providers gives you flexibility to optimize for cost, speed, capability, and availability simultaneously.

## API-Based Access vs. Local Models

There are two fundamentally different ways to use an LLM. The first is through a cloud API, where you send a prompt over the internet to a provider's servers and receive a response. This is the approach taken by OpenAI, Gemini, Groq, and most other commercial services. API-based access requires no special hardware, starts working in minutes, and gives you access to the largest and most capable models available. The tradeoff is that you are sending your data to a third party, you are subject to rate limits and usage costs, and your application depends on network connectivity.

The second approach is running a model locally using tools like Ollama. Local models run on your own hardware, which means your data never leaves your machine. This is critical for applications involving sensitive business data, patient records, or proprietary information. Local models also have no rate limits and no per-request costs. The tradeoff is that you need a reasonably powerful machine (a modern laptop with 16 GB of RAM can run smaller models), and locally hosted models are generally less capable than the largest cloud-hosted ones. For the exercises in this book, cloud APIs with free tiers will be the primary path, but we will note where local models via Ollama are a viable alternative.

## Automatic Fallback for Production Applications

Consider a scenario: you have built a customer-facing application that uses Gemini's API for generating responses. At 10 AM on a Tuesday, your application suddenly starts returning errors because you have exceeded Gemini's daily request quota. Your users see failures, your stakeholders lose confidence, and you scramble to rewrite code to point at a different provider. This is exactly the kind of brittleness that separates a classroom demo from a production-grade application.

The solution is automatic fallback. Rather than hardcoding a single provider into your application, you configure a prioritized list of providers. When the first provider returns an error, whether due to rate limiting, authentication failure, or a server outage, your application automatically tries the next provider on the list. The user never notices the switch. This pattern is common in production systems across the technology industry, from content delivery networks to payment processing, and it applies equally well to LLM-powered applications.

## The `llm_cascade` Package

To make fallback seamless throughout this book, every notebook uses the `llm_cascade` package, a lightweight Python library designed specifically for this course. You install it once, set your API keys as environment variables (or Colab Secrets), and call `get_cascade()` to get an LLM client that automatically detects which providers you have configured. When you call `llm.generate()`, the package tries your providers in order and falls back transparently if one fails. The response object tells you not only the generated text but also which provider and model actually handled the request.

This means you can follow along with every exercise in this book regardless of which API keys you have. If you only have a Gemini key, the cascade uses Gemini. If you have both Gemini and Groq keys, it tries Gemini first and falls back to Groq when needed. If you prefer to run everything locally, you can configure Ollama as your sole provider. The code in every subsequent chapter stays the same either way.

For students on a budget, the recommended starting point is to sign up for free-tier access to Gemini (500 requests per day) and Groq (30 requests per minute). Together, these two providers will handle virtually all of the exercises in this book at zero cost. Instructions for obtaining API keys and configuring them are provided in the `llm_cascade` reference page that follows this introduction.

The next page provides a complete technical reference for `llm_cascade`, including installation instructions, supported providers, model overrides, and embedding generation.

For a related approach, see **Local LLMs**.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- The LLM provider landscape includes proprietary APIs (OpenAI, Gemini, Groq), open-source hubs (HuggingFace), unified gateways (OpenRouter), and local runners (Ollama) — each with different cost, speed, and capability profiles.
- Relying on a single provider creates business risk from outages, rate limits, and pricing changes; production applications should always have fallback options.
- The `llm_cascade` package provides automatic fallback across eight providers, trying each in order so that a rate-limit error on one provider transparently routes to the next.
- For students on a budget, Gemini (500 free requests/day) and Groq (30 free requests/minute) together cover virtually all exercises in this book at zero cost.
- API-based and local models represent a fundamental tradeoff: cloud APIs offer maximum capability with minimal setup, while local models via Ollama provide data privacy and unlimited free inference.
:::

## Exercises

**Easy:** Sign up for free-tier API keys from Gemini and Groq. Configure them in a Colab notebook using `llm_cascade` and verify that `get_cascade()` detects both providers.

**Easy:** Using `llm_cascade`, send the same prompt to two different providers and compare the responses. Note which provider and model handled each request by inspecting the response object.

**Medium:** Simulate a provider outage by intentionally setting an invalid API key for your primary provider. Send a request through `llm_cascade` and verify that it automatically falls back to the secondary provider. Document the response object to confirm which provider handled the request.

**Challenge:** Design a provider selection strategy for a company that processes 10,000 customer support queries per day. Consider cost per token, rate limits, response latency, and data privacy requirements. Recommend a primary provider, a fallback provider, and justify when Ollama should be used instead of cloud APIs.

## References

1. OpenAI. "API Reference." OpenAI Platform Documentation, 2025. [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)

2. Google. "Gemini API Overview." Google AI for Developers, 2025. [https://ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)

3. Groq. "Groq API Documentation." GroqCloud Developer Hub, 2025. [https://console.groq.com/docs](https://console.groq.com/docs)
