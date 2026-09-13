"""
FastAPI application entry point.

Sets up:
  - CORS (allowing requests from the React frontend)
  - API routers (health, chat, conversations, documents/rag)
  - Startup event (ChromaDB initialization)
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import health, chat, conversations, documents
from app.rag.chroma_client import get_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ChromaDB collection on startup."""
    print(f"🚀 Starting ChatBot Infosys Backend")
    print(f"   Ollama URL : {settings.ollama_base_url}")
    print(f"   Model      : {settings.ollama_model}")
    print(f"   ChromaDB   : {settings.chroma_path}")

    # Eagerly initialize ChromaDB collection
    try:
        collection = get_collection()
        print(f"✅ ChromaDB ready — collection '{settings.chroma_collection}' ({collection.count()} docs)")
    except Exception as exc:
        print(f"⚠️  ChromaDB init warning: {exc}")

    yield

    print("👋 Backend shutting down")


app = FastAPI(
    title="ChatBot Infosys API",
    description="Local AI chatbot powered by Qwen2.5:7b via Ollama and LangChain",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id", "X-Vercel-AI-Data-Stream"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(documents.router, prefix="/api", tags=["RAG"])


@app.get("/")
async def root():
    return {"message": "ChatBot Infosys API", "docs": "/docs"}
