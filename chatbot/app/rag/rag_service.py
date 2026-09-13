"""
RAG service — document ingestion, embedding, and similarity search.

Architecture:
  Document text
       ↓
  Text splitting (by paragraph / fixed chunk)
       ↓
  Ollama embeddings (same model as chat or nomic-embed-text)
       ↓
  ChromaDB upsert
       ↓
  Similarity search at query time
       ↓
  Top-K context returned to chat chain

NOTE: We use ChromaDB's default embedding function (sentence-transformers)
to avoid requiring a separate embedding model pull. The collection uses
cosine distance. For production, swap to OllamaEmbeddingFunction with
a dedicated embedding model (e.g., nomic-embed-text).
"""
from __future__ import annotations

import uuid

from app.models.schemas import (
    DocumentIngestRequest,
    DocumentIngestResponse,
    RAGSearchResult,
    RAGSearchResponse,
)
from app.rag.chroma_client import get_collection

# NOTE: The embedding function is bound to the collection at creation time
# (in chroma_client.py). ChromaDB v1.x no longer accepts embedding_function
# as a per-query parameter.


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Simple character-based text chunker with overlap.
    For production use LangChain's RecursiveCharacterTextSplitter.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def ingest_document(request: DocumentIngestRequest) -> DocumentIngestResponse:
    """
    Split a document into chunks, embed them, and store in ChromaDB.
    Returns the document_id and number of chunks stored.
    """
    collection = get_collection()

    doc_id = request.document_id or str(uuid.uuid4())
    chunks = _chunk_text(request.content)

    chunk_ids = []
    chunk_texts = []
    chunk_metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{doc_id}_chunk_{i}"
        chunk_ids.append(chunk_id)
        chunk_texts.append(chunk)
        chunk_metadatas.append({
            **request.metadata,
            "document_id": doc_id,
            "chunk_index": i,
            "total_chunks": len(chunks),
        })

    collection.upsert(
        ids=chunk_ids,
        documents=chunk_texts,
        metadatas=chunk_metadatas,
    )

    return DocumentIngestResponse(
        document_id=doc_id,
        chunks_stored=len(chunks),
    )


def search_documents(query: str, n_results: int = 5) -> RAGSearchResponse:
    """
    Perform cosine similarity search in ChromaDB.
    Returns top-K most relevant document chunks.
    """
    collection = get_collection()

    # Check if collection has any documents
    if collection.count() == 0:
        return RAGSearchResponse(results=[], query=query)

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    search_results = []
    if results["documents"] and results["documents"][0]:
        for doc, meta, dist, doc_id in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
            results["ids"][0],
        ):
            search_results.append(RAGSearchResult(
                document_id=meta.get("document_id", doc_id),
                content=doc,
                distance=float(dist),
                metadata=meta,
            ))

    return RAGSearchResponse(results=search_results, query=query)


def build_rag_context(query: str, n_results: int = 3) -> str:
    """
    Search ChromaDB and format top results as a context string
    ready to be injected into the LangChain prompt.
    """
    response = search_documents(query, n_results)
    if not response.results:
        return ""

    context_parts = []
    for i, result in enumerate(response.results, 1):
        context_parts.append(f"[{i}] {result.content}")

    return "\n\n".join(context_parts)
