from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.users.repository import UserAttemptRepository, UserRepository
from app.modules.users.service import ProgressService, UserService


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


def get_user_service(
    repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    return UserService(repository)


def get_user_attempt_repository(
    session: AsyncSession = Depends(get_db),
) -> UserAttemptRepository:
    return UserAttemptRepository(session)


def get_progress_service(
    repository: UserAttemptRepository = Depends(get_user_attempt_repository),
) -> ProgressService:
    return ProgressService(repository)
