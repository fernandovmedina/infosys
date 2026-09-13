"""
Health check endpoint — GET /api/health

Verifies:
  - Ollama server reachability
  - Qwen2.5:7b model availability
  - ChromaDB connectivity
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.models.schemas import HealthResponse
from app.rag.chroma_client import health_check as chroma_health_check

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check the health of all backend dependencies."""
    ollama_connected = False
    model_available = False

    # Check Ollama connectivity and model availability
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Check if Ollama server is running
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                ollama_connected = True
                tags_data = resp.json()
                available_models = [m["name"] for m in tags_data.get("models", [])]
                # Check exact match or prefix match (e.g., "qwen2.5:7b" in "qwen2.5:7b-q4_K_M")
                model_available = any(
                    settings.ollama_model in model_name or model_name.startswith(settings.ollama_model.split(":")[0])
                    for model_name in available_models
                )
    except Exception:
        pass

    # Check ChromaDB
    chroma_ok = chroma_health_check()

    return HealthResponse(
        status="ok" if ollama_connected else "degraded",
        ollama_connected=ollama_connected,
        model_available=model_available,
        model=settings.ollama_model,
        chromadb_connected=chroma_ok,
    )
