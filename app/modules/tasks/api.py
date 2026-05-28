from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.regex_safety import UnsafeRegexPattern
from app.db.session import get_db
from app.modules.tasks.models import TaskDifficulty
from app.modules.tasks.schemas import (
    PracticeValidationRequest,
    PracticeValidationResponse,
    PublicPracticeItem,
    PublicTaskDetail,
    PublicTaskSummary,
)
from app.modules.tasks.service import PracticeValidationUnavailable, PublicTaskService

router = APIRouter(prefix="/public", tags=["tasks"])


def get_public_task_service(session: Annotated[AsyncSession, Depends(get_db)]) -> PublicTaskService:
    return PublicTaskService(session)


@router.get("/tasks", response_model=list[PublicTaskSummary])
async def list_public_tasks(
    service: Annotated[PublicTaskService, Depends(get_public_task_service)],
    search: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
    difficulty: TaskDifficulty | None = None,
) -> list[PublicTaskSummary]:
    return await service.list_tasks(search=search, difficulty=difficulty)


@router.get("/tasks/{slug}", response_model=PublicTaskDetail)
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


@router.get("/practice/{task_id}", response_model=list[PublicPracticeItem])
async def get_public_practice(
    task_id: UUID,
    service: Annotated[PublicTaskService, Depends(get_public_task_service)],
) -> list[PublicPracticeItem]:
    practice = await service.get_practice(task_id)
    if practice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return practice


@router.post("/validate", response_model=PracticeValidationResponse)
async def validate_public_practice_answer(
    payload: PracticeValidationRequest,
    service: Annotated[PublicTaskService, Depends(get_public_task_service)],
) -> PracticeValidationResponse:
    try:
        result = await service.validate_answer(item_id=payload.item_id, answer=payload.answer)
    except (PracticeValidationUnavailable, UnsafeRegexPattern):
        raise HTTPException(
            status_code=422,
            detail="Practice validation is unavailable for this item",
        ) from None

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practice item not found",
        )
    return result
