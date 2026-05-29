from fastapi import APIRouter, Depends, Request, status

from app.core.config import settings
from app.core.rate_limit import limiter
from app.modules.auth.dependencies import get_auth_service, get_current_user
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.modules.auth.service import AuthService
from app.modules.users import User, UserOut, UserService, get_user_service

router = APIRouter(prefix="/public/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def login(
    request: Request,
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.login(body.email, body.password)


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def register(
    request: Request,
    body: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.register(body.email, body.password)


@router.post("/refresh", response_model=TokenPair)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def refresh(
    request: Request,
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.refresh(body.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(_current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"message": "Logged out"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.delete(current_user)
