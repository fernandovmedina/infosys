# Chatbot — Local AI Backend

The API behind the floating **Chatbot** widget in the Infosys web app. It is powered by **Qwen2.5:7b** running entirely on your machine via **Ollama**. No cloud API keys are needed, and your data never leaves your machine.

The chat UI is no longer a separate app. It lives in the main Next.js project:

| Path | Role |
|------|------|
| `components/chatbot/chatbot-widget.tsx` | Floating launcher + panel, mounted in `app/layout.tsx` |
| `components/chatbot/chat-messages.tsx` | Message list, welcome prompts, typing indicator, auto-scroll |
| `components/chatbot/message-bubble.tsx` | Markdown rendering of replies |
| `components/chatbot/message-input.tsx` | Message box, send/stop, RAG toggle, offline notice |
| `components/chatbot/conversation-list.tsx` | Past conversations (select / delete) |
| `lib/chatbot/use-health-check.ts`, `lib/chatbot/use-conversations.ts` | Backend status + conversation API hooks |

---

## Architecture

```
┌──────────────────────────────────────────┐
│   INFOSYS NEXT.JS APP (localhost:3000)   │
│  ChatbotWidget · Vercel AI SDK useChat() │
└──────────────┬───────────────────────────┘
               │ /chatbot-api/*  (Next.js rewrite, see next.config.ts)
               ▼
┌──────────────────────────────────────────┐
│   PYTHON FASTAPI BACKEND (port 8001)     │
│  LangChain LCEL Chain                    │
│  Conversation History (per-session)      │
│  ChromaDB RAG Infrastructure             │
└────────────┬──────────────┬─────────────┘
             ▼              ▼
    ┌──────────────┐  ┌───────────────┐
    │    Ollama    │  │   ChromaDB    │
    │  qwen2.5:7b  │  │  Vector Store │
    └──────────────┘  └───────────────┘
```

The browser only ever talks to the Next.js origin, so no CORS setup is needed. Port **8000 is used by the main Infosys backend**, so this service runs on **8001**. If you run it somewhere else, set `CHATBOT_API_URL` (default `http://localhost:8001/api`) for the Next.js app.

---

## Requirements

- **Python** 3.10+ (tested with 3.14)
- **Ollama** ([download](https://ollama.com)) with the **qwen2.5:7b** model (~4.7 GB)
- 8GB+ RAM recommended (16GB for comfortable use)

## Installation

```bash
cd chatbot
ollama pull qwen2.5:7b

python3 -m venv .venv
.venv/bin/pip install --only-binary=:all: fastapi "uvicorn[standard]" pydantic pydantic-settings httpx \
  langchain langchain-community langchain-ollama langchain-core chromadb pytest
cp .env.example .env
```

`requirements.txt` lists the originally pinned versions. On Python 3.14, the unpinned binary install above is what works.

## Running

```bash
# 1. Ollama (if not already running)
ollama serve

# 2. Chatbot backend
cd chatbot
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# 3. The Infosys web app (from the repo root)
pnpm dev
```

Open http://localhost:3000 and click the round button in the bottom-right corner.

---

## API Reference

All routes are prefixed with `/api` on the backend (`/chatbot-api` through the web app).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check Ollama + model + ChromaDB status |
| `POST` | `/api/chat` | Stream a chat response |
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create new conversation |
| `GET` | `/api/conversations/{id}` | Get conversation with history |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation |
| `POST` | `/api/documents` | Ingest a document into ChromaDB |
| `POST` | `/api/rag/search` | Similarity search in ChromaDB |

### Chat request

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What is Python?"}], "conversation_id": null, "use_rag": false}' \
  --no-buffer
```

The response uses the Vercel AI SDK Data Stream Protocol. The `X-Conversation-Id` response header carries the conversation id, and the widget sends it back so follow-up messages share server-side history.

```
0:"Hello"
0:", how can I help?"
d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}
```

---

## RAG (Retrieval-Augmented Generation)

ChromaDB is initialized on startup. Ingest documents via the API, then enable **Search documents (RAG)** in the widget (or send `"use_rag": true`).

```bash
curl -X POST http://localhost:8001/api/documents \
  -H "Content-Type: application/json" \
  -d '{"content": "Python is a programming language...", "metadata": {"source": "python_docs"}}'

curl -X POST http://localhost:8001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Python?", "n_results": 3}'
```

Pipeline: text split into 500-char chunks (50 overlap), then ChromaDB default embeddings (cosine), then top-K chunks at chat time, then context injected into the LangChain prompt.

---

## Configuration

Edit `chatbot/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
CHROMA_PATH=./chroma_db
CHROMA_COLLECTION=chatbot_documents
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8001
FRONTEND_URL=http://localhost:3000
MAX_HISTORY_TURNS=10
```

Change `OLLAMA_MODEL` to use a different model without touching code.

## Troubleshooting

- **Widget says "Offline":** check `curl http://localhost:8001/api/health`. `"status": "degraded"` means Ollama isn't reachable, so run `ollama serve`.
- **Model not available:** run `ollama pull qwen2.5:7b` and `ollama list`.
- **Port already in use:** pick another port and start the web app with `CHATBOT_API_URL=http://localhost:<port>/api pnpm dev`.
- **ChromaDB fails to start:** run `.venv/bin/pip install --only-binary=:all: chromadb --upgrade`.

## Project Structure

```
chatbot/
├── app/
│   ├── main.py      # FastAPI app entry point
│   ├── api/         # Route handlers
│   ├── chains/      # LangChain LCEL chains
│   ├── core/        # Configuration
│   ├── models/      # Pydantic schemas
│   ├── rag/         # ChromaDB client + RAG service
│   ├── services/    # Business logic
│   └── utils/       # Streaming helpers
├── tests/
└── requirements.txt
```

```bash
cd chatbot && .venv/bin/python -m pytest tests/ -v
```
