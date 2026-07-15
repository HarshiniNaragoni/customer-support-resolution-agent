from __future__ import annotations

import uuid
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.agents.graph import build_agent_graph
from app.agents.state import AgentState
from app.agents.citations import format_citations_for_audit
from app.config.logging_config import logger
from app.models.audit import AuditLogModel
from app.models.ticket import TicketModel


class AgentService:
    """Orchestrates the LangGraph agent for customer support resolution."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def invoke(
        self,
        customer_message: str,
        customer_email: str = "",
        customer_name: str = "",
        ticket_id: str = "",
    ) -> Dict[str, Any]:
        logger.info("AgentService: Invoking agent for message: %s", customer_message[:100])

        if not ticket_id:
            ticket_id = self._create_ticket(customer_message, customer_email, customer_name)

        initial_state = AgentState(
            ticket_id=ticket_id,
            customer_message=customer_message,
            customer_email=customer_email,
            customer_name=customer_name,
        )

        try:
            graph = build_agent_graph(db=self.db)
            result = graph.invoke(initial_state.model_dump())
            final_state = AgentState(**result)
        except Exception as exc:
            logger.error("Agent graph execution failed: %s", exc)
            final_state = AgentState(
                ticket_id=ticket_id,
                customer_message=customer_message,
                resolution="An error occurred while processing your request. A team member will follow up.",
                escalated=True,
                confidence=0.0,
                escalation_reason="Graph execution error",
            )

        try:
            self._update_ticket(final_state)
        except Exception as exc:
            logger.error("Failed to update ticket: %s", exc)
        try:
            self._create_audit_log(final_state)
        except Exception as exc:
            logger.error("Failed to create audit log: %s", exc)

        return {
            "ticket_id": final_state.ticket_id,
            "resolution": final_state.final_response or final_state.resolution,
            "intent": final_state.intent,
            "confidence": final_state.confidence,
            "escalated": final_state.escalated,
            "tool_used": final_state.selected_tool,
            "citations": final_state.citations,
        }

    def _create_ticket(
        self,
        message: str,
        email: str,
        name: str,
    ) -> str:
        ticket_id = str(uuid.uuid4())
        ticket = TicketModel(
            ticket_id=ticket_id,
            customer_name=name or "Unknown",
            customer_email=email or "unknown@example.com",
            ticket_type="general",
            message=message,
            priority="medium",
            status="open",
        )
        self.db.add(ticket)
        self.db.commit()
        logger.info("Created ticket %s for agent invocation.", ticket_id)
        return ticket_id

    def _update_ticket(self, state: AgentState) -> None:
        ticket = self.db.query(TicketModel).filter(
            TicketModel.ticket_id == state.ticket_id
        ).first()
        if not ticket:
            logger.warning("Ticket %s not found for update.", state.ticket_id)
            return

        ticket.status = "escalated" if state.escalated else "resolved"
        ticket.confidence = state.confidence
        ticket.resolution = state.final_response or state.resolution
        if state.escalation_reason:
            ticket.resolution = f"[Escalated: {state.escalation_reason}] {ticket.resolution or ''}"
        self.db.commit()
        logger.info("Ticket %s updated with resolution.", state.ticket_id)

    def _create_audit_log(self, state: AgentState) -> None:
        tool_calls_info = state.selected_tool
        if state.tool_output:
            tool_calls_info = f"{state.selected_tool}: {str(state.tool_output)[:200]}"

        log = AuditLogModel(
            id=str(uuid.uuid4()),
            ticket_id=state.ticket_id,
            intent=state.intent,
            retrieved_documents=format_citations_for_audit(state.citations),
            tool_calls=tool_calls_info,
            final_resolution=state.final_response or state.resolution,
            confidence=state.confidence,
            escalated=state.escalated,
        )
        self.db.add(log)
        self.db.commit()
        logger.info("Audit log created for ticket %s.", state.ticket_id)
