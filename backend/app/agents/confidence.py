from __future__ import annotations

from typing import Any, Dict, List

from app.config.logging_config import logger


def calculate_confidence(
    intent: str,
    intent_certainty: float,
    retrieved_documents: List[str],
    tool_output: Dict[str, Any],
    tool_success: bool,
    prompt_injection_detected: bool,
    escalation_triggers: List[str],
) -> float:
    """Calculate overall confidence score between 0 and 1.

    Scoring factors:
    - Intent certainty (0-1): How confident the intent classifier was
    - Retrieval quality (0-1): Whether relevant documents were found
    - Tool success (0-1): Whether the selected tool executed successfully
    - Penalties: prompt injection, escalation triggers lower confidence

    Returns:
        Confidence score between 0.0 and 1.0
    """
    score = 0.0
    weights = {
        "intent": 0.35,
        "retrieval": 0.30,
        "tool": 0.25,
        "safety": 0.10,
    }

    intent_score = intent_certainty
    score += intent_score * weights["intent"]

    retrieval_score = _calculate_retrieval_score(retrieved_documents)
    score += retrieval_score * weights["retrieval"]

    tool_score = _calculate_tool_score(tool_output, tool_success)
    score += tool_score * weights["tool"]

    safety_score = _calculate_safety_score(prompt_injection_detected, escalation_triggers)
    score += safety_score * weights["safety"]

    score = max(0.0, min(1.0, score))

    logger.info(
        "Confidence: %.2f (intent=%.2f, retrieval=%.2f, tool=%.2f, safety=%.2f)",
        score,
        intent_score,
        retrieval_score,
        tool_score,
        safety_score,
    )

    return round(score, 2)


def _calculate_retrieval_score(documents: List[str]) -> float:
    """Score based on how many relevant documents were retrieved."""
    if not documents:
        return 0.0
    if len(documents) >= 3:
        return 1.0
    if len(documents) == 2:
        return 0.7
    return 0.4


def _calculate_tool_score(tool_output: Dict[str, Any], tool_success: bool) -> float:
    """Score based on tool execution success."""
    if not tool_output:
        return 0.5
    if "error" in tool_output:
        return 0.1
    if tool_success:
        if tool_output.get("found") or tool_output.get("eligible") or tool_output.get("success"):
            return 1.0
        return 0.7
    return 0.3


def _calculate_safety_score(
    prompt_injection_detected: bool,
    escalation_triggers: List[str],
) -> float:
    """Score based on safety signals."""
    score = 1.0
    if prompt_injection_detected:
        score -= 0.5
    if escalation_triggers:
        score -= 0.3 * min(len(escalation_triggers), 3)
    return max(0.0, score)
