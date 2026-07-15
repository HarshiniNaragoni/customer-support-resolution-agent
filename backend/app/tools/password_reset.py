from __future__ import annotations

from typing import Any, Dict

from app.config.logging_config import logger


class PasswordResetTool:
    """Initiates a password reset for a customer."""

    TOOL_NAME = "password_reset"
    DESCRIPTION = "Initiates a password reset email for a customer account."

    def __init__(self) -> None:
        pass

    def run(self, customer_email: str) -> Dict[str, Any]:
        logger.info("PasswordResetTool: Initiating reset for %s", customer_email)

        # Placeholder: In production, this would send an email via SMTP/SendGrid
        return {
            "success": True,
            "customer_email": customer_email,
            "message": f"A password reset link has been sent to {customer_email}.",
            "expires_in_minutes": 30,
        }
