from app.modules.users.dependencies import (
    get_progress_service,
    get_user_attempt_repository,
    get_user_repository,
    get_user_service,
)
from app.modules.users.exceptions import EmailAlreadyExists, UserNotFound
from app.modules.users.models import User, UserAttempt, UserRole
from app.modules.users.repository import UserAttemptRepository, UserRepository
from app.modules.users.schemas import (
    ProfileMe,
    ProfileStats,
    ProgressSyncRequest,
    ProgressSyncResponse,
    RecentActivity,
    SyncAttemptItem,
    UserCreate,
    UserOut,
    WeakTask,
)
from app.modules.users.service import ProgressService, UserService

__all__ = [
    "EmailAlreadyExists",
    "ProfileMe",
    "ProfileStats",
    "ProgressService",
    "ProgressSyncRequest",
    "ProgressSyncResponse",
    "RecentActivity",
    "SyncAttemptItem",
    "User",
    "UserAttempt",
    "UserAttemptRepository",
    "UserCreate",
    "UserNotFound",
    "UserOut",
    "UserRepository",
    "UserRole",
    "UserService",
    "WeakTask",
    "get_progress_service",
    "get_user_attempt_repository",
    "get_user_repository",
    "get_user_service",
]
