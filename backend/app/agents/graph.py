from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session
from langgraph.graph import END, StateGraph

from app.agents.state import AgentState
from app.agents.nodes import (
    intent_detection_node,
    make_retrieve_documents_node,
    make_select_tool_node,
    generate_resolution_node,
    human_gate_node,
    finalize_node,
)
from app.config.logging_config import logger


def build_agent_graph(db: Optional[Session] = None) -> StateGraph:
    """Builds the LangGraph resolution agent graph.

    Args:
        db: Database session for tool execution. If None, nodes use stubs.
    """
    graph = StateGraph(AgentState)

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

    graph.set_entry_point("intent_detection")

    graph.add_edge("intent_detection", "retrieve_documents")
    graph.add_edge("retrieve_documents", "select_tool")
    graph.add_edge("select_tool", "generate_resolution")
    graph.add_edge("generate_resolution", "human_gate")
    graph.add_edge("human_gate", "finalize")
    graph.add_edge("finalize", END)

    logger.info("Agent graph built successfully.")
    return graph.compile()
