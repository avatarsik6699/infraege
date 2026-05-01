from datetime import datetime
from uuid import UUID

from app.modules.auth.constants import JWT_CLAIM_ROLE, JWT_CLAIM_SUBJECT, TOKEN_TYPE_REFRESH
from app.modules.auth.exceptions import AccountDisabled, InvalidCredentials, InvalidToken
from app.modules.auth.schemas import TokenPair
from app.modules.auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_token_type,
    hash_password,
    verify_password,
)
from app.modules.users import EmailAlreadyExists, User, UserNotFound, UserRole, UserService


class AuthService:
    def __init__(self, user_service: UserService) -> None:
        self._user_service = user_service

    async def register(self, email: str, password: str) -> TokenPair:
        existing = await self._user_service.find_by_email(email)
        if existing is not None:
            raise EmailAlreadyExists()

        user = await self._user_service.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.user,
                consent_152fz=True,
                consent_at=datetime.now(),
                is_active=True,
            )
        )
        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )

    async def login(self, email: str, password: str) -> TokenPair:
        try:
            user = await self._user_service.get_by_email(email)
        except UserNotFound as exc:
            raise InvalidCredentials() from exc

        if not verify_password(password, user.hashed_password):
            raise InvalidCredentials()

        if not user.is_active:
            raise AccountDisabled()

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )

    async def delete_account(self, user: User) -> None:
        await self._user_service.delete(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token)
        ensure_token_type(payload, TOKEN_TYPE_REFRESH)

        raw_sub = payload.get(JWT_CLAIM_SUBJECT)
        if not isinstance(raw_sub, str):
            raise InvalidToken()

        try:
            user_id = UUID(raw_sub)
        except ValueError as exc:
            raise InvalidToken() from exc

        try:
            user = await self._user_service.get_by_id(user_id)
        except UserNotFound as exc:
            raise InvalidToken() from exc

        if not user.is_active:
            raise AccountDisabled()

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )
