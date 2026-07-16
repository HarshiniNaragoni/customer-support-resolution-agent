from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session
from langgraph.graph import END, StateGraph

from app.agents.state import AgentState
from app.agents.nodes import (
    prompt_injection_check_node,
    conversational_check_node,
    intent_detection_node,
    reasoning_analysis_node,
    make_retrieve_documents_node,
    make_llm_tool_selection_node,
    react_reasoning_node,
    human_gate_node,
    finalize_node,
)
from app.config.logging_config import logger


def _route_after_injection_check(state: AgentState) -> str:
    """Route to conversational check (or react_reasoning if injection detected)."""
    if state.prompt_injection_detected:
        return "react_reasoning"
    return "conversational_check"


def _route_after_conversational_check(state: AgentState) -> str:
    """If conversational input matched, go to finalize directly (skip pipeline)."""
    if state.resolution:
        return "finalize"
    return "intent_detection"


def build_agent_graph(db: Optional[Session] = None) -> StateGraph:
    """Builds the LangGraph resolution agent graph.

    Pipeline:
        prompt_injection_check → [if injection: react_reasoning]
                               → [else: conversational_check]
                                  → [if conversational: finalize]
                                  → [else: intent_detection → reasoning_analysis
                                     → retrieve_documents → llm_tool_selection → react_reasoning]
                               → human_gate → finalize

    Args:
        db: Database session for tool execution. If None, nodes use stubs.
    """
    graph = StateGraph(AgentState)

    graph.add_node("prompt_injection_check", prompt_injection_check_node)
    graph.add_node("conversational_check", conversational_check_node)
    graph.add_node("intent_detection", intent_detection_node)
    graph.add_node("reasoning_analysis", reasoning_analysis_node)

    if db:
        graph.add_node("retrieve_documents", make_retrieve_documents_node(db))
        graph.add_node("llm_tool_selection", make_llm_tool_selection_node(db))
    else:
        graph.add_node("retrieve_documents", make_retrieve_documents_node(None))
        graph.add_node("llm_tool_selection", make_llm_tool_selection_node(None))

    graph.add_node("react_reasoning", react_reasoning_node)
    graph.add_node("human_gate", human_gate_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("prompt_injection_check")

    graph.add_conditional_edges(
        "prompt_injection_check",
        _route_after_injection_check,
        {
            "react_reasoning": "react_reasoning",
            "conversational_check": "conversational_check",
        },
    )

    graph.add_conditional_edges(
        "conversational_check",
        _route_after_conversational_check,
        {
            "finalize": "finalize",
            "intent_detection": "intent_detection",
        },
    )

    graph.add_edge("intent_detection", "reasoning_analysis")
    graph.add_edge("reasoning_analysis", "retrieve_documents")
    graph.add_edge("retrieve_documents", "llm_tool_selection")
    graph.add_edge("llm_tool_selection", "react_reasoning")
    graph.add_edge("react_reasoning", "human_gate")
    graph.add_edge("human_gate", "finalize")
    graph.add_edge("finalize", END)

    logger.info("Agent graph built successfully (with conversational check + LLM pipeline).")
    return graph.compile()
