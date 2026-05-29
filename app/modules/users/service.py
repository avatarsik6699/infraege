from uuid import UUID

from app.modules.users.exceptions import UserNotFound
from app.modules.users.models import User
from app.modules.users.repository import UserAttemptRepository, UserRepository
from app.modules.users.schemas import ProfileMe, ProgressSyncRequest, ProgressSyncResponse


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    async def get_by_id(self, user_id: UUID) -> User:
        user = await self._repository.get_by_id(user_id)
        if user is None:
            raise UserNotFound()
        return user

    async def get_by_email(self, email: str) -> User:
        user = await self._repository.get_by_email(email)
        if user is None:
            raise UserNotFound()
        return user

    async def find_by_email(self, email: str) -> User | None:
        return await self._repository.get_by_email(email)

    async def add(self, user: User) -> User:
        return await self._repository.add(user)

    async def delete(self, user: User) -> None:
        await self._repository.delete(user)


class ProgressService:
    def __init__(self, repository: UserAttemptRepository) -> None:
        self._repository = repository

    async def sync(self, user_id: UUID, payload: ProgressSyncRequest) -> ProgressSyncResponse:
        synced, updated = await self._repository.bulk_sync(user_id, payload.attempts)
        return ProgressSyncResponse(synced=synced, updated=updated)

    async def get_profile_me(self, user_id: UUID) -> ProfileMe:
        return await self._repository.get_profile_me(user_id)
