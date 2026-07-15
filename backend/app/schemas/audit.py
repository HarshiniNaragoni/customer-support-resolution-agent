from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    ticket_id: str
    intent: Optional[str] = None
    retrieved_documents: Optional[str] = None
    tool_calls: Optional[str] = None
    final_resolution: Optional[str] = None
    confidence: Optional[float] = None
    escalated: bool = False


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
