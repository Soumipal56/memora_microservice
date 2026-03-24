# Memora — Your Knowledge Graph

Turn any URL into structured, connected knowledge. Memora ingests articles, YouTube videos, GitHub repos, research papers, and more — then organizes them into a semantic knowledge graph with AI tagging, clustering, and memory resurfacing.

---

## Project Structure

```
memora/
├── backend/               # Python FastAPI
│   ├── main.py            # FastAPI app + routes
│   ├── config.py          # Env var loading
│   ├── requirements.txt
│   ├── .env               # Secrets (never commit)
│   ├── db/
│   │   └── mongo.py       # MongoDB CRUD
│   └── services/
│       ├── extractor.py   # Universal URL content extractor
│       ├── ai.py          # Claude + OpenAI (embeddings, analysis)
│       ├── pinecone_service.py
│       ├── ingest.py      # Main ingestion pipeline
│       ├── search.py      # Semantic search
│       └── graph.py       # Graph data endpoint
│
└── frontend/              # React + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env               # VITE_API_URL
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── GraphCanvas.jsx   # Canvas force-directed graph
        │   ├── Header.jsx
        │   ├── NodeDetail.jsx    # Side panel
        │   ├── NodeCard.jsx
        │   ├── SavedView.jsx
        │   ├── SearchView.jsx
        │   ├── StatsBar.jsx
        │   ├── EmptyState.jsx
        │   └── Toast.jsx
        ├── hooks/
        │   ├── useGraph.js
        │   └── useToast.js
        └── utils/
            ├── api.js         # All backend calls
            └── constants.js   # Colors, icons, helpers
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Edit .env — secrets are already filled in
# Start the server
python main.py
# → Running on http://localhost:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Running on http://localhost:5173
```

### 3. Open the app

Navigate to **http://localhost:5173** in your browser.

---

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX` | Pinecone index name (`memora`) |
| `OPENAI_API_KEY` | OpenAI key (for embeddings) |
| `DATABASE_URL` | PostgreSQL URL (optional, for edges) |

### frontend/.env
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (`http://localhost:8000`) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Ingest a URL |
| `POST` | `/api/search` | Semantic search |
| `GET`  | `/api/nodes`  | List all nodes |
| `GET`  | `/api/graph`  | Nodes + edges for graph |
| `DELETE` | `/api/nodes` | Clear all nodes |

---

## Supported URL Types

| Type | Method |
|---|---|
| YouTube | oEmbed API |
| GitHub | GitHub REST API + README |
| arXiv papers | arXiv XML API |
| Articles / Blogs | BeautifulSoup + meta fallback |
| PDFs | PyMuPDF |
| Twitter / LinkedIn | Meta tag fallback |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Canvas API (force graph) |
| Backend | Python, FastAPI, uvicorn |
| Database | MongoDB (nodes), Pinecone (vectors) |
| AI | Anthropic Claude (analysis), OpenAI (embeddings) |
| Scraping | httpx, BeautifulSoup4 |
