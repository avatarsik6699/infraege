"""Cross-cutting HTTP middleware wired in `main.py`."""

import time
import uuid
from typing import Any

import structlog
from fastapi import FastAPI, Request, Response

from app.core.constants import REQUEST_ID_HEADER

logger = structlog.get_logger("http")


def register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def _request_id_and_logging(  # pyright: ignore[reportUnusedFunction]
        request: Request, call_next: Any
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        started = time.perf_counter()
        try:
            response: Response = await call_next(request)
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info(
                "request.completed",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
            )
            structlog.contextvars.clear_contextvars()

        response.headers[REQUEST_ID_HEADER] = request_id
        return response
