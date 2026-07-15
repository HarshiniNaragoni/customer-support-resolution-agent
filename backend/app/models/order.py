from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, String

from app.config.database import Base


class OrderModel(Base):
    __tablename__ = "orders"

    order_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False, index=True)
    product_name = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    carrier = Column(String(64), nullable=True)
    tracking_number = Column(String(128), nullable=True)
    estimated_delivery = Column(String(64), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
