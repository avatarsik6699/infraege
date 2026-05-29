from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.feedback.repository import FeedbackRepository
from app.modules.feedback.service import FeedbackService


def get_feedback_repository(session: AsyncSession = Depends(get_db)) -> FeedbackRepository:
    return FeedbackRepository(session)


def get_feedback_service(
    repository: FeedbackRepository = Depends(get_feedback_repository),
) -> FeedbackService:
    return FeedbackService(repository)
