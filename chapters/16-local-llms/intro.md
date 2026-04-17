# Local LLMs

Throughout this book, every notebook has relied on cloud-hosted LLM providers — Gemini, OpenAI, Groq, and others — accessed over the internet through API calls. This is the default mode for most AI applications today, and for good reason: cloud providers offer state-of-the-art models with zero infrastructure overhead. But there is another way. You can download an open-weight language model, run it entirely on your own hardware, and never send a single byte of data to the cloud. This chapter explores why you might want to do that, how to set it up, and when local inference is the right choice for business applications.

## Why Run LLMs Locally?

The most compelling reason to run models locally is **data privacy**. When you send a prompt to a cloud API, your data travels over the internet to a third-party server. For many business applications — legal document review, healthcare records analysis, proprietary code generation, financial modeling — this creates a compliance risk that legal and security teams will eventually flag. Regulations like GDPR in Europe and HIPAA in the United States impose strict requirements on where data can be processed, and sending it to a cloud LLM provider may violate those requirements. Running a model on your own machine or your company's private server eliminates this concern entirely: the data never leaves your infrastructure.

Cost is the second major driver. Cloud APIs charge per token — every prompt and every response costs money. For experimental work, where you might run hundreds of variations of a prompt to find the right one, these costs add up quickly. A local model, once downloaded, can be queried millions of times for free (beyond the electricity to power your machine). This makes local models ideal for research, prototyping, and educational experimentation. As the instructor notes in class: "LM Studio or any other local LLM gives you the power of experimenting with AI. That's something all of us should be doing after this course — have some kind of control over AI that can be done."

Local models also work **offline**. On a plane, in a restricted environment, or simply with an unreliable internet connection, a local model keeps working. And because you control the entire stack — model weights, inference parameters, system prompt — you have complete freedom to experiment with configurations that cloud providers may not expose.

## LM Studio

LM Studio is a desktop application that provides a visual interface for discovering, downloading, and running open-weight language models. It supports models in the GGUF format (a quantized format optimized for consumer hardware) and hosts a vast catalog of models from HuggingFace, the largest open-source model repository.

What makes LM Studio particularly useful for learning is its **Developer mode**. When enabled, LM Studio runs a local HTTP server on `localhost` that exposes an API endpoint compatible with the OpenAI API format. This means any code written to call OpenAI — including the notebooks in this book — can be redirected to your local model simply by changing the base URL and using any placeholder API key. The API key does not matter for local use because there is no authentication; you are talking to your own machine.

In a classroom setting, LM Studio offers a practical advantage: a shared models folder on a network drive allows the entire class to access downloaded models without each student needing to download multi-gigabyte files individually. Once a model is downloaded to the shared folder, any student can point their LM Studio instance to that directory and begin inference immediately.

## Ollama

While LM Studio excels at interactive exploration, **Ollama** is the tool of choice for command-line workflows and production integration. Running a model is as simple as typing `ollama run llama3` in a terminal. Ollama manages model downloads, quantization, and serving automatically, and like LM Studio, it exposes an OpenAI-compatible API server that can be called from any application.

Ollama is available for Linux, macOS, and Windows, and it also offers a cloud service and a desktop application (in preview). Its command-line nature makes it well-suited for scripting, automation, and integration into CI/CD pipelines. Many practitioners use both tools: LM Studio for interactive experimentation and visual model browsing, Ollama for automated workflows and production deployments.

The `llm_cascade` package used throughout this book includes Ollama as a supported provider. By setting the `OLLAMA_API_KEY` environment variable (any placeholder value works for local use), the cascade will include your local Ollama instance in the provider rotation alongside cloud providers like Gemini and Groq. This means you can develop and test with a local model and automatically fall back to cloud providers when you need more capability.

## Other Tools in the Ecosystem

The local LLM ecosystem extends well beyond LM Studio and Ollama. **llama.cpp** is the foundational C++ inference engine that both LM Studio and Ollama use internally — it is the reason these tools can run large models efficiently on consumer CPUs. For users who want maximum control, running llama.cpp directly offers the lowest overhead. **Jan** is another open-source desktop application similar to LM Studio, while **GPT4All** focuses on lightweight, privacy-preserving deployment. **AnythingLLM** combines a local model runtime with built-in RAG and document management, making it a self-contained system for document Q&A without any cloud dependency. For production serving at scale, **vLLM** provides high-throughput inference with features like continuous batching and PagedAttention.

## Model Selection and Quantization

Choosing the right model for local use involves balancing intelligence against hardware requirements. Models are measured by their parameter count: a 1B parameter model is fast but limited, a 7B model is capable and runs well on most modern laptops, a 13B model requires a decent GPU or plenty of RAM, and a 70B model demands high-end hardware. For classroom use, the instructor recommends starting small: "Use very small models, like under 7B. Smaller models may not be very smart, but they're fast."

**Quantization** is the technique that makes local inference practical. The original model weights are stored in 16-bit or 32-bit floating point, but quantization compresses them to 4-bit or 8-bit integers with minimal quality loss. The GGUF format supports multiple quantization levels — Q4_K_M offers a good balance between quality and size, while Q8_0 preserves more quality at the cost of larger files. A 7B model that would require 14 GB in FP16 can run in under 4 GB after Q4 quantization, fitting comfortably in laptop RAM.

Downloading a model is a one-time operation. As noted in class: "Once you load it, it's there in your computer. You don't have to download it every single time." Larger models take longer to download but the transfer speed depends on your internet connection, not your computing resources.

## When to Use Local vs. Cloud

The decision between local and cloud inference is not either-or — it depends on the use case. Local models are the right choice when data privacy is paramount, when you need offline capability, when you are experimenting intensively and want unlimited free inference, or when you are running batch processing on cost-sensitive workloads. Cloud models remain the better choice when you need maximum capability (GPT-4o, Claude, Gemini), when you need to scale to many concurrent users, when your team needs shared infrastructure, or when the latest model improvements matter more than cost.

In practice, many organizations adopt a **hybrid approach**: local models for development, testing, and privacy-sensitive workloads; cloud APIs for production deployment and maximum performance. The `llm_cascade` architecture used in this book naturally supports this pattern — local and cloud providers coexist in the same fallback chain, and the system automatically routes to whichever is available.

The companion notebook walks through setting up LM Studio, downloading a model, starting the local server, and calling it from Python — giving you firsthand experience with the local inference workflow.

For a related approach, see **Vibe Coding**.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- Local LLMs keep data entirely on your own infrastructure, eliminating compliance risks under regulations like GDPR and HIPAA that restrict where data can be processed.
- LM Studio provides a visual interface with an OpenAI-compatible local API server, allowing existing code to be redirected to a local model by simply changing the base URL.
- Ollama is the command-line tool of choice for scripted workflows and production integration, and it is supported as a provider in the `llm_cascade` fallback chain.
- Quantization (e.g., Q4_K_M in GGUF format) compresses model weights from 16-bit to 4-bit with minimal quality loss, enabling a 7B-parameter model to run in under 4 GB of RAM on a laptop.
- The practical decision is not local vs. cloud but a hybrid approach: local models for privacy-sensitive workloads and unlimited experimentation, cloud APIs for maximum capability and scale.
:::

## Exercises

**Easy:** Install LM Studio or Ollama on your machine and download a small model (under 3B parameters). Send it a simple prompt and record the response time compared to a cloud API call.

**Easy:** Explain the difference between Q4_K_M and Q8_0 quantization levels. For a student laptop with 8 GB of RAM, which quantization level would you recommend for a 7B model, and why?

**Medium:** Set up Ollama as a provider in `llm_cascade` alongside Gemini. Configure the cascade so that Ollama is tried first and Gemini serves as fallback. Send five prompts and note which provider handles each request. Then disconnect from the internet and send five more prompts to verify that Ollama continues working offline.

**Challenge:** A law firm wants to deploy an LLM for reviewing confidential merger documents. They process approximately 200 documents per day, each around 5,000 tokens. Recommend a local deployment architecture: specify the model size, quantization level, hardware requirements, and whether LM Studio or Ollama is more appropriate. Justify your choices based on privacy, throughput, and cost.

## References

- LM Studio. (2026). *LM Studio Documentation*. https://lmstudio.ai/
- Ollama. (2026). *Ollama Documentation*. https://ollama.com/
- Gerganov, G. (2023). *llama.cpp: Port of Facebook's LLaMA model in C/C++*. https://github.com/ggerganov/llama.cpp
- SitePoint. (2026). Guide to Local LLMs in 2026: Privacy, Tools & Hardware. https://www.sitepoint.com/definitive-guide-local-llms-2026-privacy-tools-hardware/
- Zealousys. (2026). LM Studio vs Ollama: Which Local LLM Tool Is Better in 2026? https://zealousys.com/blog/lm-studio-vs-ollama/
