from __future__ import annotations

from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config.settings import settings
from app.config.logging_config import logger


class DocumentSplitter:
    """Splits documents into chunks for embedding."""

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> None:
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def split(self, documents: List[Document]) -> List[Document]:
        chunks = self.splitter.split_documents(documents)
        logger.info(
            "Split %d documents into %d chunks (size=%d, overlap=%d)",
            len(documents),
            len(chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return chunks
