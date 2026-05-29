from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics.models import PageEvent
from app.modules.analytics.schemas import DailyViews, TopPage


class PageEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, event: PageEvent) -> None:
        self._session.add(event)

    async def get_top_pages(self, limit: int = 20) -> list[TopPage]:
        result = await self._session.execute(
            select(PageEvent.path, func.count(PageEvent.id).label("views"))
            .group_by(PageEvent.path)
            .order_by(func.count(PageEvent.id).desc())
            .limit(limit)
        )
        return [TopPage(path=row.path, views=row.views) for row in result]

    async def get_daily_views(self, days: int = 30) -> list[DailyViews]:
        result = await self._session.execute(
            text(
                """
                SELECT DATE(created_at AT TIME ZONE 'UTC')::text AS date,
                       COUNT(*) AS views
                FROM page_events
                WHERE created_at >= now() - make_interval(days => :days)
                GROUP BY DATE(created_at AT TIME ZONE 'UTC')
                ORDER BY date ASC
                """
            ),
            {"days": days},
        )
        return [DailyViews(date=row.date, views=row.views) for row in result]
