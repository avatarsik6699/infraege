from fastapi import APIRouter, Depends

from app.modules.analytics.dependencies import get_page_event_repository
from app.modules.analytics.repository import PageEventRepository
from app.modules.analytics.schemas import PageviewStats
from app.modules.auth.dependencies import require_admin
from app.modules.users.models import User

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("/pageviews", response_model=PageviewStats)
async def get_pageview_stats(
    _admin: User = Depends(require_admin),
    repo: PageEventRepository = Depends(get_page_event_repository),
) -> PageviewStats:
    top_pages = await repo.get_top_pages()
    daily = await repo.get_daily_views()
    return PageviewStats(top_pages=top_pages, daily=daily)
