from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class AgentInvokeRequest(BaseModel):
    customer_message: str = Field(..., min_length=1, max_length=5000, description="Customer's message")
    customer_email: str = Field(default="", max_length=255)
    customer_name: str = Field(default="", max_length=255)
    ticket_id: str = Field(default="", description="Existing ticket ID to associate with")
    session_id: str = Field(default="", description="Conversation session ID for multi-turn memory")


class AgentInvokeResponse(BaseModel):
    ticket_id: str
    resolution: str
    intent: str
    confidence: float
    escalated: bool
    tool_used: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_injection_detected: bool = False
    injection_patterns: List[str] = Field(default_factory=list)
    reasoning_steps: List[str] = Field(default_factory=list)
    tool_selection_reasoning: str = ""
    needs_clarification: bool = False
    session_id: str = ""
