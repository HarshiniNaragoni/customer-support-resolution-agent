from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.models.order import OrderModel
from app.models.refund import RefundModel
from app.models.ticket import TicketModel
from app.models.audit import AuditLogModel
from app.models.policy import PolicyModel
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.schemas.refund import RefundCreate


class TicketService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: TicketCreate) -> TicketModel:
        ticket = TicketModel(
            ticket_id=str(uuid.uuid4()),
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            ticket_type=data.ticket_type,
            message=data.message,
            priority=data.priority,
            status="open",
        )
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        logger.info("Created ticket %s", ticket.ticket_id)
        return ticket

    def get_by_id(self, ticket_id: str) -> Optional[TicketModel]:
        return self.db.query(TicketModel).filter(TicketModel.ticket_id == ticket_id).first()

    def get_all(self, skip: int = 0, limit: int = 50) -> List[TicketModel]:
        return self.db.query(TicketModel).order_by(TicketModel.created_at.desc()).offset(skip).limit(limit).all()

    def update(self, ticket_id: str, data: TicketUpdate) -> Optional[TicketModel]:
        ticket = self.get_by_id(ticket_id)
        if not ticket:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ticket, field, value)
        self.db.commit()
        self.db.refresh(ticket)
        logger.info("Updated ticket %s", ticket_id)
        return ticket

    def delete(self, ticket_id: str) -> bool:
        ticket = self.get_by_id(ticket_id)
        if not ticket:
            return False
        self.db.delete(ticket)
        self.db.commit()
        logger.info("Deleted ticket %s", ticket_id)
        return True


class OrderService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, order_id: str) -> Optional[OrderModel]:
        return self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()

    def get_all(self, skip: int = 0, limit: int = 50) -> List[OrderModel]:
        return self.db.query(OrderModel).order_by(OrderModel.created_at.desc()).offset(skip).limit(limit).all()


class RefundService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: RefundCreate) -> RefundModel:
        refund = RefundModel(
            refund_id=str(uuid.uuid4()),
            order_id=data.order_id,
            amount=data.amount,
            reason=data.reason,
            status="pending",
        )
        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)
        logger.info("Created refund %s for order %s", refund.refund_id, data.order_id)
        return refund

    def get_all(self, skip: int = 0, limit: int = 50) -> List[RefundModel]:
        return self.db.query(RefundModel).order_by(RefundModel.created_at.desc()).offset(skip).limit(limit).all()


class PolicyService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 50) -> List[PolicyModel]:
        return self.db.query(PolicyModel).order_by(PolicyModel.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_category(self, category: str) -> List[PolicyModel]:
        return self.db.query(PolicyModel).filter(PolicyModel.category == category).all()


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: Dict[str, Any]) -> AuditLogModel:
        log = AuditLogModel(
            id=str(uuid.uuid4()),
            ticket_id=data.get("ticket_id", ""),
            intent=data.get("intent"),
            retrieved_documents=data.get("retrieved_documents"),
            tool_calls=data.get("tool_calls"),
            final_resolution=data.get("final_resolution"),
            confidence=data.get("confidence"),
            escalated=data.get("escalated", False),
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_all(self, skip: int = 0, limit: int = 50) -> List[AuditLogModel]:
        return self.db.query(AuditLogModel).order_by(AuditLogModel.created_at.desc()).offset(skip).limit(limit).all()
