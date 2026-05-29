from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status

from app.modules.auth.dependencies import require_admin
from app.modules.feedback.dependencies import get_feedback_service
from app.modules.feedback.models import FeedbackStatus
from app.modules.feedback.schemas import (
    FeedbackListResponse,
    FeedbackReportAdmin,
    FeedbackStatusUpdate,
)
from app.modules.feedback.service import FeedbackNotFound, FeedbackService
from app.modules.users.models import User

router = APIRouter(prefix="/admin/feedback", tags=["admin-feedback"])


@router.get("", response_model=FeedbackListResponse)
async def list_feedback(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status: FeedbackStatus | None = Query(default=None),
    _admin: User = Depends(require_admin),
    service: FeedbackService = Depends(get_feedback_service),
) -> FeedbackListResponse:
    return await service.list_reports(page, per_page, status)


@router.patch("/{report_id}", response_model=FeedbackReportAdmin)
async def update_feedback_status(
    report_id: UUID,
    body: FeedbackStatusUpdate,
    _admin: User = Depends(require_admin),
    service: FeedbackService = Depends(get_feedback_service),
) -> FeedbackReportAdmin:
    try:
        return await service.update_status(report_id, body)
    except FeedbackNotFound:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Feedback report not found",
        )
