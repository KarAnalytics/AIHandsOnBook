# RAG with Images and Video

The previous chapters applied RAG to text documents and structured databases. In each case, the core pattern remained the same: retrieve relevant evidence, augment the prompt with that evidence, and generate a grounded answer. This chapter extends that pattern to visual content. Instead of embedding text or executing database queries, we embed images and video frames into a vector space and retrieve them using natural-language queries. The enabling technology is CLIP, a model that bridges the gap between language and vision by placing both modalities into a shared embedding space.

## CLIP: Bridging Text and Images

Contrastive Language-Image Pre-training, or CLIP, is a model developed by OpenAI that was trained on hundreds of millions of image-text pairs collected from the internet. During training, CLIP learns to produce embeddings where an image and its corresponding textual description end up close together in the same high-dimensional vector space. An image of a red sports car and the text "a red sports car" will have high cosine similarity, even though they are entirely different types of input.

CLIP achieves this through a dual-encoder architecture. One encoder processes images and produces a fixed-dimensional vector. A separate encoder processes text and produces a vector of the same dimensionality. The training objective pushes matching image-text pairs closer together while pushing non-matching pairs apart. The result is a shared embedding space where you can meaningfully compare a text vector against an image vector using the same cosine similarity metric you already know from document RAG.

This cross-modal capability is what makes visual RAG possible. In document RAG, both the query and the documents are text, so a single text embedding model suffices. In image RAG, the query is text but the knowledge base consists of images. Without a model like CLIP that can embed both modalities into a common space, there would be no way to compute similarity between a user's typed question and a collection of images.

## Image RAG: From Text Queries to Visual Answers

The Image RAG pipeline follows a workflow that will feel familiar from earlier chapters. First, each image in the knowledge base is passed through CLIP's image encoder to produce an embedding vector. These vectors form a searchable index, analogous to the vector store in document RAG. When a user submits a natural-language query such as "red circular product," the query is passed through CLIP's text encoder to produce a query vector. Cosine similarity is computed between the query vector and every image vector in the index, and the top-k most similar images are retrieved.

The retrieved images then need to be interpreted and described in natural language. This is where multimodal large language models enter the pipeline. A vision-capable model such as Google's Gemini receives the retrieved images along with the user's question and any available metadata, then generates a grounded answer that references specific visual details from the retrieved images. The LLM is not hallucinating product descriptions from its training data; it is describing exactly what it sees in the images that were retrieved as evidence.

The accompanying Image RAG notebook demonstrates this pipeline using a synthetic product catalog of colored geometric shapes. While the images are simple, the pipeline is identical to what you would deploy in production with real product photographs. The key components, CLIP embedding, cosine similarity retrieval, and multimodal answer generation, remain exactly the same regardless of image complexity.

## Video RAG: Adding the Temporal Dimension

Video RAG extends the image approach by adding a preprocessing step: keyframe extraction. A video is a sequence of frames over time, and processing every frame would be computationally wasteful since consecutive frames are nearly identical. Instead, the pipeline samples keyframes at regular intervals, typically one frame per second, creating a manageable set of representative images from the video.

Each extracted keyframe is then embedded with CLIP exactly as in Image RAG. The critical addition is that each frame's embedding is paired with its timestamp, preserving the temporal context that makes video data unique. When a user asks "When does the green product appear?", the retrieval step identifies the most visually relevant frames and reports not just what was found but when it occurs in the video. The multimodal LLM then synthesizes an answer that references both the visual content and the timing.

The accompanying Video RAG notebook generates a synthetic product showcase video where different products appear in sequence, extracts keyframes, builds a CLIP index, and demonstrates temporal retrieval. The same architecture applies to real-world video at any scale. The only changes for production deployment would be more sophisticated keyframe selection, such as detecting scene changes rather than sampling at fixed intervals, and using a vector database to handle larger frame collections efficiently.

## The Role of Multimodal LLMs

A distinctive feature of visual RAG compared to text-based RAG is the role the LLM plays in the generation step. In document RAG, the LLM receives text chunks and produces a text answer, operating entirely within a single modality. In visual RAG, the LLM must cross modalities: it receives images as input and produces text as output. This requires a model with vision capabilities, such as Google's Gemini, OpenAI's GPT-4o, or similar multimodal architectures that can process both pixel data and language.

These multimodal LLMs do not merely caption images. They can reason about visual content, compare multiple retrieved images, identify patterns, and synthesize observations into coherent answers. When a user asks "What are the cheapest circular products in the catalog?", the model examines the retrieved images, reads the price labels visible in the images, identifies the circular shapes, and composes a comparative answer. The grounding is visual rather than textual, but the principle is identical: the model bases its answer on retrieved evidence rather than parametric knowledge.

## Business Applications

Visual RAG opens up application areas that text-based RAG simply cannot address. In e-commerce, customers can describe what they are looking for in natural language and retrieve matching product images from a catalog of millions without relying on manual tagging or keyword metadata. In media and entertainment, production teams can search vast video archives with queries like "scenes with outdoor lighting and two people talking" to find relevant footage in seconds. In manufacturing and quality control, visual RAG can match inspection photos against a database of known defect patterns. In healthcare, medical imaging pipelines can retrieve similar diagnostic images to support clinical decision-making. In each case, the same retrieve-augment-generate pattern applies, with CLIP providing the cross-modal bridge between human language and visual data.

## The Notebooks

The two notebooks that follow implement these ideas end to end. The first notebook, **Image RAG**, builds a synthetic product catalog, creates a CLIP embedding index, retrieves images by text query, and generates multimodal answers with Gemini. The second notebook, **Video RAG**, generates a synthetic product showcase video, extracts keyframes, indexes them with CLIP, and demonstrates temporal retrieval with timestamped answers. Together, they show that the RAG pattern generalizes naturally from text to pixels, with CLIP and multimodal LLMs providing the machinery to bridge the modality gap.

For a related approach, see **RAG with LlamaIndex**.

## Key Takeaways

:::{admonition} Key Takeaways
:class: tip
- CLIP enables visual RAG by placing images and text into a shared embedding space, allowing natural-language queries to retrieve relevant images via cosine similarity.
- Image RAG follows the same retrieve-augment-generate pattern as document RAG: embed the image collection, embed the text query, retrieve the most similar images, and generate a grounded answer using a multimodal LLM.
- Video RAG adds a keyframe extraction preprocessing step and pairs each frame's CLIP embedding with its timestamp, enabling temporal retrieval that answers not just "what" but "when" something appears.
- Multimodal LLMs (Gemini, GPT-4o) do more than caption images — they reason about visual content, compare retrieved images, and synthesize observations into coherent answers grounded in visual evidence.
- Visual RAG unlocks business applications that text-based RAG cannot address, including e-commerce product search, video archive retrieval, manufacturing defect matching, and medical imaging support.
:::

## Exercises

**Easy:** Using the Image RAG notebook, submit three different text queries against the product catalog and inspect the top-3 retrieved images for each. Evaluate whether the retrieved images match the query intent and note any cases where CLIP's cross-modal matching fails.

**Easy:** Explain why a single text embedding model (like the ones used in document RAG) cannot be used for image retrieval. What specific property of CLIP makes cross-modal retrieval possible?

**Medium:** In the Video RAG notebook, experiment with different keyframe extraction rates (e.g., 1 frame per second vs. 1 frame every 3 seconds). Compare retrieval accuracy and note the tradeoff between temporal precision and computational cost.

**Challenge:** Design an Image RAG system for a fashion e-commerce company with 500,000 product images. Specify the embedding pipeline (model choice, batch processing strategy), the vector database (justify your choice from ChromaDB, Pinecone, or Weaviate), and the multimodal LLM for answer generation. Address how you would handle queries that combine visual attributes ("red dress") with structured filters ("under $50, size medium").

## References

- Radford, A., Kim, J. W., Hallacy, C., Ramesh, A., Goh, G., Agarwal, S., Sastry, G., Askell, A., Mishkin, P., Clark, J., Krueger, G., & Sutskever, I. (2021). Learning Transferable Visual Models From Natural Language Supervision. *Proceedings of the 38th International Conference on Machine Learning (ICML)*.
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Kuttler, H., Lewis, M., Yih, W., Rocktaschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33.
- Team Gemini, Anil, R., Borgeaud, S., et al. (2024). Gemini: A Family of Highly Capable Multimodal Models. *arXiv preprint arXiv:2312.11805*.
- Luo, H., Ji, L., Zhong, M., Chen, Y., Lei, W., Duan, N., & Li, T. (2022). CLIP4Clip: An Empirical Study of CLIP for End to End Video Clip Retrieval and Captioning. *Neurocomputing*, 508, 293-304.
- Jia, C., Yang, Y., Xia, Y., Chen, Y., Parekh, Z., Pham, H., Le, Q., Sung, Y., Li, Z., & Duerig, T. (2021). Scaling Up Visual and Vision-Language Representation Learning With Noisy Text Supervision. *Proceedings of the 38th International Conference on Machine Learning (ICML)*.
