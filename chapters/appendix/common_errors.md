# Common Errors and Fixes

This appendix collects the most frequently encountered errors when running the book's notebooks on Google Colab, along with their solutions.

## `ModuleNotFoundError: No module named 'X'`

**Cause:** A required package is not installed, or the pip install cell was not run.

**Fix:** Run the pip install cell at the top of the notebook. If the error persists after installation, restart the runtime (Runtime → Restart runtime) so the new package is loaded into memory.

## `numpy` version conflicts (`cannot import name '_center' from 'numpy._core.umath'`)

**Cause:** The `-U` (upgrade) flag in pip install upgraded numpy to version 2.x, which is incompatible with older versions of `transformers` or `sentence-transformers`.

**Fix:** Remove the `-U` flag from the pip install command so Colab's pre-installed numpy stays at a compatible version. If already broken, run:
```python
!pip install numpy==1.26.4
```
Then restart the runtime.

## `transformers` / CLIP errors (`ModuleNotFoundError: Could not import module 'CLIPProcessor'`)

**Cause:** Version conflict between `transformers` and `sentence-transformers`, or a too-new version of `transformers` that changed the CLIP import paths.

**Fix:** Pin the transformers version:
```python
!pip install transformers==4.46.3
```
Restart the runtime after installing.

## Gemini 429 / quota exhausted (`resource_exhausted`, `429`, `rate limit`)

**Cause:** You exceeded the free-tier rate limit for your LLM provider (e.g., Gemini's 500 requests/day or Groq's 30 requests/minute).

**Fix:** The `llm_cascade` package automatically falls back to the next available provider. If all providers are exhausted, wait a few minutes and try again. To avoid this during demos, uncomment only one question at a time rather than running all questions in a single cell.

## `401 Unauthorized` / `expired_api_key`

**Cause:** An API key stored in Colab Secrets is expired, revoked, or invalid.

**Fix:** Go to Colab Secrets (🔑 icon in the left sidebar), update or remove the expired key. The `llm_cascade` package treats auth errors as retriable and will automatically try the next provider.

## `No LLM provider configured. Set at least one API key.`

**Cause:** No API keys are detected. Either no keys are set in Colab Secrets, or the "Notebook access" toggle is off.

**Fix:**
1. Click the 🔑 icon in Colab's left sidebar
2. Add at least one key (e.g., `GEMINI_API_KEY`)
3. **Toggle "Notebook access" ON** for that key (easy to miss)
4. Re-run the `llm = get_cascade()` cell

## Gemini returns empty or truncated answers

**Cause:** Gemini 2.5 Flash has "thinking mode" enabled by default, which consumes tokens on internal reasoning before producing visible output. Long prompts may exhaust the token budget during thinking, leaving nothing for the actual answer.

**Fix:** The `llm_cascade` package (v0.1.0+) disables thinking mode automatically via `ThinkingConfig(thinking_budget=0)`. If you are using an older version, update:
```python
!pip install --no-cache-dir git+https://github.com/KarAnalytics/llm_cascade.git
```

## `NotImplementedError` on `llm.bind_tools(tools)`

**Cause:** The LangChain `ChatOpenAI` wrapper for some providers (especially Gemini via the OpenAI-compatible endpoint) does not support native tool binding.

**Fix:** Use the prompt-based tool-calling pattern instead of `bind_tools()`. The LangChain notebook demonstrates this approach: the LLM outputs a JSON action string, and a Python loop parses and executes it.

## `SyntaxError: unterminated string literal` in notebook cells

**Cause:** A `\n` inside a Python string was stored as a literal newline in the notebook's JSON source, breaking the string across lines.

**Fix:** Replace `\n` inside strings with `chr(10)` or use triple-quoted strings. If you encounter this in a downloaded notebook, re-download the latest version from the [code_demos repository](https://github.com/KarAnalytics/code_demos).

## ChromaDB `ValueError: An embedding function already exists`

**Cause:** A previous notebook run created a ChromaDB collection with the default embedding function, and a subsequent run tries to open it with an explicitly specified embedding function.

**Fix:** Delete the existing collection before creating a new one:
```python
try:
    chroma_client.delete_collection(name=collection_name)
except Exception:
    pass
collection = chroma_client.create_collection(name=collection_name, embedding_function=embedding_fn)
```

## `FileNotFoundError` for data files

**Cause:** The notebook expects a data file (Excel, CSV, SQL) that hasn't been downloaded yet.

**Fix:** Run the download cell (usually a `!wget` or `urllib.request.urlretrieve` call) before the cell that reads the file. Some notebooks download from GitHub automatically; make sure those cells run successfully.

## `torch` / CUDA errors on Colab

**Cause:** Colab's pre-installed PyTorch version was overwritten by a pip install that pulled in a CPU-only version.

**Fix:** Do not include `torch` in pip install commands on Colab — Colab already has PyTorch pre-installed with GPU support. Remove `torch` from the install line and restart the runtime.

## Colab disconnects during long training (QLoRA notebook)

**Cause:** Colab's free tier disconnects after ~90 minutes of idle time or if the browser tab is inactive.

**Fix:** Keep the browser tab active during training. The QLoRA notebook with the 0.5B model and 15 epochs takes only ~2 minutes on a T4 GPU, so this is rarely an issue with the default settings.

## `pip install` dependency resolver warnings

**Cause:** Colab's pre-installed packages have version conflicts with newly installed packages. The warnings look like:
```
ERROR: pip's dependency resolver does not currently take into account all the packages that are installed.
```

**Fix:** These are warnings, not errors — the notebook will still run. They occur because Colab's environment has pre-installed packages (tensorflow, torch, etc.) with pinned versions that conflict with newer installations. As long as the notebook executes correctly, these warnings can be ignored.
