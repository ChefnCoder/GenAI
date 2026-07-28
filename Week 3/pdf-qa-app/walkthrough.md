# DocuMind — End-to-End Implementation & Verification

The DocuMind PDF Q&A system has been fully implemented in `Week 3/pdf-qa-app` per the spec.

## 🛠️ Key Technical Components Completed

### 1. PostgreSQL Database & Migrations
- Standardized migration script at `backend/migrations/init.sql`.
- Applied tables: `users`, `pdfs`, `conversations`, and `messages` with indexes.
- Configured connection pool in `src/config/db.js` using `.env` settings.
- Seeded default user (`test@example.com`).

### 2. Ingestion & Retrieval (LangChain + ChromaDB + Gemini)
- **PDF Upload (`/upload`)**: Extracts text using `pdf-parse`, splits into chunks using `@langchain/textsplitters` (`RecursiveCharacterTextSplitter`), embeds via `GoogleGenerativeAIEmbeddings` (`gemini-embedding-001`), and stores vectors directly into ChromaDB.
- **Chat & Telemetry (`/chat`)**: Reads top-k relevant chunks from ChromaDB, constructs conversation memory (history limit of 6), calls Gemini 1.5 Flash (`gemini-1.5-flash`), calculates per-query token usage, estimated cost ($0.075/1M tokens), latency breakdowns, and flags potential hallucinations.
- **Observability (`/metrics/:pdf_id`)**: Aggregates total queries, average precision, hallucination rate, and total cost per PDF.

### 3. Modern React + Vite Frontend
- Designed UI with Tailwind CSS.
- **Upload Page**: Features drag-and-drop ingestion with upload progress.
- **Chat Page**: Real-time multi-turn conversation memory, telemetry badges (tokens, cost, latency), and collapsible retrieved source drawers.
- **Metrics Page**: Real-time aggregated statistics dashboard.

---

## 🚀 How to Run Locally

### 1. ChromaDB Server (Port 8000)
```bash
cd backend
python start_chroma.py
```

### 2. Backend Server (Port 5000)
```bash
cd backend
npm run dev
```

### 3. Frontend App (Port 5173)
```bash
cd frontend
npm run dev
```
