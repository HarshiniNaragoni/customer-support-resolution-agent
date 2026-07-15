from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, String

from app.config.database import Base


class RefundModel(Base):
    __tablename__ = "refunds"

    refund_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    reason = Column(String(512), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    approved_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
