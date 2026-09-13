# ChatBot Infosys — Local AI Chatbot

A fully functional, production-quality AI chatbot powered by **Qwen2.5:7b** running entirely on your local machine via **Ollama**. No cloud API keys needed. Your data never leaves your machine.

---

## Architecture

```
┌──────────────────────────────────────────┐
│            REACT FRONTEND (Vite)         │
│  shadcn/ui · Lucide · Framer Motion      │
│  React Markdown · Vercel AI SDK          │
└──────────────┬───────────────────────────┘
               │ POST /api/chat (SSE stream)
               ▼
┌──────────────────────────────────────────┐
│        PYTHON FASTAPI BACKEND            │
│  LangChain LCEL Chain                    │
│  Conversation History (per-session)      │
│  ChromaDB RAG Infrastructure             │
└────────────┬──────────────┬─────────────┘
             │              │
             ▼              ▼
    ┌──────────────┐  ┌───────────────┐
    │    Ollama    │  │   ChromaDB    │
    │  qwen2.5:7b  │  │  Vector Store │
    └──────────────┘  └───────────────┘
```

---

## Technology Integration

| Tool | Role |
|------|------|
| **OpenSpec** | Project specification document (see `openspec/spec.md`) |
| **Antigravity Superpowers** | Development methodology: plan → analyze → implement → verify |
| **UIPro** | Design system (glassmorphism, AI purple palette, Poppins + Open Sans) |
| **React** | Frontend SPA (Vite + React 18 + TypeScript) |
| **shadcn/ui** | Button, Textarea, ScrollArea, Avatar, Separator, Tooltip, Badge, Skeleton |
| **Framer Motion** | Message animations, sidebar slide, typing indicator dots |
| **Lucide React** | All icons: Send, Square, Plus, Bot, User, Wifi, Trash2, Menu, etc. |
| **Vercel AI SDK** | `useChat()` hook — streaming state, message management, abort |
| **React Markdown** | Renders assistant messages with GFM support + syntax highlighting |
| **Python** | FastAPI backend — API, services, chains, RAG layers |
| **Ollama** | Local LLM runtime at `http://localhost:11434` |
| **Qwen2.5:7b** | Primary language model doing all inference |
| **LangChain** | `ChatOllama` + LCEL chain + conversation history management |
| **ChromaDB** | Persistent vector store for RAG document search |

---

## Requirements

- **Python** 3.10+ (tested with 3.14)
- **Node.js** 18+ (tested with v22)
- **Ollama** installed ([download here](https://ollama.com))
- **Qwen2.5:7b** model (auto-pulled if missing)
- ~8GB disk space for the model
- 8GB+ RAM recommended (16GB for comfortable use)

---

## Installation

### 1. Clone / enter the project

```bash
cd ChatBot_Infosys
```

### 2. Pull the model

```bash
ollama pull qwen2.5:7b
```

### 3. Install backend Python dependencies

```bash
cd backend
pip3 install --only-binary=:all: fastapi uvicorn pydantic pydantic-settings httpx
pip3 install --only-binary=:all: langchain langchain-community langchain-ollama langchain-core
pip3 install --only-binary=:all: chromadb
cp .env.example .env
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the Application

### Start Ollama (if not already running)

```bash
ollama serve
```

### Start the Backend (in a terminal)

```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start the Frontend (in another terminal)

```bash
cd frontend
npm run dev
```

### Open the app

```
http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check Ollama + model + ChromaDB status |
| `POST` | `/api/chat` | Stream a chat response (SSE) |
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create new conversation |
| `GET` | `/api/conversations/{id}` | Get conversation with history |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation |
| `POST` | `/api/documents` | Ingest a document into ChromaDB |
| `POST` | `/api/rag/search` | Similarity search in ChromaDB |

### Chat Request Example

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is Python?"}],
    "use_rag": false
  }' \
  --no-buffer
```

### Response format (Vercel AI SDK Data Stream Protocol)

```
0:"Hello"
0:", "
0:"how"
0:" can"
0:" I"
0:" help?"
d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}
```

---

## RAG (Retrieval-Augmented Generation)

ChromaDB is initialized on startup. Documents can be ingested via the API:

```bash
# Ingest a document
curl -X POST http://localhost:8000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Python is a programming language...",
    "metadata": {"source": "python_docs", "title": "Python Basics"}
  }'

# Search for relevant chunks
curl -X POST http://localhost:8000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Python?", "n_results": 3}'

# Use RAG in chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is Python?"}],
    "use_rag": true
  }' --no-buffer
```

### RAG Architecture

```
Document text
     ↓
Text splitting (500 char chunks, 50 char overlap)
     ↓
Default embeddings (sentence-transformers via ChromaDB)
     ↓
ChromaDB upsert (cosine distance)
     ↓
At chat time: similarity search → top-K chunks
     ↓
Context injected into LangChain prompt
     ↓
Qwen2.5:7b generates response with context
```

---

## Configuration

Edit `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
CHROMA_PATH=./chroma_db
CHROMA_COLLECTION=chatbot_documents
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
MAX_HISTORY_TURNS=10
```

Change `OLLAMA_MODEL` to use a different model without touching code.

---

## Troubleshooting

### "Server disconnected" in the UI
- Check that backend is running: `curl http://localhost:8000/api/health`
- Start Ollama: `ollama serve`

### Ollama not found
- Install Ollama: https://ollama.com/download
- Verify: `which ollama && ollama --version`

### Model not available
```bash
ollama pull qwen2.5:7b
ollama list  # verify it appears
```

### Port already in use
```bash
# Kill process on port 8000
fuser -k 8000/tcp
# Or change port in .env: BACKEND_PORT=8001
```

### CORS errors in browser
- Ensure `FRONTEND_URL=http://localhost:5173` in `backend/.env`
- Check that both services are running on expected ports

### Streaming not working
- Verify the backend returns `X-Vercel-AI-Data-Stream: v1` header
- Check browser network tab for the `/api/chat` SSE stream

### ChromaDB fails to start
```bash
pip3 install --only-binary=:all: chromadb --upgrade
```

### Python 3.14 compatibility issues
If specific packages fail to compile with Python 3.14, use `--only-binary=:all:` flag to force binary wheel installation:
```bash
pip3 install --only-binary=:all: <package_name>
```

---

## Development

### Project Structure

```
ChatBot_Infosys/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── api/              # Route handlers
│   │   ├── chains/           # LangChain LCEL chains
│   │   ├── core/             # Configuration
│   │   ├── models/           # Pydantic schemas
│   │   ├── rag/              # ChromaDB client + RAG service
│   │   ├── services/         # Business logic
│   │   └── utils/            # Streaming helpers
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/         # MessageBubble, ChatArea, etc.
│   │   │   ├── layout/       # AppLayout, Sidebar
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # useChat, useHealthCheck, useConversations
│   │   └── lib/              # utils
│   └── package.json
├── docs/
├── openspec/
└── README.md
```

### Running Tests

```bash
cd backend
python3 -m pytest tests/ -v
```
