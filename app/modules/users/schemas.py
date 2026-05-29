from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.users.models import UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: UserRole
    is_active: bool
    consent_152fz: bool
    consent_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class SyncAttemptItem(BaseModel):
    practice_item_id: UUID = Field(alias="practiceItemId")
    is_correct: bool = Field(alias="isCorrect")
    attempts_count: int = Field(alias="attemptsCount", ge=1)
    last_answered_at: datetime = Field(alias="lastAnsweredAt")

    model_config = ConfigDict(populate_by_name=True)


class ProgressSyncRequest(BaseModel):
    attempts: list[SyncAttemptItem] = Field(max_length=300)


class ProgressSyncResponse(BaseModel):
    synced: int
    updated: int


class ProfileStats(BaseModel):
    total_tasks: int = Field(alias="totalTasks")
    solved_tasks: int = Field(alias="solvedTasks")
    correct_attempts: int = Field(alias="correctAttempts")
    total_attempts: int = Field(alias="totalAttempts")
    streak: int
    last_activity_at: datetime | None = Field(default=None, alias="lastActivityAt")

    model_config = ConfigDict(populate_by_name=True)


class WeakTask(BaseModel):
    task_id: UUID = Field(alias="taskId")
    task_slug: str = Field(alias="taskSlug")
    task_title: str = Field(alias="taskTitle")
    ege_number: int = Field(alias="egeNumber")
    solved_count: int = Field(alias="solvedCount")
    total_count: int = Field(alias="totalCount")
    accuracy: float

    model_config = ConfigDict(populate_by_name=True)


class RecentActivity(BaseModel):
    date: str
    count: int


class ProfileMe(BaseModel):
    stats: ProfileStats
    weak_tasks: list[WeakTask] = Field(alias="weakTasks")
    recent_activity: list[RecentActivity] = Field(alias="recentActivity")

    model_config = ConfigDict(populate_by_name=True)
