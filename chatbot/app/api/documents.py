"""
Document ingestion and RAG search endpoints.

POST /api/documents           — ingest a document into ChromaDB
GET  /api/rag/search          — similarity search in ChromaDB
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    DocumentIngestRequest,
    DocumentIngestResponse,
    RAGSearchRequest,
    RAGSearchResponse,
)
from app.rag.rag_service import ingest_document, search_documents

router = APIRouter()


@router.post("/documents", response_model=DocumentIngestResponse)
async def ingest(request: DocumentIngestRequest) -> DocumentIngestResponse:
    """
    Ingest a document into ChromaDB.
    The document is split into chunks, embedded, and stored for similarity search.
    """
    try:
        result = ingest_document(request)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest document: {str(exc)}",
        ) from exc


@router.post("/rag/search", response_model=RAGSearchResponse)
async def rag_search(request: RAGSearchRequest) -> RAGSearchResponse:
    """
    Perform a similarity search in ChromaDB.
    Returns the most relevant document chunks for the given query.
    """
    try:
        return search_documents(query=request.query, n_results=request.n_results)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(exc)}",
        ) from exc
