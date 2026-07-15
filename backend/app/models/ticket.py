from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, String, Text

from app.config.database import Base


class TicketModel(Base):
    __tablename__ = "tickets"

    ticket_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = Column(String(128), nullable=False)
    customer_email = Column(String(256), nullable=False, index=True)
    ticket_type = Column(String(64), nullable=False, default="general")
    message = Column(Text, nullable=False)
    priority = Column(String(16), nullable=False, default="medium")
    status = Column(String(32), nullable=False, default="open")
    confidence = Column(Float, nullable=True)
    resolution = Column(Text, nullable=True)
    assigned_to = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
