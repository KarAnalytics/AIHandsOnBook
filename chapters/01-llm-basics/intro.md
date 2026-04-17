# LLM Foundations

Large Language Models have rapidly become one of the most consequential technologies in business. From generating marketing copy to summarizing legal contracts, these systems demonstrate a remarkable ability to process and produce human language. Yet for business professionals who will deploy, evaluate, and manage these systems, a surface-level understanding is not enough. To make sound decisions about when and how to use LLMs, you need to understand what is happening beneath the surface. This chapter introduces the four foundational building blocks that make modern language models work: tokenization, embeddings, TF-IDF, and attention.

## How Large Language Models Work

At their core, LLMs are statistical models trained to predict the next word (or, more precisely, the next token) in a sequence. The process of creating a working LLM involves three distinct phases. During **pre-training**, the model is exposed to vast quantities of text from books, websites, code repositories, and other sources. Through this exposure, the model learns the statistical patterns of language: grammar, facts, reasoning patterns, and even stylistic conventions. Pre-training is computationally expensive, often requiring thousands of GPUs running for weeks or months, and it produces a base model that can complete text but is not yet tuned for conversation or specific tasks.

The second phase, **post-training**, refines the base model for practical use. This includes techniques like instruction tuning, where the model learns to follow directions, and reinforcement learning from human feedback (RLHF), where human evaluators help the model distinguish helpful responses from harmful or unhelpful ones. Post-training is what transforms a raw text-completion engine into the conversational assistants and task-oriented tools that businesses actually deploy.

Finally, **inference** is the phase where the trained model is put to work. When you type a prompt into ChatGPT or call an API from your application, the model processes your input through its learned parameters and generates a response token by token. Understanding these three phases helps explain both the capabilities and the limitations of LLMs: the model can only draw on patterns it encountered during training, it behaves according to the guardrails established during post-training, and the quality of its output at inference time depends heavily on how well the input is structured.

## Tokenization

Before an LLM can process any text, that text must be converted into a numerical format the model can work with. This is where tokenization comes in. A tokenizer breaks input text into discrete units called tokens, which might be whole words, parts of words, or even individual characters, depending on the tokenization scheme. Each token is then mapped to a unique integer ID from the model's vocabulary.

Consider the sentence "Is the earth spherical?" A tokenizer based on the LLaMA model might break this into seven tokens, while GPT-2's tokenizer produces five. The differences arise because each model uses a different vocabulary and a different algorithm for deciding where to split text. Modern LLMs typically use subword tokenization methods like Byte Pair Encoding (BPE), which strike a balance between keeping common words intact and breaking rare words into recognizable pieces.

Tokenization has practical consequences that business users encounter regularly. The now-famous "strawberry problem" illustrates this well: when asked "How many r's are in the word strawberry?", many LLMs answer incorrectly because they never see the individual letters. The tokenizer might encode "strawberry" as a single token or as subword pieces like "straw" and "berry," neither of which preserves the letter-level information needed to count individual characters. This is not a failure of reasoning but a direct consequence of how the model perceives text at the token level. Understanding tokenization helps explain why LLMs struggle with spelling tasks, character counting, and certain kinds of text manipulation, even when they excel at higher-level language understanding.

## Embeddings

Once text has been tokenized into integer IDs, those IDs must be transformed into a representation the model can actually reason over. This is the role of embeddings. An embedding maps each token ID to a dense vector, a list of numbers (typically hundreds or thousands of dimensions) that positions the token in a high-dimensional space. The key insight is that these vectors are not arbitrary. Through training, tokens that appear in similar contexts end up with similar vectors, meaning the geometric relationships between vectors capture semantic relationships between words.

For example, in a well-trained embedding space, the vector for "computer" will be closer to the vector for "business" than to the vector for "cooking." Cosine similarity, a standard measure of how closely two vectors point in the same direction, quantifies these relationships numerically. The accompanying notebook demonstrates this using both a small custom-trained Word2Vec model and a pre-trained GloVe model trained on billions of words from Wikipedia. The pre-trained model produces far more meaningful similarity scores because it has seen enough text to learn robust semantic relationships.

Embeddings are fundamental not only to LLMs but to virtually every modern NLP application. They are the mechanism through which language, an inherently symbolic and discrete system, gets translated into the continuous mathematical space where neural networks operate. When you hear about "vector databases" or "semantic search" in later chapters, those systems are built directly on the embedding representations introduced here.

## TF-IDF: A Classical Baseline

Before learned embeddings became dominant, the standard approach to representing text numerically was TF-IDF, which stands for Term Frequency-Inverse Document Frequency. TF-IDF assigns a weight to each word in a document based on two factors: how frequently the word appears in that specific document (term frequency) and how rare the word is across the entire collection of documents (inverse document frequency). Words that appear frequently in one document but rarely in others receive high weights, making them useful for distinguishing that document from the rest.

TF-IDF is worth understanding for two reasons. First, it remains a practical and effective tool for many text analysis tasks in business, from document classification to search ranking, and you may encounter it in production systems. Second, contrasting TF-IDF with learned embeddings clarifies what makes modern approaches more powerful. TF-IDF treats each word independently: it has no notion that "good" and "excellent" are related, and it cannot capture word order or context. Embeddings, by contrast, encode semantic similarity directly in the vector space, and when combined with attention mechanisms, they can represent the meaning of words in context. The notebook for this section walks through a complete TF-IDF calculation so you can see exactly how the weights are derived and appreciate both the elegance and the limitations of this classical method.

## Attention and the Transformer Architecture

The final building block, and arguably the most important one, is the attention mechanism. Introduced in the landmark 2017 paper "Attention Is All You Need" by Vaswani and colleagues at Google, the attention mechanism is the core innovation behind the transformer architecture that powers every modern LLM.

The fundamental problem attention solves is context. In the sentence "The bank was steep and covered in wildflowers," the word "bank" refers to a riverbank. In "She walked into the bank to deposit a check," it refers to a financial institution. The same token must take on different meanings depending on the surrounding words. Self-attention achieves this by allowing each token in a sequence to look at every other token and compute a relevance score. Tokens that are contextually important to each other receive higher attention weights, and this information is used to produce context-aware representations.

The accompanying notebook demonstrates this concretely with a sentiment analysis task. When the model processes the sentence "the movie was boring," the attention mechanism learns to assign the highest weight to the word "boring," which carries the most sentiment information. Without the attention layer, the model must treat every word's embedding equally, losing the ability to focus on what matters most. This capacity to dynamically weigh the importance of different parts of the input is what allows transformers to handle long-range dependencies and nuanced meaning in ways that earlier architectures could not.

The transformer architecture assembles these building blocks into a coherent system. Text enters as raw characters, gets broken into tokens, gets mapped to embedding vectors, and then passes through multiple layers of self-attention and feed-forward networks. Each layer refines the representations, building increasingly abstract and context-sensitive features. The result is a model that can generate coherent paragraphs, translate between languages, summarize documents, and answer complex questions, all from the same underlying architecture.

## From Theory to Practice

The four notebooks that accompany this chapter let you work with each of these concepts directly. The tokenization notebook compares legacy NLP tokenization with modern subword tokenizers from LLaMA and GPT-2. The embedding notebook trains a Word2Vec model from scratch and then explores a pre-trained GloVe model to see how semantic similarity works at scale. The TF-IDF notebook walks through the mathematics of term weighting on a small corpus. And the attention notebook builds a simple sentiment classifier with and without an attention layer so you can see, quantitatively, the difference attention makes.

Each notebook is self-contained and runs on Google Colab preferably with T4 GPU. Notebooks also run on CPU mode in Google Colab but may take a little longer to complete.

For a related approach, see **Calling LLMs: Providers and Fallback**.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- Tokenization converts text into integer IDs using subword methods like Byte Pair Encoding; different models (LLaMA vs. GPT-2) tokenize the same sentence differently, directly affecting model behavior.
- Embeddings map tokens to dense vectors where geometric proximity encodes semantic similarity — this is the foundation for vector databases and semantic search covered in later chapters.
- TF-IDF remains a practical baseline for text analysis, but unlike embeddings it treats words independently and cannot capture synonyms, word order, or contextual meaning.
- The attention mechanism allows each token to dynamically weigh every other token in the sequence, enabling context-dependent representations that distinguish "bank" (riverbank) from "bank" (financial institution).
- The transformer architecture chains tokenization, embeddings, and multi-layer self-attention into a unified system that powers every modern LLM.
:::

## Exercises

**Easy:** Using the tokenization notebook, tokenize the word "unbelievable" with both the LLaMA and GPT-2 tokenizers. How many tokens does each produce, and what are the subword pieces?

**Easy:** Explain why cosine similarity between the GloVe vectors for "king" and "queen" is higher than between "king" and "bicycle." What property of embedding training causes this?

**Medium:** In the TF-IDF notebook, add a new document to the corpus that contains a rare technical term. Recalculate the TF-IDF matrix and explain why that term receives a high weight. Then explain a scenario where TF-IDF would fail but semantic embeddings would succeed.

**Challenge:** Modify the attention notebook's sentiment classifier to process a sentence where the sentiment-bearing word appears at the beginning rather than the end (e.g., "Terrible was the movie in every way"). Compare the attention weights to the original example and explain whether the attention mechanism successfully identifies the key word regardless of position.

## References

- Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention Is All You Need. *Advances in Neural Information Processing Systems*, 30.
- Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. *Proceedings of NAACL-HLT 2019*.
- Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient Estimation of Word Representations in Vector Space. *Proceedings of ICLR 2013*.
- Sennrich, R., Haddow, B., & Birch, A. (2016). Neural Machine Translation of Rare Words with Subword Units. *Proceedings of the 54th Annual Meeting of the ACL*.
- Pennington, J., Socher, R., & Manning, C. D. (2014). GloVe: Global Vectors for Word Representation. *Proceedings of EMNLP 2014*.
