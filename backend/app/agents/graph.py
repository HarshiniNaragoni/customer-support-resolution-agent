from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session
from langgraph.graph import END, StateGraph

from app.agents.state import AgentState
from app.agents.nodes import (
    prompt_injection_check_node,
    intent_detection_node,
    make_retrieve_documents_node,
    make_select_tool_node,
    generate_resolution_node,
    human_gate_node,
    finalize_node,
)
from app.config.logging_config import logger


def _route_after_injection_check(state: AgentState) -> str:
    """Route directly to resolution if injection detected, else continue pipeline."""
    if state.prompt_injection_detected:
        return "generate_resolution"
    return "intent_detection"


def build_agent_graph(db: Optional[Session] = None) -> StateGraph:
    """Builds the LangGraph resolution agent graph.

    Pipeline:
        prompt_injection_check → [if injection: generate_resolution]
                               → [else: intent_detection → retrieve_documents → select_tool → generate_resolution]
                               → human_gate → finalize

    Args:
        db: Database session for tool execution. If None, nodes use stubs.
    """
    graph = StateGraph(AgentState)

    # Dedicated first step: prompt injection detection
    graph.add_node("prompt_injection_check", prompt_injection_check_node)
    graph.add_node("intent_detection", intent_detection_node)

    if db:
        graph.add_node("retrieve_documents", make_retrieve_documents_node(db))
        graph.add_node("select_tool", make_select_tool_node(db))
    else:
        graph.add_node("retrieve_documents", make_retrieve_documents_node(None))
        graph.add_node("select_tool", make_select_tool_node(None))

    graph.add_node("generate_resolution", generate_resolution_node)
    graph.add_node("human_gate", human_gate_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("prompt_injection_check")

    # Conditional routing: injection detected → skip RAG/tools → go to resolution
    graph.add_conditional_edges(
        "prompt_injection_check",
        _route_after_injection_check,
        {
            "generate_resolution": "generate_resolution",
            "intent_detection": "intent_detection",
        },
    )

    graph.add_edge("intent_detection", "retrieve_documents")
    graph.add_edge("retrieve_documents", "select_tool")
    graph.add_edge("select_tool", "generate_resolution")
    graph.add_edge("generate_resolution", "human_gate")
    graph.add_edge("human_gate", "finalize")
    graph.add_edge("finalize", END)

    logger.info("Agent graph built successfully.")
    return graph.compile()
