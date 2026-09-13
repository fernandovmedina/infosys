"""
Chat streaming endpoint — POST /api/chat

Accepts a list of messages and returns a streaming SSE response
formatted for Vercel AI SDK's useChat() hook.

Flow:
  Request → get/create conversation → optional RAG context lookup
       → LangChain chain streaming → Vercel AI SDK SSE protocol → client
"""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.chat_service import (
    get_or_create_conversation,
    stream_chat_response,
)
from app.rag.rag_service import build_rag_context
from app.utils.streaming import stream_tokens

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Stream a chat response using LangChain + Ollama (Qwen2.5:7b).

    The response uses Vercel AI SDK Data Stream Protocol so the frontend
    useChat() hook can process it natively.
    """
    # Get or create a conversation session
    conversation_id = get_or_create_conversation(request.conversation_id)

    # Build RAG context if requested
    rag_context = ""
    if request.use_rag and request.messages:
        last_user_msg = next(
            (m.content for m in reversed(request.messages) if m.role == "user"),
            "",
        )
        if last_user_msg:
            rag_context = build_rag_context(last_user_msg)

    # Create the streaming generator through LangChain → Ollama
    token_stream = stream_chat_response(
        messages=request.messages,
        conversation_id=conversation_id,
        rag_context=rag_context,
    )

    # Wrap in Vercel AI SDK SSE format
    formatted_stream = stream_tokens(token_stream)

    return StreamingResponse(
        formatted_stream,
        media_type="text/plain; charset=utf-8",
        headers={
            "X-Conversation-Id": conversation_id,
            "X-Vercel-AI-Data-Stream": "v1",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
