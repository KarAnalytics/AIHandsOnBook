# Fine-Tuning with QLoRA

When RAG isn't enough — when you need the model to learn a new *style*, *tone*, or *core knowledge* — you fine-tune it. QLoRA (Quantized Low-Rank Adaptation) makes this possible on a free Colab T4 GPU by:

- Compressing the model to 4-bit (75% memory reduction)
- Training only ~0.5% of the parameters (LoRA adapters)
- Achieving memorization of new facts in ~2 minutes

This chapter fine-tunes a small model on fictional company data and shows a side-by-side before/after comparison.
