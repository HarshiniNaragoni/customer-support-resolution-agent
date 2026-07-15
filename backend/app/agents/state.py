from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class AgentState(BaseModel):
    """State that flows through the LangGraph agent."""

    ticket_id: str = ""
    customer_message: str = ""
    customer_email: str = ""
    customer_name: str = ""

    intent: str = ""
    confidence: float = 0.0
    intent_reasoning: str = ""

    retrieved_documents: List[str] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)

    selected_tool: str = ""
    tool_input: Dict[str, Any] = Field(default_factory=dict)
    tool_output: Dict[str, Any] = Field(default_factory=dict)

    resolution: str = ""
    final_response: str = ""

    escalated: bool = False
    escalation_reason: str = ""
    human_gate_passed: bool = False

    prompt_injection_detected: bool = False
    injection_patterns: List[str] = Field(default_factory=list)

    history: List[Dict[str, Any]] = Field(default_factory=list)
