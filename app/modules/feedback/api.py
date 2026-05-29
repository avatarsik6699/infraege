from fastapi import APIRouter, Depends, Request, status

from app.core.config import settings
from app.core.rate_limit import limiter
from app.modules.feedback.dependencies import get_feedback_service
from app.modules.feedback.schemas import FeedbackRequest, FeedbackResponse
from app.modules.feedback.service import FeedbackService, HoneypotFilled

router = APIRouter(prefix="/public/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.FEEDBACK_RATE_LIMIT)
async def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    service: FeedbackService = Depends(get_feedback_service),
) -> FeedbackResponse:
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")

    try:
        return await service.submit(body, client_ip, user_agent)
    except HoneypotFilled:
        # Return ok=true to not leak detection; silently discard
        return FeedbackResponse(ok=True)
