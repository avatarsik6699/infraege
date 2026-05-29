from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.feedback.models import FeedbackReport, FeedbackStatus


class FeedbackRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, report: FeedbackReport) -> FeedbackReport:
        self._session.add(report)
        await self._session.flush()
        return report

    async def list_paginated(
        self,
        page: int,
        per_page: int,
        status: FeedbackStatus | None = None,
    ) -> tuple[list[FeedbackReport], int]:
        base_query = select(FeedbackReport)
        count_query = select(func.count()).select_from(FeedbackReport)

        if status is not None:
            base_query = base_query.where(FeedbackReport.status == status)
            count_query = count_query.where(FeedbackReport.status == status)

        total_result = await self._session.execute(count_query)
        total = total_result.scalar_one()

        rows_result = await self._session.execute(
            base_query.order_by(FeedbackReport.submitted_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        items = list(rows_result.scalars().all())

        return items, total

    async def get_by_id(self, report_id: UUID) -> FeedbackReport | None:
        result = await self._session.execute(
            select(FeedbackReport).where(FeedbackReport.id == report_id)
        )
        return result.scalar_one_or_none()
