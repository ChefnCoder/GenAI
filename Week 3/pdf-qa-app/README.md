# ⚡ DocuMind — Enterprise-Grade RAG PDF Q&A Platform

DocuMind is a production-grade, AI-powered document intelligence platform. Users can upload PDF documents, ask context-aware questions with multi-turn conversation memory, view precise source text citations, and monitor real-time query telemetry (tokens, cost, latency, hallucination rates, and similarity scores).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/tech--stack-React%20%7C%20Node.js%20%7C%20ChromaDB%20%7C%20PostgreSQL%20%7C%20Gemini-indigo.svg)

---

## 🚀 Key Features

- 🔐 **Multi-Tenant JWT Authentication**: Secure register/login flows with `bcrypt` password hashing, token validation, and full user data isolation.
- 📑 **Automated PDF Parsing & Chunking**: Uses `pdf-parse` and LangChain's `RecursiveCharacterTextSplitter` (`chunkSize: 1000`, `chunkOverlap: 200`) for precise text extraction.
- 🧠 **Vector Embeddings & Search**: Powered by Google Gemini (`gemini-embedding-001`) vectors stored in a dedicated **ChromaDB** HNSW index using cosine similarity matching.
- 💬 **Context-Aware QA with Multi-Turn Memory**: Powered by **Gemini 2.5 Flash** with sliding window conversation context retrieved from PostgreSQL.
- 🔍 **Interactive Source Citation**: Transparent display of top-k retrieved text chunks, similarity confidence scores, and document origin per answer.
- 📊 **Real-Time Telemetry & Hallucination Guard**: Tracks query latency (`ms`), token consumption, estimated USD API cost, precision similarity scores, and automated hallucination detection flags.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React (Vite) + Tailwind CSS | Dynamic, responsive glassmorphic UI with Lucide icons |
| **Backend API** | Node.js + Express.js | Controller-Service architecture with rate limiting & error handling |
| **Relational DB** | PostgreSQL | Stores user profiles, PDF metadata, conversation sessions, & telemetry |
| **Vector Database** | ChromaDB (port 8000) | Manages vector embedding collections and top-k nearest neighbor queries |
| **LLM & Embeddings** | Google Gemini API | `gemini-2.5-flash` for QA and `gemini-embedding-001` for embeddings |
| **Orchestration** | LangChain v1.x | Document chunking, text splitting, and LLM integrations |

---

## 📁 Repository Project Structure

```text
pdf-qa-app/
├── backend/
│   ├── migrations/
│   │   └── init.sql            # PostgreSQL database schema & indexes
│   ├── src/
│   │   ├── config/             # DB & service connection configs
│   │   ├── controllers/        # HTTP request handlers (auth, upload, chat, metrics)
│   │   ├── middleware/         # JWT auth, rate limiter, error handler
│   │   ├── routes/             # Express endpoint routing
│   │   ├── services/           # Core RAG, ChromaDB, & LLM business logic
│   │   ├── utils/              # Telemetry & hallucination detection algorithms
│   │   └── app.js              # Express app entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/         # React views (AuthModal, UploadPage, ChatPage, MetricsPage)
    │   ├── App.jsx             # Main navigation & state container
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdfqa
GEMINI_API_KEY=your_google_gemini_api_key_here
CHROMA_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret_key_here

# RAG & Observability Settings
MAX_CHUNKS_PER_PDF=500
TOP_K_CHUNKS=3
HISTORY_LIMIT=6
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

---

## 🏃 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remote URI)
- Python 3.10+ (for running ChromaDB server)

### 1. Database Setup
Initialize the PostgreSQL schema:
```bash
psql -U postgres -d pdfqa -f backend/migrations/init.sql
```

### 2. Start Vector Store (ChromaDB)
Run ChromaDB on port 8000:
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

### 3. Start Backend API
```bash
cd backend
npm install
npm run dev
```
The server will start at `http://localhost:5000`.

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🧪 Quick Test Demo Credentials

If you'd like to test immediately without registering:
- **Email**: `user1@example.com`
- **Password**: `password123`

*(Alternatively, use the 1-click **"Auto-fill"** button on the login modal!)*

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
