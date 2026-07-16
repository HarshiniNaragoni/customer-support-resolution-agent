from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.schemas.health import HealthResponse
from app.schemas.order import OrderResponse
from app.schemas.refund import RefundCreate, RefundResponse
from app.schemas.policy import PolicyResponse
from app.schemas.audit import AuditLogResponse
from app.schemas.agent import AgentInvokeRequest, AgentInvokeResponse
from app.services.crud import TicketService, OrderService, RefundService, PolicyService, AuditService
from app.services.agent_service import AgentService
from app.config.settings import settings
from app.config.logging_config import logger

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        database=db_status,
    )


@router.post("/tickets", response_model=TicketResponse, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db)):
    service = TicketService(db)
    ticket = service.create(data)
    return ticket


@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    service = TicketService(db)
    return service.get_all(skip=skip, limit=limit)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    service = TicketService(db)
    ticket = service.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return ticket


@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: str, data: TicketUpdate, db: Session = Depends(get_db)):
    service = TicketService(db)
    ticket = service.update(ticket_id, data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return ticket


@router.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    service = TicketService(db)
    deleted = service.delete(ticket_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return None


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    service = OrderService(db)
    return service.get_all(skip=skip, limit=limit)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@router.post("/refunds", response_model=RefundResponse, status_code=201)
def create_refund(data: RefundCreate, db: Session = Depends(get_db)):
    service = RefundService(db)
    refund = service.create(data)
    return refund


@router.get("/policies", response_model=list[PolicyResponse])
def list_policies(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    service = PolicyService(db)
    return service.get_all(skip=skip, limit=limit)


@router.get("/audit", response_model=list[AuditLogResponse])
def list_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    service = AuditService(db)
    return service.get_all(skip=skip, limit=limit)


@router.post("/agent/invoke", response_model=AgentInvokeResponse)
def invoke_agent(data: AgentInvokeRequest, db: Session = Depends(get_db)):
    service = AgentService(db)
    try:
        result = service.invoke(
            customer_message=data.customer_message,
            customer_email=data.customer_email,
            customer_name=data.customer_name,
            ticket_id=data.ticket_id,
            session_id=data.session_id,
        )
    except Exception as exc:
        logger.error("Agent invocation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Agent processing failed.")
    return AgentInvokeResponse(**result)
