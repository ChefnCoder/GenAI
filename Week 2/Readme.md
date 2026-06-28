# 📄 Document Q&A System — Week 2 GenAI Project

A production-grade RAG (Retrieval-Augmented Generation) pipeline built from scratch in Node.js — no LangChain, no vector DB libraries. Manual implementation of chunking, embeddings, cosine similarity, hallucination detection, citation tracking, and evaluation metrics.

---

## 🧠 What It Does

Takes any text document → chunks it → embeds chunks using Gemini → stores vectors in JSON → retrieves relevant chunks for any user query via cosine similarity → generates grounded answers using Groq LLM → validates citations + detects hallucinations → logs full telemetry.

---

## 📁 File Structure

```
week2/
├── .env                    ← API keys — create from .env.example (gitignored)
├── .env.example            ← Template for environment variables
├── .gitignore
├── package.json            ← type: module, dependencies
├── groq.js                 ← Groq LLM client (llama-3.3-70b-versatile)
├── embedder.js             ← Gemini text-embedding-004 client
│
├── prompting/              ← Prompt engineering experiments
│   ├── fewshot.js          ← Zero-shot vs Few-shot comparison
│   ├── cot.js              ← Without CoT vs With CoT comparison
│   └── rolebased.js        ← No role vs Engineer vs Support agent
│
└── rag/                    ← Core RAG pipeline
    ├── sample.txt          ← Your source document (gitignored — add your own)
    ├── chunker.js          ← Splits doc into chunks + chunk size experiment
    ├── vectorstore.js      ← Embeds chunks + saves to vectorstore.json
    ├── retriever.js        ← Cosine similarity search
    ├── vectorstore.json    ← Auto-generated vector DB (gitignored)
    ├── qa.js               ← Master RAG pipeline with full telemetry
    └── ab_test.js          ← A/B prompt strategy comparison
```

---

## ⚙️ Setup

**1. Install dependencies**
```powershell
cd week2
npm install groq-sdk @google/generative-ai dotenv
```

**2. Configure API keys**

Copy `.env.example` to `.env` and fill in your keys:
```powershell
cp .env.example .env
```

`.env.example` contents:
```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
```

Get your keys here:
- Groq → https://console.groq.com
- Gemini → https://aistudio.google.com/app/apikey

**3. Add your document**

Create `rag/sample.txt` and paste any plain text content into it.

> `sample.txt` and `vectorstore.json` are gitignored — you must create them locally. Works with any plain text document (resume, policy doc, article, wiki, etc.)

---

## 🚀 How to Run

### Step 1 — Chunk the document
```powershell
node rag/chunker.js
```
Splits `sample.txt` into overlapping chunks and runs a chunk size comparison experiment (50w / 100w / 200w).

**Expected output:**
```
=== CHUNK ANALYSIS ===
Total chunks     : 4
Avg chunk size   : 166 words
Overlap ratio    : 25.0%

=== CHUNK SIZE COMPARISON ===
--- Small  (50w) --- Total: 13, Top Score: 0.7312
--- Medium (100w)--- Total: 7,  Top Score: 0.7193
--- Large  (200w)--- Total: 4,  Top Score: 0.7253
```

---

### Step 2 — Build vector store
```powershell
node rag/vectorstore.js
```
Embeds each chunk using Gemini `text-embedding-004` and saves to `rag/vectorstore.json`.

**Expected output:**
```
Embedding 4 chunks...
✓ Chunk 0 embedded — vector size: 3072
✓ Chunk 1 embedded — vector size: 3072
✓ Chunk 2 embedded — vector size: 3072
✓ Chunk 3 embedded — vector size: 3072
✅ Vector store saved to rag/vectorstore.json
```

> ⚠️ Run this once. Re-run only if `sample.txt` changes.

---

### Step 3 — Ask questions (main pipeline)
```powershell
node rag/qa.js
```
Runs 3 test queries through the full RAG pipeline with telemetry.

**Expected output per query:**
```
=== ANSWER ===
Tanmay knows MERN, Redis, and Kafka. [Chunk 0]

=== TELEMETRY ===
{
  "avgRetrievalScore": 0.687,
  "citation": {
    "citationFound": true,
    "citationValid": true,
    "citedChunkIds": [0],
    "validations": [{ "id": 0, "valid": true, "matchRatio": 0.5 }]
  },
  "consistency": { "consistent": true, "reason": "only one statement" },
  "hallucinationDetected": false,
  "hallucinationRate": "0%",
  "precision": 0.667,
  "latency": { "retrievalMs": 865, "llmMs": 303, "consistencyMs": 202, "totalMs": 1372 },
  "tokens": { "inputTokens": 660, "outputTokens": 10 },
  "estimatedCostUSD": 0.000397
}

✅ Final Hallucination Rate: 33.3%
```

---

### Step 4 — Run A/B prompt strategy test
```powershell
node rag/ab_test.js
```
Runs 5 test questions through Strategy A (strict) and Strategy B (liberal). Prints comparison table.

**Expected output:**
```
FINAL SUMMARY TABLE
Question                                      | A P/R/F1/BLEU  | B P/R/F1/BLEU  | Halluc A | Halluc B
What backend technologies does Tanmay know?   | 0.625/...      | 1/1/1/...      | false    | false
Where did Tanmay do his internship?           | 1/1/1/0.375    | 1/1/1/0.136    | false    | false
...
```

---

### Optional — Run prompt engineering experiments
```powershell
node prompting/fewshot.js
node prompting/cot.js
node prompting/rolebased.js
```
Each file runs a comparison and prints both outputs side by side.

---

## 🔄 Project Flow

```
sample.txt
    │
    ▼
chunker.js
  └── splits into 200w chunks with 50w overlap
  └── attaches metadata: id, wordCount, startIndex, endIndex
    │
    ▼
vectorstore.js
  └── calls Gemini text-embedding-004 per chunk
  └── saves [{id, text, embedding: [...3072]}] to vectorstore.json
    │
    ▼
retriever.js (called inside qa.js)
  └── embeds user query via Gemini
  └── computes cosine similarity against all stored embeddings
  └── returns top-K most relevant chunks
    │
    ▼
qa.js
  └── builds master prompt (Role + Few-shot + CoT + Context)
  └── calls Groq LLM → gets answer with [Chunk X] citation
  └── validateCitation() → checks cited chunk contains answer keywords
  └── checkConsistency() → LLM self-checks for contradictions
  └── logs hallucination rate % across all queries
  └── outputs full telemetry
```

---

## 📊 Telemetry Fields Explained

| Field | What it means |
|---|---|
| `avgRetrievalScore` | Cosine similarity avg of retrieved chunks (higher = more relevant) |
| `citation.citationValid` | Did LLM cite the correct chunk as its source? |
| `citation.matchRatio` | % of answer words found in cited chunk |
| `consistency.consistent` | Does answer contradict itself? |
| `hallucinationDetected` | True if precision < 0.25 OR citation invalid |
| `hallucinationRate` | Running % of hallucinated queries across session |
| `precision` | % of response words grounded in retrieved context |
| `latency.retrievalMs` | Time to embed query + search (Gemini — slowest step) |
| `latency.llmMs` | Time for Groq to generate answer (fast) |
| `latency.consistencyMs` | Time for consistency check LLM call |
| `estimatedCostUSD` | Approximate cost per query on Groq |

---

## 🧪 A/B Test Results

| Metric | Strategy A (Strict) | Strategy B (Liberal) |
|---|---|---|
| BLEU Score | ✅ Higher (closer to reference) | Lower |
| Recall | Lower | ✅ Higher (writes more) |
| Hallucination Risk | ✅ Lower | Higher |
| Citation | ✅ Required | Not enforced |

**Verdict:** Use Strategy A for production. Strategy B writes more but drifts from ground truth.

---

## ⚠️ Known Limitations

| Issue | Cause | Fix |
|---|---|---|
| Numeric facts false-flagged | Word filter ignores numbers like "8.05" | Add number-aware matching |
| Chunk 0 dominates retrieval | Resume header is keyword-dense | Use larger document with varied sections |
| Consistency check adds ~200ms | Extra LLM call per query | Skip for short answers or latency-critical flows |

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| **Groq** (`llama-3.3-70b-versatile`) | LLM for answer generation + consistency check |
| **Gemini** (`text-embedding-004`) | Text embeddings (3072 dimensions) |
| **Node.js** | Runtime |
| **JSON file** | Vector store (no DB needed) |

---

## 📌 Key Concepts Demonstrated

- RAG pipeline (manual, no LangChain)
- Cosine similarity from scratch
- Hallucination detection (V1 → V2 → V3 evolution)
- Citation tracking + validation
- Precision / Recall / F1 / BLEU scoring
- A/B prompt strategy testing with data
- Production telemetry per query
