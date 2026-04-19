# RAG with Images and Video

RAG can also work with visual content. Instead of embedding text, we embed **images** (and video frames) using CLIP — a model that maps both text and images into the same vector space.

This chapter builds:
- **Image RAG** — embed product images with CLIP, retrieve by text query ("red circular product"), answer with a multimodal LLM
- **Video RAG** — extract keyframes from a video, embed them with CLIP, retrieve relevant frames, and describe them

The same retrieve-augment-generate pattern applies — just with pixels instead of paragraphs.
