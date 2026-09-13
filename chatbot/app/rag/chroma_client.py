"""
ChromaDB client — initializes the persistent vector database client
and provides access to the chatbot documents collection.

Updated for ChromaDB v1.x API where the embedding function is bound
to the collection at creation time, not passed per-query.
"""
from __future__ import annotations

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

from app.core.config import settings

# Module-level singletons
_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None

# Embedding function bound at collection level
_embed_fn = embedding_functions.DefaultEmbeddingFunction()


def get_chroma_client() -> chromadb.PersistentClient:
    """Return the singleton ChromaDB persistent client."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.chroma_path,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )
    return _client


def get_collection() -> chromadb.Collection:
    """
    Return the singleton chatbot documents collection.
    Creates it with the default embedding function and cosine distance
    if it doesn't exist. In ChromaDB v1.x the embedding function is
    bound at collection level.
    """
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=settings.chroma_collection,
            embedding_function=_embed_fn,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def health_check() -> bool:
    """Return True if ChromaDB is accessible."""
    try:
        client = get_chroma_client()
        client.heartbeat()
        return True
    except Exception:
        return False
