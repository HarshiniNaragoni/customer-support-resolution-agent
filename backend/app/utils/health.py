from __future__ import annotations

import platform
from typing import Any, Dict

from app.config.settings import settings


def get_system_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "python": platform.python_version(),
        "platform": platform.system(),
    }
