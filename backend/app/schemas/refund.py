from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RefundBase(BaseModel):
    order_id: str
    amount: float
    reason: str


class RefundCreate(RefundBase):
    pass


class RefundResponse(RefundBase):
    model_config = ConfigDict(from_attributes=True)

    refund_id: str
    status: str
    approved_by: Optional[str] = None
    created_at: datetime
