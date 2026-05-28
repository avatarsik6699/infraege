from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.tasks.models import TaskDifficulty
from app.modules.tasks.schemas import PublicTaskDetail, PublicTaskSummary
from app.modules.tasks.service import PublicTaskService

router = APIRouter(prefix="/public/tasks", tags=["tasks"])


def get_public_task_service(session: Annotated[AsyncSession, Depends(get_db)]) -> PublicTaskService:
    return PublicTaskService(session)


@router.get("", response_model=list[PublicTaskSummary])
async def list_public_tasks(
    service: Annotated[PublicTaskService, Depends(get_public_task_service)],
    search: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
    difficulty: TaskDifficulty | None = None,
) -> list[PublicTaskSummary]:
    return await service.list_tasks(search=search, difficulty=difficulty)


@router.get("/{slug}", response_model=PublicTaskDetail)
async def get_public_task(
    slug: str,
    service: Annotated[PublicTaskService, Depends(get_public_task_service)],
) -> PublicTaskDetail:
    task = await service.get_task(slug)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task
