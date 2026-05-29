from fastapi import APIRouter, Depends, Request

from app.core.config import settings
from app.core.rate_limit import limiter
from app.modules.analytics.dependencies import get_page_event_repository
from app.modules.analytics.models import PageEvent
from app.modules.analytics.repository import PageEventRepository
from app.modules.analytics.schemas import PageviewRequest, PageviewResponse

router = APIRouter(prefix="/public/events", tags=["analytics"])


@router.post("/pageview", response_model=PageviewResponse)
@limiter.limit(settings.PAGEVIEW_RATE_LIMIT)
async def record_pageview(
    request: Request,
    body: PageviewRequest,
    repo: PageEventRepository = Depends(get_page_event_repository),
) -> PageviewResponse:
    user_agent = request.headers.get("user-agent")
    event = PageEvent(
        path=body.path,
        referrer=body.referrer,
        user_agent=user_agent[:300] if user_agent else None,
        session_id=body.session_id,
    )
    await repo.add(event)
    return PageviewResponse(ok=True)
