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
    # Instruction override
    "ignore all instructions",
    "ignore previous instructions",
    "ignore above instructions",
    "ignore your instructions",
    "ignore these instructions",
    "ignore the instructions",
    "disregard all instructions",
    "disregard previous instructions",
    "disregard your instructions",
    "forget all instructions",
    "forget your instructions",
    "forget previous instructions",
    "new instructions:",
    "new instruction:",
    "override instructions",
    "override your instructions",
    "bypass instructions",
    "bypass safety",
    "bypass safeguards",
    "bypass your safeguards",
    "disable safeguards",
    "disable all safeguards",
    "disable safety",
    # System prompt extraction
    "reveal system prompt",
    "reveal the system prompt",
    "show me the system prompt",
    "show the system prompt",
    "print system prompt",
    "print your system prompt",
    "what are your instructions",
    "print your instructions",
    "display your instructions",
    "output your instructions",
    "repeat your instructions",
    "what is your system prompt",
    "reveal hidden prompt",
    "reveal your hidden prompt",
    "show hidden prompt",
    # Mode switching
    "developer mode",
    "dev mode",
    "debug mode",
    "admin mode",
    "sudo mode",
    "god mode",
    "jailbreak",
    "jailbreak mode",
    "DAN mode",
    "DAN prompt",
    "do anything now",
    # Identity manipulation
    "you are now",
    "from now on",
    "act as if",
    "act as another",
    "act as a different",
    "pretend you are",
    "pretend to be",
    "roleplay as",
    "roleplay as another",
    "you are a different",
    "you are no longer",
    "you are not ChatGPT",
    "you are not an AI",
    "you are not a customer support",
    # Dangerous actions
    "refund everyone",
    "refund all orders",
    "refund all customers",
    "delete database",
    "drop database",
    "delete all records",
    "delete all data",
    "execute this command",
    "run this command",
    # Instruction keywords
    "new instructions",
    "override instructions",
    "execute override",
]

# Regex patterns for fuzzy matching (catches obfuscation like "i.g.n.o.r.e" or "ign0re")
PROMPT_INJECTION_REGEX_PATTERNS = [
    r"ignore\s+(?:all\s+|your\s+)?(?:previous\s+)?instructions",
    r"disregard\s+(?:all\s+|your\s+)?(?:previous\s+)?instructions",
    r"forget\s+(?:all\s+|your\s+)?(?:previous\s+)?instructions",
    r"reveal\s+(?:your\s+)?(?:system\s+prompt|hidden\s+prompt)",
    r"show\s+(?:me\s+)?(?:the\s+)?(?:system\s+prompt|hidden\s+prompt)",
    r"print\s+(?:your\s+)?(?:system\s+)?instructions",
    r"developer\s+mode",
    r"jailbreak(?:\s+mode)?",
    r"\bDAN\b(?:\s+mode|\s+prompt)?",
    r"do\s+anything\s+now",
    r"bypass\s+(?:safety|safeguards?|instructions?)",
    r"disable\s+(?:all\s+)?(?:safety|safeguards?)",
    r"override\s+(?:all\s+|your\s+)?instructions?",
    r"you\s+are\s+no\s+longer",
    r"pretend\s+you\s+are",
    r"act\s+as\s+(?:if|another|a\s+different)",
    r"roleplay\s+as",
    r"execute\s+this\s+command",
    r"delete\s+(?:all\s+)?(?:database|records?|data)",
    r"drop\s+database",
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

INJECTION_SAFE_RESPONSE = (
    "I'm unable to follow requests that attempt to override or manipulate "
    "my operating instructions. If you have a legitimate customer support "
    "question about an order, refund, account, or policy, I'll be happy to help."
)
