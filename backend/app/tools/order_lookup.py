from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.models.order import OrderModel


class OrderLookupTool:
    """Looks up order details by order ID."""

    TOOL_NAME = "order_lookup"
    DESCRIPTION = "Retrieves order status, carrier, tracking number, and estimated delivery for a given order ID."

    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, order_id: str) -> Dict[str, Any]:
        logger.info("OrderLookupTool: Looking up order %s", order_id)

        order = self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()

        if not order:
            logger.warning("Order not found: %s", order_id)
            return {
                "found": False,
                "error": f"Order {order_id} not found.",
            }

        return {
            "found": True,
            "order_id": order.order_id,
            "customer_name": order.customer_name,
            "product_name": order.product_name,
            "status": order.status,
            "carrier": order.carrier,
            "tracking_number": order.tracking_number,
            "estimated_delivery": order.estimated_delivery,
            "price": order.price,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }
