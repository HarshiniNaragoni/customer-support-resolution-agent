from __future__ import annotations

from typing import List, Optional

from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

from app.config.settings import settings
from app.config.logging_config import logger


class VectorStoreManager:
    """Manages the ChromaDB vector store."""

    def __init__(self) -> None:
        self.embeddings = OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )
        self._store: Optional[Chroma] = None

    @property
    def store(self) -> Chroma:
        if self._store is None:
            self._store = Chroma(
                collection_name=settings.CHROMA_COLLECTION_NAME,
                embedding_function=self.embeddings,
                persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            )
            logger.info("ChromaDB initialized: %s", settings.CHROMA_COLLECTION_NAME)
        return self._store

    def add_documents(self, documents: List[Document]) -> None:
        if not documents:
            logger.warning("No documents to add to vector store.")
            return
        self.store.add_documents(documents)
        logger.info("Added %d documents to vector store.", len(documents))

    def similarity_search(
        self,
        query: str,
        k: int | None = None,
        filter_dict: Optional[dict] = None,
    ) -> List[Document]:
        k = k or settings.RETRIEVAL_TOP_K
        results = self.store.similarity_search(query, k=k, filter=filter_dict)
        logger.info("Retrieved %d documents for query: %s", len(results), query[:80])
        return results

    def delete_collection(self) -> None:
        self.store.delete_collection()
        self._store = None
        logger.info("Deleted vector store collection.")

    def get_retriever(self, k: int | None = None):
        k = k or settings.RETRIEVAL_TOP_K
        return self.store.as_retriever(search_kwargs={"k": k})
