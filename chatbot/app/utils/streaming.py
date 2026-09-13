"""
SSE streaming helpers.

Vercel AI SDK's useChat() hook expects responses formatted in the
AI SDK Data Stream Protocol. Each text chunk must be prefixed:
  0:"<escaped_text>"\n

References:
  https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
"""
from __future__ import annotations

import json
from collections.abc import AsyncIterator


def format_chunk(text: str) -> str:
    """
    Format a text token as a Vercel AI SDK data stream chunk.
    The text is JSON-encoded to handle quotes, newlines, etc.

    Example: format_chunk("Hello") → '0:"Hello"\n'
    """
    return f"0:{json.dumps(text)}\n"


def format_finish() -> str:
    """Signal to Vercel AI SDK that the stream is complete."""
    return 'd:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'


async def stream_tokens(
    token_generator: AsyncIterator[str],
) -> AsyncIterator[str]:
    """
    Wrap a raw token generator, yielding Vercel AI SDK formatted chunks.
    Appends the finish signal at the end.
    """
    async for token in token_generator:
        if token:
            yield format_chunk(token)
    yield format_finish()
