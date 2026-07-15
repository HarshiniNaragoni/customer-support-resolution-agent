from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.models.ticket import TicketModel


class EscalationTool:
    """Escalates a ticket to a human agent."""

    TOOL_NAME = "escalation"
    DESCRIPTION = "Escalates a support ticket to a human agent when the AI cannot resolve it."

    def __init__(self, db: Session) -> None:
        self.db = db

    def run(
        self,
        ticket_id: str,
        reason: str = "Unable to resolve automatically",
        priority: str = "high",
    ) -> Dict[str, Any]:
        logger.info("EscalationTool: Escalating ticket %s", ticket_id)

        ticket = self.db.query(TicketModel).filter(TicketModel.ticket_id == ticket_id).first()

        if not ticket:
            return {"success": False, "error": f"Ticket {ticket_id} not found."}

        ticket.status = "escalated"
        ticket.priority = priority
        ticket.resolution = f"Escalated: {reason}"
        self.db.commit()

        return {
            "success": True,
            "ticket_id": ticket.ticket_id,
            "status": "escalated",
            "reason": reason,
            "message": f"Ticket {ticket_id} has been escalated to a human agent.",
        }
