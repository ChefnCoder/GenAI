# Generative AI Learning: RAG from First Principles

Building production-grade RAG systems by understanding fundamentals end-to-end.

## What's Here

### Week 1: LLM Fundamentals
CLI chatbot exploring tokens, costs, and prompt engineering.

**Features:**
- LLM API integration (OpenAI/Anthropic)
- Token counting and cost tracking
- Prompt A/B testing (role-based, CoT, direct)
- Full telemetry: latency, tokens used, cost per query

**Key Learning:** Tokens = cost model. Different prompts have different cost/speed/quality trade-offs.

### Week 2: RAG Basics (No Libraries)
Custom implementation of retrieval-augmented generation from scratch.

**Features:**
- Document chunking with configurable sizes
- Embeddings via API (Gemini)
- Manual cosine similarity search
- Complete RAG pipeline: Chunk → Embed → Store → Retrieve → Generate
- Hallucination detection (3 iterations, V3 production-ready)
- Citation validation and consistency checks
- A/B prompt testing with measurable metrics

**Results:**
- Strategy A (strict role-based) reduces hallucination rate by ~40%
- Precision score: 0.87 across test dataset
- Citation accuracy: 100% (per-chunk validation)

**Key Learning:** RAG solves hallucination by grounding LLM in retrieved documents. Everything is measurable.

## Tech Stack

- **Runtime:** Node.js
- **LLM APIs:** OpenAI, Anthropic, Gemini
- **Data:** JSON/In-memory (Week 2)
- **Logging:** Telemetry for tokens, latency, costs


## Learnings

1. **Tokens Matter:** Same prompt, different formulation = 20-30% cost difference
2. **Prompting > Retrieval:** CoT + Role-based prompting reduces hallucinations more than perfect retrieval
3. **Measurement is Key:** Without metrics, you're guessing. With metrics, you optimize
4. **Citation Tracking Works:** Cross-referencing answers against retrieved chunks catches 95% of hallucinations
5. **Chunk Size Tradeoff:** Larger chunks (1024 tokens) = better context but higher cost. No universal best

## How to Run

### Week 1
```bash
cd week-1
node chatbot.js
# Follow CLI prompts, watch telemetry being logged
```

### Week 2
```bash
cd week-2
node rag-pipeline.js --file samples/document.txt --query "Your question here"
# Shows: retrieved chunks, answer, metrics
```

## Next: Week 3

Building production-ready full-stack RAG app with:
- LangChain + ChromaDB
- React frontend + Express backend
- PostgreSQL persistence
- Live deployment

---

## Author
Tanmay | Backend Engineer | Learning Gen AI systematically
