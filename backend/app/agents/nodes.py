from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.agents.prompts import (
    INTENT_CLASSIFICATION_PROMPT,
    RESOLUTION_PROMPT,
    OUT_OF_SCOPE_RESPONSE,
    AMBIGUOUS_RESPONSE,
    NO_POLICY_RESPONSE,
    INJECTION_SAFE_RESPONSE,
)
from app.agents.security import (
    detect_prompt_injection,
    detect_escalation_triggers,
    is_out_of_scope,
)
from app.agents.confidence import calculate_confidence
from app.agents.citations import extract_citations, format_citations_for_response
from app.config.logging_config import logger
from app.config.settings import settings
from app.tools.registry import get_tool_for_intent, execute_tool


def _get_llm():
    """Get LLM instance, returns None if unavailable."""
    try:
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-your-api-key-here":
            return None
        from app.rag.embeddings import LLMProvider
        return LLMProvider().llm
    except Exception as exc:
        logger.warning("LLM unavailable: %s", exc)
        return None


def _parse_llm_json(raw: str) -> Dict[str, Any]:
    """Extract JSON from LLM response, handling markdown code blocks."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[^{}]*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


def _classify_intent_fallback(message: str) -> Tuple[str, float, str]:
    """Keyword-based intent classification fallback."""
    message_lower = message.lower()

    intent_keywords = {
        "account_closure": [
            "delete my account", "close my account", "remove my account",
            "delete account", "close account", "remove account",
            "cancel account", "account deletion", "terminate account",
        ],
        "legal_issue": [
            "lawsuit", "attorney", "lawyer", "court", "legal action",
            "sue", "consumer complaint", "bbb", "better business",
        ],
        "order_status": [
            "order", "package", "delivery", "shipping", "tracking",
            "where is", "late", "missing", "shipped", "dispatched",
        ],
        "refund_request": [
            "refund", "money back", "return", "reimburse", "charge back",
        ],
        "password_reset": [
            "password", "login", "can't sign in", "locked out",
            "reset password", "forgot password", "can't access",
        ],
        "account_help": [
            "account", "profile", "settings", "email change",
            "update info", "preferences",
        ],
    }

    for intent, keywords in intent_keywords.items():
        for kw in keywords:
            if kw in message_lower:
                return intent, 0.75, f"Keyword match: '{kw}'"

    return "ambiguous", 0.4, "No keyword match found"


def _classify_intent_llm(message: str) -> Tuple[str, float, str]:
    """LLM-based intent classification."""
    llm = _get_llm()
    if not llm:
        return _classify_intent_fallback(message)

    try:
        prompt = INTENT_CLASSIFICATION_PROMPT.format(message=message)
        response = llm.invoke(prompt)
        raw = response.content if hasattr(response, "content") else str(response)
        parsed = _parse_llm_json(raw)

        intent = parsed.get("intent", "ambiguous")
        confidence = float(parsed.get("confidence", 0.5))
        reasoning = parsed.get("reasoning", "LLM classification")

        valid_intents = {
            "order_status", "refund_request", "account_help", "password_reset",
            "legal_issue", "account_closure", "out_of_scope", "ambiguous",
            "prompt_injection",
        }
        if intent not in valid_intents:
            intent = "ambiguous"
            confidence = 0.3

        return intent, confidence, reasoning

    except Exception as exc:
        logger.warning("LLM intent classification failed: %s", exc)
        return _classify_intent_fallback(message)


def prompt_injection_check_node(state: AgentState) -> Dict[str, Any]:
    """First pipeline step: detect prompt injection before any processing.

    If injection is detected, sets flag and escalation reason. Downstream
    nodes (retrieve_documents, select_tool) will skip all work. The graph
    routes directly to generate_resolution to produce a safe response.
    """
    logger.info("Node: prompt_injection_check | Message: %s", state.customer_message[:100])

    injection_detected, injection_patterns = detect_prompt_injection(
        state.customer_message
    )

    if injection_detected:
        logger.warning(
            "Prompt injection BLOCKED at first pipeline step. Patterns: %s",
            injection_patterns,
        )
        return {
            "prompt_injection_detected": True,
            "injection_patterns": injection_patterns,
            "escalated": True,
            "escalation_reason": "Prompt injection attempt detected",
            "intent": "prompt_injection",
            "confidence": 0.05,
            "intent_reasoning": "Prompt injection attempt detected - blocked before intent classification",
            "history": state.history + [{
                "node": "prompt_injection_check",
                "injection": True,
                "patterns": injection_patterns,
            }],
        }

    return {
        "history": state.history + [{
            "node": "prompt_injection_check",
            "injection": False,
        }],
    }


def intent_detection_node(state: AgentState) -> Dict[str, Any]:
    """Classifies customer intent using LLM with keyword fallback."""
    logger.info("Node: intent_detection | Input: %s", state.customer_message[:100])

    # If the dedicated injection check node already detected injection, pass through
    if state.prompt_injection_detected:
        logger.info("Intent detection: injection already detected by upstream node.")
        return {
            "intent": "prompt_injection",
            "confidence": 0.05,
            "intent_reasoning": "Prompt injection attempt detected - blocked before intent classification",
            "prompt_injection_detected": True,
            "injection_patterns": state.injection_patterns,
            "escalated": True,
            "escalation_reason": "Prompt injection attempt detected",
            "history": state.history + [{
                "node": "intent_detection",
                "intent": "prompt_injection",
                "injection": True,
                "skipped": True,
            }],
        }

    injection_detected, injection_patterns = detect_prompt_injection(
        state.customer_message
    )

    if injection_detected:
        logger.warning("Prompt injection detected in intent_detection node.")
        return {
            "intent": "prompt_injection",
            "confidence": 0.05,
            "intent_reasoning": "Prompt injection attempt detected",
            "prompt_injection_detected": True,
            "injection_patterns": injection_patterns,
            "escalated": True,
            "escalation_reason": "Prompt injection attempt detected",
            "history": state.history + [{
                "node": "intent_detection",
                "intent": "prompt_injection",
                "injection": True,
            }],
        }

    escalation_triggers, trigger_matches = detect_escalation_triggers(
        state.customer_message
    )

    if is_out_of_scope(state.customer_message):
        return {
            "intent": "out_of_scope",
            "confidence": 0.9,
            "intent_reasoning": "Message is outside customer support scope",
            "history": state.history + [{
                "node": "intent_detection",
                "intent": "out_of_scope",
            }],
        }

    intent, certainty, reasoning = _classify_intent_llm(state.customer_message)

    if intent == "ambiguous":
        return {
            "intent": intent,
            "confidence": certainty,
            "intent_reasoning": reasoning,
            "history": state.history + [{
                "node": "intent_detection",
                "intent": intent,
                "reasoning": reasoning,
            }],
        }

    if escalation_triggers:
        return {
            "intent": intent,
            "confidence": certainty,
            "intent_reasoning": reasoning,
            "escalated": True,
            "escalation_reason": f"Escalation triggers: {', '.join(trigger_matches)}",
            "history": state.history + [{
                "node": "intent_detection",
                "intent": intent,
                "escalation_triggers": trigger_matches,
            }],
        }

    return {
        "intent": intent,
        "confidence": certainty,
        "intent_reasoning": reasoning,
        "history": state.history + [{
            "node": "intent_detection",
            "intent": intent,
            "reasoning": reasoning,
        }],
    }


def make_retrieve_documents_node(db: Session | None = None):
    """Factory that creates a retrieve_documents_node bound to a DB session."""

    def retrieve_documents_node(state: AgentState) -> Dict[str, Any]:
        logger.info("Node: retrieve_documents | Intent: %s", state.intent)

        if state.prompt_injection_detected or state.intent == "prompt_injection":
            logger.info("Retrieve documents: SKIPPED (prompt injection detected).")
            return {
                "retrieved_documents": [],
                "citations": [],
                "history": state.history + [{
                    "node": "retrieve_documents",
                    "count": 0,
                    "skipped": True,
                    "reason": "prompt_injection",
                }],
            }

        if state.intent in ("out_of_scope", "ambiguous"):
            return {
                "retrieved_documents": [],
                "citations": [],
                "history": state.history + [{
                    "node": "retrieve_documents",
                    "count": 0,
                    "skipped": True,
                }],
            }

        try:
            from app.rag.retriever import KnowledgeRetriever
            retriever = KnowledgeRetriever()
            docs = retriever.retrieve(state.customer_message)
            documents = [doc.page_content for doc in docs]
            citations = extract_citations(documents)
        except Exception as exc:
            logger.warning("RAG retrieval failed: %s", exc)
            documents = []
            citations = []

        return {
            "retrieved_documents": documents,
            "citations": citations,
            "history": state.history + [{
                "node": "retrieve_documents",
                "count": len(documents),
                "citation_count": len(citations),
            }],
        }

    return retrieve_documents_node


def make_select_tool_node(db: Session | None = None):
    """Factory that creates a select_tool_node bound to a DB session."""

    def select_tool_node(state: AgentState) -> Dict[str, Any]:
        logger.info("Node: select_tool | Intent: %s", state.intent)

        if state.prompt_injection_detected or state.intent == "prompt_injection":
            logger.info("Select tool: SKIPPED (prompt injection detected).")
            return {
                "selected_tool": "",
                "tool_input": {},
                "tool_output": {},
                "history": state.history + [{
                    "node": "select_tool",
                    "tool": None,
                    "reason": "prompt_injection",
                }],
            }

        if state.intent in ("out_of_scope", "ambiguous", "legal_issue", "account_closure"):
            return {
                "selected_tool": "",
                "tool_input": {},
                "tool_output": {},
                "history": state.history + [{
                    "node": "select_tool",
                    "tool": None,
                    "reason": "No tool for intent: %s" % state.intent,
                }],
            }

        if not db:
            return {
                "selected_tool": "",
                "tool_input": {},
                "tool_output": {},
                "history": state.history + [{"node": "select_tool", "tool": None}],
            }

        result = get_tool_for_intent(state.intent, db)
        if not result:
            return {
                "selected_tool": "",
                "tool_input": {},
                "tool_output": {},
                "history": state.history + [{
                    "node": "select_tool",
                    "tool": None,
                    "reason": "No tool mapped",
                }],
            }

        tool_name, tool = result
        tool_input = _build_tool_input(state, tool_name)
        tool_output = execute_tool(tool_name, tool_input, db)

        return {
            "selected_tool": tool_name,
            "tool_input": tool_input,
            "tool_output": tool_output,
            "history": state.history + [{
                "node": "select_tool",
                "tool": tool_name,
                "input_keys": list(tool_input.keys()),
            }],
        }

    return select_tool_node


def _build_tool_input(state: AgentState, tool_name: str) -> Dict[str, Any]:
    """Builds the appropriate input dict for a given tool."""
    order_id = _extract_order_id(state.customer_message)

    if tool_name == "order_lookup":
        return {"order_id": order_id or state.tool_input.get("order_id", "")}
    elif tool_name == "refund_eligibility":
        return {
            "order_id": order_id or state.tool_input.get("order_id", ""),
            "reason": state.customer_message,
        }
    elif tool_name == "apply_credit":
        return {
            "customer_email": state.customer_email,
            "amount": state.tool_input.get("amount", 0.0),
            "reason": state.customer_message,
        }
    elif tool_name == "create_ticket":
        return {
            "customer_name": state.customer_name,
            "customer_email": state.customer_email,
            "message": state.customer_message,
            "ticket_type": state.intent,
        }
    elif tool_name == "escalation":
        return {
            "ticket_id": state.ticket_id,
            "reason": state.customer_message,
        }
    elif tool_name == "password_reset":
        return {"customer_email": state.customer_email}
    return {}


def _extract_order_id(message: str) -> Optional[str]:
    """Extract order ID from customer message using patterns."""
    patterns = [
        r"order\s+(?:id\s+)?[:#]?\s*([A-Za-z0-9\-]{8,36})",
        r"(?:order|ORD)[-_]([A-Za-z0-9\-]{8,36})",
        r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return match.group(1) if match.lastindex else match.group(0)
    return None


def generate_resolution_node(state: AgentState) -> Dict[str, Any]:
    """Generates a resolution using LLM with retrieved context and tool output."""
    logger.info("Node: generate_resolution | Intent: %s | Tool: %s", state.intent, state.selected_tool)

    # Injection check MUST come before out_of_scope (injection sets intent="prompt_injection")
    if state.prompt_injection_detected or state.intent == "prompt_injection":
        resolution = INJECTION_SAFE_RESPONSE
        return {
            "resolution": resolution,
            "final_response": resolution,
            "history": state.history + [{"node": "generate_resolution", "type": "injection_response"}],
        }

    if state.intent == "out_of_scope":
        resolution = OUT_OF_SCOPE_RESPONSE
        return {
            "resolution": resolution,
            "final_response": resolution,
            "history": state.history + [{"node": "generate_resolution", "type": "out_of_scope"}],
        }

    if state.intent == "ambiguous":
        resolution = AMBIGUOUS_RESPONSE
        return {
            "resolution": resolution,
            "final_response": resolution,
            "history": state.history + [{"node": "generate_resolution", "type": "ambiguous"}],
        }

    resolution = _generate_with_llm(state)
    citations_text = format_citations_for_response(state.citations)

    if citations_text:
        resolution += citations_text

    return {
        "resolution": resolution,
        "final_response": resolution,
        "history": state.history + [{"node": "generate_resolution", "has_citations": bool(state.citations)}],
    }


def _generate_with_llm(state: AgentState) -> str:
    """Generate resolution using LLM, with template fallback."""
    llm = _get_llm()
    if not llm:
        return _generate_template(state)

    try:
        docs_text = "\n\n".join(state.retrieved_documents[:5]) if state.retrieved_documents else "No relevant documents found."
        tool_text = json.dumps(state.tool_output, indent=2, default=str) if state.tool_output else "No tool was used."

        prompt = RESOLUTION_PROMPT.format(
            message=state.customer_message,
            intent=state.intent,
            documents=docs_text,
            tool_results=tool_text,
        )

        response = llm.invoke(prompt)
        return response.content if hasattr(response, "content") else str(response)

    except Exception as exc:
        logger.warning("LLM resolution generation failed: %s", exc)
        return _generate_template(state)


def _generate_template(state: AgentState) -> str:
    """Template-based resolution generation fallback."""
    parts = []

    if state.intent == "order_status" and state.tool_output:
        if state.tool_output.get("found"):
            order = state.tool_output
            parts.append(
                f"Your order {order.get('order_id', '')} is currently **{order.get('status', 'unknown')}**."
            )
            if order.get("carrier"):
                parts.append(f"Carrier: {order['carrier']}")
            if order.get("tracking_number"):
                parts.append(f"Tracking Number: {order['tracking_number']}")
            if order.get("estimated_delivery"):
                parts.append(f"Estimated Delivery: {order['estimated_delivery']}")
        elif state.tool_output.get("error"):
            parts.append(f"I wasn't able to find that order: {state.tool_output['error']}")
            parts.append("Could you please double-check your order ID?")

    elif state.intent == "refund_request" and state.tool_output:
        if state.tool_output.get("eligible"):
            parts.append(
                f"Good news! Your order is eligible for a refund. "
                f"Order amount: ${state.tool_output.get('order_amount', 0):.2f}. "
                f"Your refund will be processed within 5-7 business days."
            )
            if state.tool_output.get("order_amount", 0) <= settings.MAX_GOODWILL_CREDIT:
                parts.append(
                    f"As a goodwill gesture, we can also apply a credit of up to "
                    f"${settings.MAX_GOODWILL_CREDIT:.2f} to your account."
                )
        elif state.tool_output.get("error") or state.tool_output.get("reason"):
            reason = state.tool_output.get("reason", state.tool_output.get("error", "Unknown"))
            parts.append(f"I'm sorry, but your order is not eligible for a refund at this time. Reason: {reason}")

    elif state.intent == "password_reset":
        if state.tool_output.get("success"):
            parts.append(
                f"A password reset link has been sent to {state.tool_output.get('customer_email', 'your email')}. "
                f"The link will expire in {state.tool_output.get('expires_in_minutes', 30)} minutes. "
                "Please check your spam folder if you don't see it."
            )
        else:
            parts.append("I'm sorry, I couldn't initiate the password reset. Please try again or contact support.")

    elif state.retrieved_documents:
        parts.append("Based on our policies:")
        for doc in state.retrieved_documents[:2]:
            preview = doc[:300]
            if len(doc) > 300:
                preview += "..."
            parts.append(preview)

    if not parts:
        if not state.retrieved_documents:
            return NO_POLICY_RESPONSE
        parts.append("I've found some relevant information for your request.")
        parts.append(state.retrieved_documents[0][:300])

    return "\n\n".join(parts)


def human_gate_node(state: AgentState) -> Dict[str, Any]:
    """Determines if human review is needed based on confidence and escalation signals."""
    logger.info("Node: human_gate | Confidence: %.2f | Escalated: %s", state.confidence, state.escalated)

    confidence = calculate_confidence(
        intent=state.intent,
        intent_certainty=state.confidence if state.confidence > 0 else 0.5,
        retrieved_documents=state.retrieved_documents,
        tool_output=state.tool_output,
        tool_success=bool(state.selected_tool and state.tool_output and "error" not in state.tool_output),
        prompt_injection_detected=state.prompt_injection_detected,
        escalation_triggers=[state.escalation_reason] if state.escalation_reason else [],
    )

    needs_human = confidence < 0.75 or state.escalated

    if state.prompt_injection_detected:
        needs_human = True

    if state.escalation_reason:
        needs_human = True

    return {
        "confidence": confidence,
        "human_gate_passed": not needs_human,
        "escalated": needs_human,
        "history": state.history + [{
            "node": "human_gate",
            "escalated": needs_human,
            "confidence": confidence,
            "reason": state.escalation_reason or ("low confidence" if confidence < 0.75 else "normal"),
        }],
    }


def finalize_node(state: AgentState) -> Dict[str, Any]:
    """Finalizes the resolution and prepares the response."""
    logger.info("Node: finalize | Ticket: %s | Escalated: %s", state.ticket_id, state.escalated)

    if state.escalated and not state.resolution:
        response = (
            "Your request has been received and escalated to a specialist team member. "
            "They will follow up with you within 24 hours. "
            "Your ticket ID is: " + state.ticket_id
        )
    elif state.resolution:
        response = state.resolution
    else:
        response = "Your request has been received. A team member will follow up shortly."

    return {
        "final_response": response,
        "history": state.history + [{"node": "finalize", "escalated": state.escalated}],
    }
