from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.tools.order_lookup import OrderLookupTool
from app.tools.refund_eligibility import RefundEligibilityTool
from app.tools.apply_credit import ApplyCreditTool
from app.tools.create_ticket import CreateTicketTool
from app.tools.escalation import EscalationTool
from app.tools.password_reset import PasswordResetTool

INTENT_TOOL_MAP: Dict[str, str] = {
    "order_status": "order_lookup",
    "order_issue": "order_lookup",
    "refund_request": "refund_eligibility",
    "refund": "refund_eligibility",
    "password_reset": "password_reset",
    "account_help": "create_ticket",
    "credit": "apply_credit",
    "goodwill": "apply_credit",
    "escalation": "escalation",
    "escalate": "escalation",
    "ticket": "create_ticket",
}

NO_TOOL_INTENTS = {"legal_issue", "account_closure", "out_of_scope", "ambiguous"}


def _build_tool_registry(db: Session) -> Dict[str, Any]:
    return {
        "order_lookup": OrderLookupTool(db),
        "refund_eligibility": RefundEligibilityTool(db),
        "apply_credit": ApplyCreditTool(),
        "create_ticket": CreateTicketTool(db),
        "escalation": EscalationTool(db),
        "password_reset": PasswordResetTool(),
    }


def get_tool_for_intent(intent: str, db: Session) -> tuple[str, Any] | None:
    if intent in NO_TOOL_INTENTS:
        logger.info("Intent '%s' has no associated tool.", intent)
        return None

    tool_name = INTENT_TOOL_MAP.get(intent)
    if not tool_name:
        logger.info("No tool mapped for intent: %s", intent)
        return None

    registry = _build_tool_registry(db)
    tool = registry.get(tool_name)
    if not tool:
        logger.warning("Tool '%s' not found in registry.", tool_name)
        return None

    logger.info("Resolved intent '%s' -> tool '%s'", intent, tool_name)
    return (tool_name, tool)


def execute_tool(tool_name: str, tool_input: Dict[str, Any], db: Session) -> Dict[str, Any]:
    registry = _build_tool_registry(db)
    tool = registry.get(tool_name)
    if not tool:
        logger.warning("Tool '%s' not found in registry.", tool_name)
        return {"error": f"Tool '{tool_name}' not available."}

    try:
        result = tool.run(**tool_input)
        logger.info("Tool '%s' executed successfully.", tool_name)
        return result
    except Exception as exc:
        logger.error("Tool '%s' execution failed: %s", tool_name, exc)
        return {"error": str(exc)}
