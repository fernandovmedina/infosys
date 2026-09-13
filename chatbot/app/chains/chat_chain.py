"""
LangChain LCEL chat chain.

Architecture:
  ChatRequest messages
       ↓
  Build ChatPromptTemplate (system + history + human)
       ↓
  ChatOllama (Qwen2.5:7b via Ollama)
       ↓
  StrOutputParser
       ↓
  Async token stream

The chain is intentionally stateless — conversation history is injected
at call time by chat_service.py, which keeps the per-session history.
"""
from __future__ import annotations

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import RunnableSerializable

from app.core.config import settings


SYSTEM_PROMPT = """You are a helpful, knowledgeable, and concise AI assistant powered by Qwen2.5.
You provide accurate, thoughtful responses and format them clearly using Markdown when appropriate.
- Use **bold** for important terms
- Use code blocks with language tags for code snippets
- Use bullet points for lists
- Be direct and helpful"""


def build_chat_chain() -> RunnableSerializable:
    """
    Build and return a LangChain LCEL runnable for chat.

    Input variables:
        history: list[BaseMessage]  — previous turns
        input:   str                — current user message
        context: str                — optional RAG context (empty string if not used)

    Returns:
        An LCEL runnable that streams string tokens.
    """
    llm = ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=0.7,
        streaming=True,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT + "{context}"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()
    return chain


def convert_messages_to_langchain(
    messages: list[dict],
) -> tuple[list, str]:
    """
    Convert API message dicts to LangChain message objects.

    Returns:
        (history, last_user_input) — history excludes the final user message
        so it can be passed separately as `input`.
    """
    from app.models.schemas import MessageRole

    lc_messages = []
    for msg in messages:
        role = msg.get("role") if isinstance(msg, dict) else msg.role
        content = msg.get("content") if isinstance(msg, dict) else msg.content

        if role == MessageRole.user or role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == MessageRole.assistant or role == "assistant":
            lc_messages.append(AIMessage(content=content))
        elif role == MessageRole.system or role == "system":
            lc_messages.append(SystemMessage(content=content))

    # The last message must be from the user
    if not lc_messages or not isinstance(lc_messages[-1], HumanMessage):
        raise ValueError("The last message must be from the user.")

    last_input = lc_messages[-1].content
    history = lc_messages[:-1]

    return history, last_input
