from __future__ import annotations

from typing import Optional

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config.settings import settings
from app.config.logging_config import logger


class EmbeddingProvider:
    """Abstraction layer for embedding models."""

    def __init__(self, model: str | None = None, api_key: str | None = None) -> None:
        self.model = model or settings.OPENAI_EMBEDDING_MODEL
        self.api_key = api_key or settings.OPENAI_API_KEY
        self._embeddings: Optional[OpenAIEmbeddings] = None

    @property
    def embeddings(self) -> OpenAIEmbeddings:
        if self._embeddings is None:
            self._embeddings = OpenAIEmbeddings(
                model=self.model,
                openai_api_key=self.api_key,
            )
            logger.info("Embedding provider initialized: %s", self.model)
        return self._embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.embeddings.embed_query(text)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.embeddings.embed_documents(texts)


class LLMProvider:
    """Abstraction layer for chat models."""

    def __init__(
        self,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        api_key: str | None = None,
    ) -> None:
        self.model = model or settings.OPENAI_CHAT_MODEL
        self.temperature = temperature or settings.LLM_TEMPERATURE
        self.max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        self.api_key = api_key or settings.OPENAI_API_KEY
        self._llm: Optional[ChatOpenAI] = None

    @property
    def llm(self) -> ChatOpenAI:
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=self.api_key,
            )
            logger.info("LLM provider initialized: %s", self.model)
        return self._llm
