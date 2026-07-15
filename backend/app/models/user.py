from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String

from app.config.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, nullable=False, index=True)
    role = Column(String(32), nullable=False, default="agent")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
