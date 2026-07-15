from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.config.settings import settings
from app.models.order import OrderModel
from app.models.refund import RefundModel


class RefundEligibilityTool:
    """Checks if an order is eligible for a refund."""

    TOOL_NAME = "refund_eligibility"
    DESCRIPTION = "Checks refund eligibility based on refund window, order amount, and company policy."

    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, order_id: str, reason: str = "") -> Dict[str, Any]:
        logger.info("RefundEligibilityTool: Checking order %s", order_id)

        order = self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()
        if not order:
            return {"eligible": False, "reason": "Order not found."}

        existing_refund = (
            self.db.query(RefundModel)
            .filter(
                RefundModel.order_id == order_id,
                RefundModel.status.in_(["pending", "approved"]),
            )
            .first()
        )
        if existing_refund:
            return {
                "eligible": False,
                "reason": "A pending or approved refund already exists for this order.",
                "existing_refund_id": existing_refund.refund_id,
            }

        now = datetime.now(timezone.utc)
        created = order.created_at.replace(tzinfo=timezone.utc) if order.created_at.tzinfo is None else order.created_at
        days_since = (now - created).days

        if days_since > settings.REFUND_WINDOW_DAYS:
            return {
                "eligible": False,
                "reason": f"Order is outside the {settings.REFUND_WINDOW_DAYS}-day refund window. Order age: {days_since} days.",
                "order_age_days": days_since,
            }

        if order.status in ("returned",):
            return {"eligible": False, "reason": "Order has already been returned."}

        return {
            "eligible": True,
            "order_id": order.order_id,
            "order_amount": order.price,
            "days_since_purchase": days_since,
            "refund_window_days": settings.REFUND_WINDOW_DAYS,
        }
