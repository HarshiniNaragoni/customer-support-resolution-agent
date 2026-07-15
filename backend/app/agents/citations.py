from __future__ import annotations

from typing import Dict, List

from app.config.logging_config import logger


def extract_citations(documents: List[str]) -> List[Dict[str, str]]:
    """Extract citations from retrieved document contents.

    Returns list of dicts with:
        - title: Policy/document title
        - source: Source file name
        - section: Relevant section heading if identifiable
        - content_preview: First 200 chars of the document
    """
    citations: List[Dict[str, str]] = []

    for doc_content in documents:
        citation = _parse_single_citation(doc_content)
        if citation:
            citations.append(citation)

    logger.info("Extracted %d citations from %d documents.", len(citations), len(documents))
    return citations


def _parse_single_citation(content: str) -> Dict[str, str]:
    """Parse a single document into a citation dict."""
    lines = content.strip().split("\n")
    title = ""
    section = ""

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not title:
            title = stripped[2:].strip()
        elif stripped.startswith("## ") and not section:
            section = stripped[3:].strip()

    if not title:
        title = _extract_title_from_content(content)

    content_preview = content[:200].strip()
    if len(content) > 200:
        content_preview += "..."

    return {
        "title": title or "Unknown Document",
        "source": "",
        "section": section or "",
        "content_preview": content_preview,
    }


def _extract_title_from_content(content: str) -> str:
    """Extract a meaningful title from document content."""
    lines = content.strip().split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            words = stripped.split()[:6]
            return " ".join(words)
    return ""


def format_citations_for_response(citations: List[Dict[str, str]]) -> str:
    """Format citations into a readable string for the response."""
    if not citations:
        return ""

    parts = ["\n\n---\n**References:**\n"]
    for i, cite in enumerate(citations, 1):
        title = cite.get("title", "Unknown")
        section = cite.get("section", "")
        ref = f"{i}. {title}"
        if section:
            ref += f" - {section}"
        parts.append(ref)

    return "\n".join(parts)


def format_citations_for_audit(citations: List[Dict[str, str]]) -> str:
    """Format citations as a string for audit log storage."""
    if not citations:
        return "[]"

    import json
    return json.dumps(citations, ensure_ascii=False)
