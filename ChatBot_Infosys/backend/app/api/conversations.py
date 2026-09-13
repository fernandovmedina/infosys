"""
Conversation management endpoints.

GET    /api/conversations           — list all conversations
POST   /api/conversations           — create new conversation
GET    /api/conversations/{id}      — get conversation with messages
DELETE /api/conversations/{id}      — delete a conversation
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ConversationSummary,
    ConversationDetail,
    CreateConversationRequest,
)
from app.services.chat_service import (
    get_or_create_conversation,
    list_conversations,
    get_conversation_detail,
    delete_conversation,
    _conversations,
)

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationSummary])
async def get_conversations() -> list[ConversationSummary]:
    """List all conversations ordered by most recently updated."""
    convs = list_conversations()
    return [ConversationSummary(**c) for c in convs]


@router.post("/conversations", response_model=ConversationSummary)
async def create_conversation(body: CreateConversationRequest) -> ConversationSummary:
    """Create a new conversation session."""
    conv_id = get_or_create_conversation(None)
    _conversations[conv_id]["title"] = body.title
    detail = get_conversation_detail(conv_id)
    return ConversationSummary(
        id=conv_id,
        title=detail["title"],
        message_count=detail["message_count"],
        created_at=detail["created_at"],
        updated_at=detail["updated_at"],
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str) -> ConversationDetail:
    """Get a conversation including its full message history."""
    detail = get_conversation_detail(conversation_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return ConversationDetail(
        id=detail["id"],
        title=detail["title"],
        message_count=detail["message_count"],
        created_at=detail["created_at"],
        updated_at=detail["updated_at"],
        messages=detail["messages"],
    )


@router.delete("/conversations/{conversation_id}")
async def remove_conversation(conversation_id: str) -> dict:
    """Delete a conversation and its history."""
    deleted = delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"deleted": conversation_id}
