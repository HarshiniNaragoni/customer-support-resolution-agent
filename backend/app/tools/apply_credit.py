from __future__ import annotations

from typing import Any, Dict

from app.config.logging_config import logger
from app.config.settings import settings


class ApplyCreditTool:
    """Applies a goodwill credit to a customer's account."""

    TOOL_NAME = "apply_credit"
    DESCRIPTION = f"Applies a goodwill credit up to ${settings.MAX_GOODWILL_CREDIT:.2f} to a customer account."

    def __init__(self) -> None:
        self.max_credit = settings.MAX_GOODWILL_CREDIT

    def run(self, customer_email: str, amount: float, reason: str = "") -> Dict[str, Any]:
        logger.info(
            "ApplyCreditTool: Applying $%.2f credit to %s",
            amount,
            customer_email,
        )

        if amount <= 0:
            return {"success": False, "error": "Credit amount must be positive."}

        if amount > self.max_credit:
            return {
                "success": False,
                "error": f"Credit amount exceeds maximum of ${self.max_credit:.2f}.",
                "max_allowed": self.max_credit,
            }

        # Placeholder: In production, this would call a billing/payment service
        return {
            "success": True,
            "customer_email": customer_email,
            "amount": amount,
            "reason": reason,
            "message": f"Goodwill credit of ${amount:.2f} applied to {customer_email}.",
        }
