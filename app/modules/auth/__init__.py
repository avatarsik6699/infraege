"""Auth module public API."""

from app.modules.auth.dependencies import get_auth_service, get_current_user, require_role
from app.modules.auth.exceptions import (
    AccountDisabled,
    InsufficientRole,
    InvalidCredentials,
    InvalidToken,
    NotAuthenticated,
)
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.modules.auth.service import AuthService
from app.modules.auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

__all__ = [
    "AccountDisabled",
    "AuthService",
    "InsufficientRole",
    "InvalidCredentials",
    "InvalidToken",
    "LoginRequest",
    "NotAuthenticated",
    "RefreshRequest",
    "RegisterRequest",
    "TokenPair",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_auth_service",
    "get_current_user",
    "hash_password",
    "require_role",
    "verify_password",
]
