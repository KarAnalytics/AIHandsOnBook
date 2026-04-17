# Fine-Tuning with QLoRA

## When Retrieval Is Not Enough

Throughout the preceding chapters, we built increasingly sophisticated Retrieval-Augmented Generation (RAG) pipelines. RAG is a powerful pattern: it grounds a language model's responses in external documents, reducing hallucination and keeping answers current. But RAG has its limits. Every answer requires a retrieval step, adding latency. The model's tone, vocabulary, and reasoning style remain those of the generic foundation model. And for knowledge that the model needs to recall instantly and consistently --- the kind of deep, institutional knowledge that defines an organization --- retrieving fragments from a document store at query time can feel brittle. What if the model could simply *know* these facts the way it knows the English language?

That is the promise of fine-tuning. Rather than fetching information from an external source at inference time, fine-tuning modifies the model's internal weights so that new knowledge, style, or behavior becomes part of the model itself. A fine-tuned model does not need to search for your company's product names, pricing tiers, or brand voice --- it has internalized them. The result is faster inference, more consistent outputs, and a model that feels genuinely specialized rather than generically augmented.

## The Memory Wall: Why Full Fine-Tuning Is Expensive

The obstacle, historically, has been cost. Fine-tuning a large language model means running gradient-based optimization over billions of parameters. A 7-billion-parameter model stored in standard 32-bit floating point (FP32) occupies roughly 28 gigabytes of GPU memory just for the weights alone --- before accounting for optimizer states, gradients, and activations, which can double or triple that figure. Training such a model traditionally required multiple high-end GPUs costing thousands of dollars per hour on cloud platforms. For most organizations, and certainly for most MBA students, that put fine-tuning out of reach.

Two complementary techniques changed this equation: Low-Rank Adaptation (LoRA) and quantization. Together, they form QLoRA --- a method that makes fine-tuning accessible on hardware as modest as a free Google Colab T4 GPU with 15 gigabytes of VRAM.

## LoRA: Training a Fraction of the Parameters

The key insight behind LoRA, introduced by Hu et al. (2021), is that not all parameters need to change during fine-tuning. When a foundation model adapts to a new task, the weight updates tend to occupy a low-rank subspace --- meaning the essential information in those updates can be captured by much smaller matrices. LoRA exploits this by freezing all of the original model weights and injecting pairs of small, trainable matrices (called adapters) into selected layers, typically the attention projection layers. During a forward pass, the output of each adapted layer is the sum of the original frozen computation and a lightweight learned correction.

The practical impact is dramatic. Instead of updating all parameters, LoRA trains only the adapter matrices --- typically around 0.5 to 1 percent of the total parameter count. For a model with 315 million parameters, this means roughly 2 million trainable parameters while the remaining 313 million stay frozen. Training is faster, memory requirements drop substantially, and the original model weights are never destroyed, so you can swap different LoRA adapters in and out for different tasks without maintaining separate copies of the full model.

## Quantization: Compressing the Base Model

LoRA reduces what you train; quantization reduces what you store. Standard models represent each parameter as a 16-bit floating-point number. Quantization compresses these values to 4-bit representations using specialized formats such as NormalFloat4 (NF4), which is information-theoretically optimal for normally distributed weights. This compression reduces the memory footprint of the base model by approximately 75 percent --- a 7-billion-parameter model that would occupy 14 gigabytes in FP16 fits into roughly 3.5 gigabytes in 4-bit.

Dettmers et al. (2023) demonstrated that this aggressive compression introduces negligible quality loss when combined with LoRA adapters, because the adapters themselves are trained in higher precision (FP16) and compensate for any quantization artifacts. Their technique, which they named QLoRA, also introduced double quantization --- quantizing the quantization constants themselves --- to squeeze out additional memory savings.

## QLoRA: Bringing It All Together

QLoRA is simply the combination of these two ideas: load the base model in 4-bit quantization to minimize memory, then apply LoRA adapters to train a small subset of parameters in higher precision. The result is a fine-tuning method that runs comfortably on a single consumer-grade or free-tier cloud GPU. In the accompanying notebook, we fine-tune a Qwen2.5-0.5B-Instruct model on just 15 examples of fictional company data in approximately two minutes on a Colab T4 GPU, using under one gigabyte of VRAM. The model goes from knowing nothing about our fictional Acme Analytics to accurately recalling its CEO, annual recurring revenue, product details, and mission statement.

## The Training Pipeline

The practical workflow for QLoRA fine-tuning follows a consistent pattern. First, you prepare your training data as structured question-answer pairs or instruction-response examples. Second, you load the base model with a 4-bit quantization configuration (specifying NF4 format, FP16 compute dtype, and double quantization). Third, you define a LoRA configuration --- choosing the adapter rank, scaling factor, target modules, and dropout rate. Fourth, you apply the LoRA adapters to the quantized model using the PEFT (Parameter-Efficient Fine-Tuning) library. Fifth, you train using the SFTTrainer from the TRL library, which handles the supervised fine-tuning loop with standard hyperparameters such as learning rate, batch size, and epoch count. Finally, you evaluate the fine-tuned model by comparing its outputs to the base model on held-out questions.

## RAG versus Fine-Tuning: Choosing the Right Tool

RAG and fine-tuning are not competitors --- they solve different problems. RAG excels when your knowledge base changes frequently, when you need citation-level traceability back to source documents, and when the volume of potentially relevant information is too large to encode into model weights. Fine-tuning excels when you need the model to adopt a specific style, tone, or persona, when you want faster inference without a retrieval step, and when core knowledge should be recalled consistently without depending on retrieval quality.

The tradeoffs are concrete. RAG requires no retraining when documents change --- you simply update the vector store. Fine-tuning requires a new training run for each knowledge update, but delivers lower latency at inference time because there is no retrieval step. RAG responses are grounded in retrieved text, which can reduce hallucination, while fine-tuned models can still hallucinate if asked about topics outside their training distribution.

In practice, mature organizations combine both approaches. They fine-tune a base model to internalize brand voice, core product knowledge, compliance guidelines, and domain-specific terminology. They then layer RAG on top for dynamic information --- current inventory levels, recent support tickets, or today's pricing changes. This hybrid architecture delivers the consistency and speed of fine-tuning with the freshness and traceability of retrieval.

## The Accompanying Notebook

The QLoRA notebook in this chapter provides a hands-on demonstration of the complete pipeline. It fine-tunes a small language model on fictional data about Acme Analytics --- a made-up AI-powered business intelligence company --- and presents a side-by-side comparison of model responses before and after training. Before fine-tuning, the base model either refuses to answer or confabulates when asked about Acme Analytics. After just two minutes of QLoRA training on 15 examples, the model accurately recalls the company's CEO, revenue figures, product names, and pricing. The contrast makes the power of fine-tuning immediately tangible.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- QLoRA combines 4-bit quantization of the base model with low-rank LoRA adapters trained in higher precision, making fine-tuning feasible on a single free-tier GPU.
- Fine-tuning internalizes knowledge into model weights for faster inference and consistent recall, while RAG retrieves knowledge at query time for freshness and traceability --- mature systems combine both.
- LoRA adapters modify only ~0.5--1% of parameters while freezing the rest, enabling multiple task-specific adapters to be swapped in and out without duplicating the full model.
:::

## Exercises

**Easy:** Using the provided QLoRA notebook, fine-tune the model on the fictional Acme Analytics data and compare before/after responses on five factual questions. Record which questions the base model gets wrong and the fine-tuned model gets right.

**Medium:** Create your own training dataset of 15--20 question-answer pairs about a fictional company you invent. Fine-tune the model and evaluate whether it can recall the key facts (CEO, revenue, products) you included in the training data.

**Challenge:** Experiment with LoRA hyperparameters (rank, alpha scaling factor, target modules) across three different configurations. Measure the impact on training time, memory usage, and answer quality. Document which configuration produces the best tradeoff.

**Challenge:** Build a hybrid system that combines a QLoRA fine-tuned model with a RAG pipeline. Fine-tune for core company knowledge and use RAG for dynamic data. Compare this hybrid approach against RAG-only and fine-tuning-only on a mix of static and dynamic questions.

For applying fine-tuned or foundation models as autonomous problem-solvers with tool access, see **Ch 14 Single Agent**.

## References

- Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., & Chen, W. (2021). LoRA: Low-Rank Adaptation of Large Language Models. *arXiv preprint arXiv:2106.09685*. [https://arxiv.org/abs/2106.09685](https://arxiv.org/abs/2106.09685)

- Dettmers, T., Pagnoni, A., Holtzman, A., & Zettlemoyer, L. (2023). QLoRA: Efficient Finetuning of Quantized Language Models. *Advances in Neural Information Processing Systems, 36*. [https://arxiv.org/abs/2305.14314](https://arxiv.org/abs/2305.14314)

- Dettmers, T., Lewis, M., Belkada, Y., & Zettlemoyer, L. (2022). LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale. *Advances in Neural Information Processing Systems, 35*. [https://arxiv.org/abs/2208.07339](https://arxiv.org/abs/2208.07339)

- Mangrulkar, S., Gugger, S., Debut, L., Belkada, Y., Paul, S., & Bossan, B. (2022). PEFT: Parameter-Efficient Fine-Tuning of Billion-Scale Models on Low-Resource Hardware. Hugging Face. [https://github.com/huggingface/peft](https://github.com/huggingface/peft)
