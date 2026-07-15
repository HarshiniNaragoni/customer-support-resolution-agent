from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OrderBase(BaseModel):
    customer_name: str
    email: str
    product_name: str
    status: str = "pending"
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[str] = None
    price: float = 0.0


class OrderCreate(OrderBase):
    pass


class OrderResponse(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    created_at: datetime
