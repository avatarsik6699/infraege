"""Stateless auth primitives: password hashing and JWT encode/decode."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.modules.auth.constants import (
    JWT_CLAIM_EXPIRY,
    JWT_CLAIM_TOKEN_TYPE,
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_REFRESH,
)
from app.modules.auth.exceptions import InvalidToken


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(
    data: dict[str, Any],
    token_type: str,
    expires_delta: timedelta,
) -> str:
    payload = data.copy()
    payload[JWT_CLAIM_TOKEN_TYPE] = token_type
    payload["jti"] = uuid4().hex
    payload[JWT_CLAIM_EXPIRY] = datetime.now(UTC) + expires_delta
    encoded: str = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded


def create_access_token(data: dict[str, Any]) -> str:
    return _create_token(
        data,
        token_type=TOKEN_TYPE_ACCESS,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(data: dict[str, Any]) -> str:
    return _create_token(
        data,
        token_type=TOKEN_TYPE_REFRESH,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        decoded: dict[str, Any] = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as exc:
        raise InvalidToken() from exc
    return decoded


def ensure_token_type(payload: dict[str, Any], expected_type: str) -> None:
    token_type = payload.get(JWT_CLAIM_TOKEN_TYPE)
    if token_type != expected_type:
        raise InvalidToken("Invalid token type")
