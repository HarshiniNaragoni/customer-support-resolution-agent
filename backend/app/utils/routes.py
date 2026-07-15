from __future__ import annotations

from fastapi import APIRouter

from app.utils.health import get_system_health


router = APIRouter()


@router.get("/system/health")
def system_health():
    return get_system_health()
