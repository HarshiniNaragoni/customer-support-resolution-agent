from __future__ import annotations

from typing import Optional, Tuple

GREETING_PATTERNS = [
    "hi", "hello", "hey", "hii", "hiii", "hiiii",
    "good morning", "good afternoon", "good evening", "greetings",
    "yo", "sup", "what's up",
]

THANKS_PATTERNS = [
    "thanks", "thank you", "thanks a lot", "thank you so much",
    "appreciate it", "thx", "ty", "tysm",
]

GOODBYE_PATTERNS = [
    "bye", "goodbye", "see you", "see ya", "have a nice day",
    "talk to you later", "catch you later", "farewell",
]

CAPABILITIES_PATTERNS = [
    "what can you do", "help", "who are you",
    "what services do you provide", "how can you help me",
    "what do you do", "what are your capabilities",
    "what are you able to do", "how do you work",
]

GREETING_RESPONSE = (
    "Hello! I'm your Customer Support Resolution Agent.\n\n"
    "I can help you with:\n"
    "\u2022 Order tracking\n"
    "\u2022 Refunds and returns\n"
    "\u2022 Password resets\n"
    "\u2022 Account support\n"
    "\u2022 Company policies\n\n"
    "How can I assist you today?"
)

THANKS_RESPONSE = (
    "You're welcome! Let me know if there's anything else I can help you with."
)

GOODBYE_RESPONSE = (
    "Goodbye! Have a great day. Feel free to return if you need any assistance."
)

CAPABILITIES_RESPONSE = (
    "I can help you with:\n"
    "\u2022 Tracking orders\n"
    "\u2022 Checking refund eligibility\n"
    "\u2022 Password resets\n"
    "\u2022 Account assistance\n"
    "\u2022 Company policies\n"
    "\u2022 Creating support tickets"
)


def match_conversational(message: str) -> Optional[Tuple[str, str]]:
    """Check if message is a simple conversational input.

    Returns (category, response) if matched, None otherwise.
    Category is one of: greeting, thanks, goodbye, capabilities.
    """
    normalized = message.strip().lower()
    normalized = normalized.rstrip(".!?,;:")

    if normalized in GREETING_PATTERNS:
        return ("greeting", GREETING_RESPONSE)

    if normalized in THANKS_PATTERNS:
        return ("thanks", THANKS_RESPONSE)

    if normalized in GOODBYE_PATTERNS:
        return ("goodbye", GOODBYE_RESPONSE)

    if normalized in CAPABILITIES_PATTERNS:
        return ("capabilities", CAPABILITIES_RESPONSE)

    return None
