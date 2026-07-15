from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TicketBase(BaseModel):
    customer_name: str
    customer_email: str
    ticket_type: str = "general"
    message: str
    priority: str = "medium"


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    confidence: Optional[float] = None


class TicketResponse(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: str
    status: str
    confidence: Optional[float] = None
    resolution: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
