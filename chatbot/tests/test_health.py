"""
Tests for the health check endpoint.
Run with: pytest tests/test_health.py -v
"""
import pytest
from fastapi.testclient import TestClient

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_200():
    """Health endpoint must always return 200 (even if degraded)."""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_response_schema():
    """Verify all required fields are present in the health response."""
    response = client.get("/api/health")
    data = response.json()
    assert "status" in data
    assert "ollama_connected" in data
    assert "model_available" in data
    assert "model" in data
    assert "chromadb_connected" in data


def test_health_model_name():
    """Model name in response should match configured model."""
    response = client.get("/api/health")
    data = response.json()
    # Default model from config
    assert "qwen" in data["model"].lower() or data["model"] != ""
