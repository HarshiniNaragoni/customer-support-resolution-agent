from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, String, Text

from app.config.database import Base


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), nullable=False, index=True)
    intent = Column(String(128), nullable=True)
    retrieved_documents = Column(Text, nullable=True)
    tool_calls = Column(Text, nullable=True)
    final_resolution = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
