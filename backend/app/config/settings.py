from __future__ import annotations

import json
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Customer Support Resolution Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./data/support_agent.db"

    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o"

    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma_db"
    CHROMA_COLLECTION_NAME: str = "support_knowledge"

    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    RETRIEVAL_TOP_K: int = 5

    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 1024

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    RATE_LIMIT_PER_MINUTE: int = 60
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    SECRET_KEY: str = "change-this-to-a-random-secret-key"

    MAX_GOODWILL_CREDIT: float = 10.00
    REFUND_WINDOW_DAYS: int = 30

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except json.JSONDecodeError:
            return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
