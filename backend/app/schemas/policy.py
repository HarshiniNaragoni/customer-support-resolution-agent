from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PolicyBase(BaseModel):
    title: str
    category: str
    content: str


class PolicyCreate(PolicyBase):
    pass


class PolicyResponse(PolicyBase):
    model_config = ConfigDict(from_attributes=True)

    policy_id: str
    created_at: datetime
