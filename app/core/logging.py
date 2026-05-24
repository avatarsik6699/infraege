"""Structured logging setup with request-id propagation and secret scrubbing."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import Any

import structlog

from app.core.config import settings

_SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "access_token",
    "refresh_token",
    "token",
    "authorization",
}


def _scrub_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            key: ("[REDACTED]" if key.lower() in _SENSITIVE_KEYS else _scrub_value(val))
            for key, val in value.items()
        }
    if isinstance(value, list):
        return [_scrub_value(item) for item in value]
    return value


def scrub_sensitive_fields(
    _logger: structlog.BoundLogger,
    _method_name: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    return _scrub_value(event_dict)


def configure_logging() -> None:
    logging.basicConfig(level=settings.LOG_LEVEL.upper(), format="%(message)s")

    is_dev = settings.APP_ENV == "development"

    renderer = (
        structlog.dev.ConsoleRenderer(colors=True)
        if is_dev
        else structlog.processors.JSONRenderer()
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            scrub_sensitive_fields,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
