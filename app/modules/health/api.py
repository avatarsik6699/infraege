import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def health_live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}


@router.get("/health/detailed")
async def health_detailed(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    checks: dict[str, str] = {}

    try:
        await db.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception:
        checks["db"] = "error"

    status = "ok" if all(value == "ok" for value in checks.values()) else "degraded"
    return {"status": status, "checks": checks}


@router.get("/health/backup")
async def health_backup() -> dict[str, object]:
    if not settings.BACKUP_HEALTH_ENABLED:
        raise HTTPException(status_code=404, detail="backup health check is disabled")

    status_file = Path(settings.BACKUP_HEALTH_STATUS_FILE)
    configured_max_age_hours = settings.BACKUP_MAX_AGE_HOURS

    if configured_max_age_hours < 1:
        return {
            "status": "degraded",
            "reason": "BACKUP_MAX_AGE_HOURS must be positive",
            "age_hours": None,
            "max_age_hours": configured_max_age_hours,
        }

    if not status_file.is_file():
        return {
            "status": "degraded",
            "reason": "backup marker is missing",
            "age_hours": None,
            "max_age_hours": configured_max_age_hours,
        }

    try:
        marker = json.loads(status_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {
            "status": "degraded",
            "reason": "backup marker is invalid",
            "age_hours": None,
            "max_age_hours": configured_max_age_hours,
        }

    timestamp = marker.get("timestamp")
    marker_status = marker.get("status")
    if marker_status != "ok" or not isinstance(timestamp, str):
        return {
            "status": "degraded",
            "reason": "backup marker is invalid",
            "age_hours": None,
            "max_age_hours": configured_max_age_hours,
        }

    marker_max_age_hours = marker.get("max_age_hours")
    max_age_hours = (
        marker_max_age_hours
        if isinstance(marker_max_age_hours, int) and marker_max_age_hours > 0
        else configured_max_age_hours
    )

    try:
        backup_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return {
            "status": "degraded",
            "reason": "backup marker timestamp is invalid",
            "age_hours": None,
            "max_age_hours": max_age_hours,
        }

    if backup_time.tzinfo is None:
        backup_time = backup_time.replace(tzinfo=UTC)

    age_seconds = (datetime.now(UTC) - backup_time.astimezone(UTC)).total_seconds()
    if age_seconds < 0:
        return {
            "status": "degraded",
            "reason": "backup marker timestamp is in the future",
            "age_hours": None,
            "max_age_hours": max_age_hours,
        }

    age_hours = round(age_seconds / 3600, 2)
    response: dict[str, Any] = {
        "status": "ok" if age_hours <= max_age_hours else "degraded",
        "age_hours": age_hours,
        "max_age_hours": max_age_hours,
        "last_success_at": timestamp,
    }
    if response["status"] != "ok":
        response["reason"] = "backup marker is stale"
    return response
