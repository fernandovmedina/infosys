"""
Chat service — orchestrates LangChain chain, history, and optional RAG context.

Responsibilities:
  - Maintain per-session conversation history (in-memory)
  - Invoke the LangChain LCEL chain with history + RAG context
  - Yield streaming tokens for the SSE endpoint
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from collections.abc import AsyncIterator
from datetime import datetime, UTC

from langchain_core.messages import HumanMessage, AIMessage

from app.chains.chat_chain import build_chat_chain, convert_messages_to_langchain
from app.core.config import settings
from app.models.schemas import Message, MessageRole

# ── In-memory conversation store ─────────────────────────────────────────────
# Structure: { conversation_id: { "messages": [...], "created_at": ..., "updated_at": ... } }
_conversations: dict[str, dict] = {}

# Singleton chain (built once, reused across requests)
_chat_chain = build_chat_chain()


def get_or_create_conversation(conversation_id: str | None) -> str:
    """Return existing conversation id or create a new one."""
    if conversation_id and conversation_id in _conversations:
        return conversation_id

    new_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()
    _conversations[new_id] = {
        "messages": [],
        "title": "New conversation",
        "created_at": now,
        "updated_at": now,
    }
    return new_id


def get_conversation_history(conversation_id: str) -> list:
    """Return LangChain message objects for the given conversation."""
    conv = _conversations.get(conversation_id, {})
    raw_messages = conv.get("messages", [])

    lc_history = []
    for msg in raw_messages:
        if msg["role"] == "user":
            lc_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_history.append(AIMessage(content=msg["content"]))

    # Trim to max window (each turn = user + assistant = 2 messages)
    max_messages = settings.max_history_turns * 2
    return lc_history[-max_messages:] if len(lc_history) > max_messages else lc_history


def save_turn(conversation_id: str, user_content: str, assistant_content: str) -> None:
    """Persist a completed user+assistant turn to the in-memory store."""
    conv = _conversations.get(conversation_id)
    if not conv:
        return

    conv["messages"].extend([
        {"role": "user", "content": user_content},
        {"role": "assistant", "content": assistant_content},
    ])
    conv["updated_at"] = datetime.now(UTC).isoformat()

    # Auto-title: use first user message as title (truncated)
    if len(conv["messages"]) == 2:
        conv["title"] = user_content[:60] + ("…" if len(user_content) > 60 else "")


def list_conversations() -> list[dict]:
    """Return all conversations sorted by update time (newest first)."""
    return [
        {
            "id": cid,
            "title": data["title"],
            "message_count": len(data["messages"]),
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
        }
        for cid, data in sorted(
            _conversations.items(),
            key=lambda item: item[1]["updated_at"],
            reverse=True,
        )
    ]


def get_conversation_detail(conversation_id: str) -> dict | None:
    """Return full conversation including messages, or None if not found."""
    conv = _conversations.get(conversation_id)
    if not conv:
        return None
    return {
        "id": conversation_id,
        "title": conv["title"],
        "message_count": len(conv["messages"]),
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "messages": conv["messages"],
    }


def delete_conversation(conversation_id: str) -> bool:
    """Delete a conversation. Returns True if it existed."""
    return _conversations.pop(conversation_id, None) is not None


async def stream_chat_response(
    messages: list[Message],
    conversation_id: str,
    rag_context: str = "",
) -> AsyncIterator[str]:
    """
    Main entry point for streaming chat.

    1. Extract the last user message as `input`
    2. Load conversation history from store
    3. Invoke LangChain chain in streaming mode
    4. Accumulate full response
    5. Save turn to history
    6. Yield raw tokens (wrapping into SSE format is done by the API layer)
    """
    # Convert incoming messages to get the current user input
    _, current_input = convert_messages_to_langchain(
        [{"role": m.role.value, "content": m.content} for m in messages]
    )

    # Load stored history (not the incoming messages — we use our server-side store)
    history = get_conversation_history(conversation_id)

    # Format RAG context if available
    context_text = ""
    if rag_context:
        context_text = f"\n\n---\nRelevant context from documents:\n{rag_context}\n---\n"

    # Stream from LangChain chain
    full_response = []
    async for chunk in _chat_chain.astream({
        "history": history,
        "input": current_input,
        "context": context_text,
    }):
        full_response.append(chunk)
        yield chunk

    # Persist the completed turn
    save_turn(conversation_id, current_input, "".join(full_response))
