from __future__ import annotations

from pathlib import Path
from typing import List

from langchain_core.documents import Document
from langchain_community.document_loaders import TextLoader, DirectoryLoader

from app.config.logging_config import logger


class KnowledgeLoader:
    """Loads documents from the knowledge_base directory."""

    def __init__(self, knowledge_base_path: str = "./knowledge_base") -> None:
        self.base_path = Path(knowledge_base_path)

    def load_all(self) -> List[Document]:
        documents: List[Document] = []

        if not self.base_path.exists():
            logger.warning("Knowledge base directory not found: %s", self.base_path)
            return documents

        subdirs = [d for d in self.base_path.iterdir() if d.is_dir()]

        for subdir in subdirs:
            try:
                loader = DirectoryLoader(
                    str(subdir),
                    glob="**/*.md",
                    loader_cls=TextLoader,
                    loader_kwargs={"encoding": "utf-8"},
                    show_progress=False,
                )
                docs = loader.load()
                for doc in docs:
                    doc.metadata["source_category"] = subdir.name
                documents.extend(docs)
                logger.info("Loaded %d documents from %s", len(docs), subdir.name)
            except Exception as exc:
                logger.error("Error loading from %s: %s", subdir.name, exc)

        logger.info("Total documents loaded: %d", len(documents))
        return documents

    def load_category(self, category: str) -> List[Document]:
        category_path = self.base_path / category
        if not category_path.exists():
            logger.warning("Category directory not found: %s", category_path)
            return []

        loader = DirectoryLoader(
            str(category_path),
            glob="**/*.md",
            loader_cls=TextLoader,
            loader_kwargs={"encoding": "utf-8"},
            show_progress=False,
        )
        docs = loader.load()
        for doc in docs:
            doc.metadata["source_category"] = category
        return docs
