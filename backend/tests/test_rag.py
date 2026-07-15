from __future__ import annotations

import os
from pathlib import Path

import pytest

from app.rag.splitter import DocumentSplitter
from app.rag.loader import KnowledgeLoader
from langchain_core.documents import Document


class TestDocumentSplitter:
    def test_split_short_document(self):
        splitter = DocumentSplitter(chunk_size=200, chunk_overlap=20)
        docs = [Document(page_content="This is a test document. " * 50, metadata={"source": "test.md"})]
        chunks = splitter.split(docs)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk.page_content) <= 250

    def test_split_empty(self):
        splitter = DocumentSplitter()
        chunks = splitter.split([])
        assert len(chunks) == 0

    def test_split_preserves_metadata(self):
        splitter = DocumentSplitter(chunk_size=100, chunk_overlap=10)
        docs = [Document(page_content="Word " * 100, metadata={"source": "test.md", "category": "faq"})]
        chunks = splitter.split(docs)
        for chunk in chunks:
            assert "source" in chunk.metadata
            assert "category" in chunk.metadata


KB_PATH = str(Path(__file__).resolve().parent.parent / "knowledge_base")
HAS_KB = os.path.isdir(KB_PATH)


class TestKnowledgeLoader:
    @pytest.mark.skipif(not HAS_KB, reason="knowledge_base directory not found")
    def test_load_all(self):
        loader = KnowledgeLoader(knowledge_base_path=KB_PATH)
        docs = loader.load_all()
        assert len(docs) > 0

    @pytest.mark.skipif(not HAS_KB, reason="knowledge_base directory not found")
    def test_load_category(self):
        loader = KnowledgeLoader(knowledge_base_path=KB_PATH)
        docs = loader.load_category("faq")
        assert len(docs) > 0

    def test_load_nonexistent_category(self):
        loader = KnowledgeLoader(knowledge_base_path=KB_PATH)
        docs = loader.load_category("nonexistent")
        assert len(docs) == 0

    @pytest.mark.skipif(not HAS_KB, reason="knowledge_base directory not found")
    def test_metadata_has_source_category(self):
        loader = KnowledgeLoader(knowledge_base_path=KB_PATH)
        docs = loader.load_all()
        for doc in docs:
            assert "source_category" in doc.metadata
