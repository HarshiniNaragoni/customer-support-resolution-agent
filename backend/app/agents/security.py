from __future__ import annotations

import re
from typing import List, Tuple

from app.agents.prompts import (
    PROMPT_INJECTION_PATTERNS,
    PROMPT_INJECTION_REGEX_PATTERNS,
    ESCALATION_TRIGGERS,
)
from app.config.logging_config import logger


def detect_prompt_injection(message: str) -> Tuple[bool, List[str]]:
    """Detect prompt injection attempts in customer messages.

    Uses both exact substring matching and regex patterns to catch
    obfuscated or varied injection attempts.

    Returns:
        Tuple of (is_injection_detected, list_of_matched_patterns)
    """
    message_lower = message.lower().strip()
    matched: List[str] = []

    # Exact substring matching
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.lower() in message_lower:
            matched.append(pattern)

    # Regex fuzzy matching (catches variations not caught by substrings)
    for regex_pattern in PROMPT_INJECTION_REGEX_PATTERNS:
        if re.search(regex_pattern, message_lower):
            matched.append(f"regex:{regex_pattern}")

    # Deduplicate while preserving order
    seen = set()
    unique_matched = []
    for m in matched:
        if m not in seen:
            seen.add(m)
            unique_matched.append(m)

    if unique_matched:
        logger.warning(
            "Prompt injection detected: %d patterns matched: %s",
            len(unique_matched),
            unique_matched,
        )
        return True, unique_matched

    return False, []


def detect_escalation_triggers(message: str) -> Tuple[bool, List[str]]:
    """Detect messages that require human escalation.

    Returns:
        Tuple of (should_escalate, list_of_matched_triggers)
    """
    message_lower = message.lower().strip()
    matched: List[str] = []

    for trigger in ESCALATION_TRIGGERS:
        if trigger.lower() in message_lower:
            matched.append(trigger)

    if matched:
        logger.info(
            "Escalation triggers detected: %d matches: %s",
            len(matched),
            matched,
        )
        return True, matched

    return False, []


def is_out_of_scope(message: str) -> bool:
    """Detect messages that are outside customer support scope."""
    out_of_scope_signals = [
        r"medical\s+(advice|diagnosis|treatment)",
        r"financial\s+(advice|planning|consulting)",
        r"\b(code|coding|programming|debug)\b",
        r"(competitor|alternative)\s+(comparison|vs|versus)",
        r"how\s+(do|can)\s+(i|we)\s+(build|create|develop)",
        r"translate\s+(this|that|it|from)",
        r"write\s+(a|an|me)\s+(essay|story|poem|article)",
    ]

    message_lower = message.lower()
    for pattern in out_of_scope_signals:
        if re.search(pattern, message_lower):
            return True

    return False
