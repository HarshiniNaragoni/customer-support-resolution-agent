from __future__ import annotations

INTENT_CLASSIFICATION_PROMPT = """\
You are a customer support intent classifier. Analyze the customer message \
and classify it into exactly ONE of the following intents:

- order_status: Questions about order status, shipping, tracking, delivery
- refund_request: Requests for refunds, returns, money back
- account_help: General account questions, profile updates, settings
- password_reset: Password reset, login issues, locked accounts
- legal_issue: Legal threats, lawsuits, attorney mentions, court, consumer complaints
- account_closure: Requests to delete or close account
- out_of_scope: Requests outside customer support (medical, financial, coding, competitor comparison)
- ambiguous: Unclear intent, could be multiple things, needs clarification

Customer message: "{message}"

Respond with ONLY a JSON object in this exact format:
{{"intent": "<intent>", "confidence": <0.0-1.0>, "reasoning": "<brief explanation>"}}
"""

RESOLUTION_PROMPT = """\
You are a customer support agent. Generate a helpful, professional response \
to the customer using ONLY the provided context and tool results.

Rules:
- Every answer must reference the retrieved documents when available
- Never invent information not found in the context
- If no relevant policy is found, say "I couldn't find a matching company policy."
- Be concise and professional
- Include relevant citations from the documents

Customer message: "{message}"
Detected intent: "{intent}"
Retrieved documents:
{documents}

Tool results:
{tool_results}

Generate a professional customer support response:"""

PROMPT_INJECTION_PATTERNS = [
    "ignore all instructions",
    "ignore previous instructions",
    "ignore above instructions",
    "ignore your instructions",
    "disregard all instructions",
    "disregard previous instructions",
    "forget all instructions",
    "forget your instructions",
    "new instructions:",
    "you are now",
    "from now on",
    "override instructions",
    "bypass instructions",
    "reveal system prompt",
    "show me the system prompt",
    "what are your instructions",
    "print your instructions",
    "refund everyone",
    "refund all orders",
    "delete database",
    "drop database",
    "delete all records",
    "admin access",
    "sudo mode",
    "developer mode",
    "jailbreak",
    "DAN mode",
    "act as if",
    "pretend you are",
    "roleplay as",
    "you are a different",
]

ESCALATION_TRIGGERS = [
    "lawsuit",
    "attorney",
    "lawyer",
    "court",
    "legal action",
    "sue",
    "consumer complaint",
    "better business bureau",
    "bbb",
    "attorney general",
    "account deletion",
    "delete my account",
    "close my account",
    "account closure",
    "identity verification failed",
    "identity theft",
    "fraud",
    "unauthorized charge",
    "unauthorized transaction",
]

OUT_OF_SCOPE_RESPONSE = (
    "I appreciate your message, but this request falls outside the scope of "
    "our customer support services. I'm here to help with orders, returns, "
    "refunds, account questions, and password resets. If you need assistance "
    "with something else, I'd be happy to direct you to the appropriate resource."
)

AMBIGUOUS_RESPONSE = (
    "I want to make sure I understand your request correctly. "
    "Could you provide a bit more detail? For example:\n"
    "- Are you asking about an order status or tracking?\n"
    "- Do you need help with a refund or return?\n"
    "- Is this about your account or password?\n"
    "This will help me assist you more effectively."
)

NO_POLICY_RESPONSE = (
    "I couldn't find a matching company policy for your request. "
    "Let me connect you with a team member who can help."
)
