"""
Pydantic request/response schemas shared by the API, services and RAG layers.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


# ── Chat ─────────────────────────────────────────────────────────────────────
class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Message(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    """Body sent by the Vercel AI SDK useChat() hook plus our extra fields."""

    messages: list[Message]
    conversation_id: str | None = None
    use_rag: bool = False


# ── Conversations ────────────────────────────────────────────────────────────
class CreateConversationRequest(BaseModel):
    title: str = "New Chat"


class ConversationSummary(BaseModel):
    id: str
    title: str
    message_count: int
    created_at: str
    updated_at: str


class ConversationDetail(ConversationSummary):
    messages: list[Message]


# ── RAG ──────────────────────────────────────────────────────────────────────
MetadataValue = str | int | float | bool


class DocumentIngestRequest(BaseModel):
    content: str = Field(min_length=1)
    metadata: dict[str, MetadataValue] = Field(default_factory=dict)
    document_id: str | None = None


class DocumentIngestResponse(BaseModel):
    document_id: str
    chunks_stored: int


class RAGSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    n_results: int = Field(default=5, ge=1, le=50)


class RAGSearchResult(BaseModel):
    document_id: str
    content: str
    distance: float
    metadata: dict[str, MetadataValue]


class RAGSearchResponse(BaseModel):
    results: list[RAGSearchResult]
    query: str


# ── Health ───────────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    model_available: bool
    model: str
    chromadb_connected: bool
