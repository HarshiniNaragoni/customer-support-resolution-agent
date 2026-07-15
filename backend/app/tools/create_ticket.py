from __future__ import annotations

import uuid
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.models.ticket import TicketModel


class CreateTicketTool:
    """Creates a new support ticket."""

    TOOL_NAME = "create_ticket"
    DESCRIPTION = "Creates a new support ticket for tracking customer issues."

    def __init__(self, db: Session) -> None:
        self.db = db

    def run(
        self,
        customer_name: str,
        customer_email: str,
        message: str,
        ticket_type: str = "general",
        priority: str = "medium",
        assigned_to: str | None = None,
    ) -> Dict[str, Any]:
        logger.info("CreateTicketTool: Creating ticket for %s", customer_email)

        ticket = TicketModel(
            ticket_id=str(uuid.uuid4()),
            customer_name=customer_name,
            customer_email=customer_email,
            ticket_type=ticket_type,
            message=message,
            priority=priority,
            status="open",
            assigned_to=assigned_to,
        )

        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)

        return {
            "success": True,
            "ticket_id": ticket.ticket_id,
            "status": ticket.status,
            "priority": ticket.priority,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        }
