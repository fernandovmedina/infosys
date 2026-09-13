"""
Central configuration loaded from environment variables.
Uses pydantic-settings so every value can be overridden via .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"

    # ChromaDB
    chroma_path: str = "./chroma_db"
    chroma_collection: str = "chatbot_documents"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Conversation memory
    max_history_turns: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Singleton — import this everywhere instead of instantiating directly
settings = Settings()
