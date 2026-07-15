from __future__ import annotations

from app.tools.order_lookup import OrderLookupTool
from app.tools.refund_eligibility import RefundEligibilityTool
from app.tools.apply_credit import ApplyCreditTool
from app.tools.create_ticket import CreateTicketTool
from app.tools.escalation import EscalationTool
from app.tools.password_reset import PasswordResetTool
from app.tools.registry import get_tool_for_intent, execute_tool, INTENT_TOOL_MAP


class TestOrderLookupTool:
    def test_found(self, db_session, sample_order):
        tool = OrderLookupTool(db_session)
        result = tool.run(sample_order.order_id)
        assert result["found"] is True
        assert result["order_id"] == sample_order.order_id
        assert result["status"] == "shipped"
        assert result["carrier"] == "FedEx"

    def test_not_found(self, db_session):
        tool = OrderLookupTool(db_session)
        result = tool.run("nonexistent-id")
        assert result["found"] is False
        assert "error" in result


class TestRefundEligibilityTool:
    def test_eligible(self, db_session, sample_order):
        tool = RefundEligibilityTool(db_session)
        result = tool.run(sample_order.order_id, "Changed my mind")
        assert result["eligible"] is True
        assert "order_amount" in result

    def test_order_not_found(self, db_session):
        tool = RefundEligibilityTool(db_session)
        result = tool.run("nonexistent-id")
        assert result["eligible"] is False
        assert "not found" in result["reason"].lower()


class TestApplyCreditTool:
    def test_valid_credit(self):
        tool = ApplyCreditTool()
        result = tool.run("test@example.com", 5.0, "Goodwill")
        assert result["success"] is True
        assert result["amount"] == 5.0

    def test_exceeds_maximum(self):
        tool = ApplyCreditTool()
        result = tool.run("test@example.com", 100.0, "Too much")
        assert result["success"] is False
        assert "exceeds" in result["error"].lower()

    def test_negative_amount(self):
        tool = ApplyCreditTool()
        result = tool.run("test@example.com", -1.0)
        assert result["success"] is False


class TestCreateTicketTool:
    def test_create(self, db_session):
        tool = CreateTicketTool(db_session)
        result = tool.run("Test User", "test@example.com", "Help needed")
        assert result["success"] is True
        assert "ticket_id" in result
        assert result["status"] == "open"


class TestEscalationTool:
    def test_escalate(self, db_session, sample_ticket):
        tool = EscalationTool(db_session)
        result = tool.run(sample_ticket.ticket_id, "Complex issue")
        assert result["success"] is True
        assert result["status"] == "escalated"

    def test_ticket_not_found(self, db_session):
        tool = EscalationTool(db_session)
        result = tool.run("nonexistent-id")
        assert result["success"] is False


class TestPasswordResetTool:
    def test_reset(self):
        tool = PasswordResetTool()
        result = tool.run("test@example.com")
        assert result["success"] is True
        assert "expires_in_minutes" in result


class TestToolRegistry:
    def test_intent_tool_mapping(self):
        assert "order_issue" in INTENT_TOOL_MAP
        assert "refund_request" in INTENT_TOOL_MAP
        assert "password_reset" in INTENT_TOOL_MAP
        assert "escalation" in INTENT_TOOL_MAP

    def test_get_tool_for_intent(self, db_session):
        result = get_tool_for_intent("order_issue", db_session)
        assert result is not None
        tool_name, tool = result
        assert tool_name == "order_lookup"

    def test_unknown_intent(self, db_session):
        result = get_tool_for_intent("unknown_intent", db_session)
        assert result is None

    def test_execute_tool(self, db_session, sample_order):
        result = execute_tool("order_lookup", {"order_id": sample_order.order_id}, db_session)
        assert result["found"] is True

    def test_execute_unknown_tool(self, db_session):
        result = execute_tool("nonexistent_tool", {}, db_session)
        assert "error" in result
