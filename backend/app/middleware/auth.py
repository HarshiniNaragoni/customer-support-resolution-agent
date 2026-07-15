from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header, HTTPException

from app.config.logging_config import logger


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    """Placeholder authentication dependency.

    In production, this would validate JWT tokens or API keys.
    """
    if authorization is None:
        logger.debug("No authorization header provided, using default user.")
        return {
            "user_id": "anonymous",
            "role": "agent",
            "name": "Anonymous Agent",
        }

    # TODO: Implement JWT/token validation
    return {
        "user_id": "authenticated_user",
        "role": "agent",
        "name": "Authenticated Agent",
    }


def require_role(allowed_roles: list[str]):
    """Placeholder role-based access control dependency."""
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_roles:
            logger.warning("Unauthorized role access: %s", user.get("role"))
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return user
    return _check
