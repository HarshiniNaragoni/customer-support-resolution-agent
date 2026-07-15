from __future__ import annotations

from typing import List

from langchain_core.documents import Document

from app.config.settings import settings
from app.config.logging_config import logger
from app.rag.vector_store import VectorStoreManager


class KnowledgeRetriever:
    """Retrieves relevant documents from the knowledge base."""

    def __init__(self, vector_store_manager: VectorStoreManager | None = None) -> None:
        self.vector_store_manager = vector_store_manager or VectorStoreManager()

    def retrieve(
        self,
        query: str,
        k: int | None = None,
        category: str | None = None,
    ) -> List[Document]:
        k = k or settings.RETRIEVAL_TOP_K
        filter_dict = {"source_category": category} if category else None

        logger.info("Retrieving documents for: %s (top_k=%d)", query[:80], k)

        try:
            results = self.vector_store_manager.similarity_search(
                query=query,
                k=k,
                filter_dict=filter_dict,
            )
            return results
        except Exception as exc:
            logger.error("Retrieval failed: %s", exc)
            return []

    def retrieve_as_context(self, query: str, k: int | None = None) -> str:
        docs = self.retrieve(query, k=k)
        if not docs:
            return "No relevant documents found."
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
