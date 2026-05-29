import hashlib

from app.core.config import settings
from app.modules.feedback.models import FeedbackReport, FeedbackStatus
from app.modules.feedback.repository import FeedbackRepository
from app.modules.feedback.schemas import (
    FeedbackListResponse,
    FeedbackReportAdmin,
    FeedbackRequest,
    FeedbackResponse,
    FeedbackStatusUpdate,
)


class HoneypotFilled(Exception):
    pass


class FeedbackNotFound(Exception):
    pass


def _hash_ip(ip: str) -> str:
    raw = ip + settings.FEEDBACK_IP_PEPPER
    return hashlib.sha256(raw.encode()).hexdigest()


class FeedbackService:
    def __init__(self, repository: FeedbackRepository) -> None:
        self._repo = repository

    async def submit(
        self,
        body: FeedbackRequest,
        client_ip: str,
        user_agent: str | None,
    ) -> FeedbackResponse:
        if body.honeypot:
            raise HoneypotFilled()

        report = FeedbackReport(
            page_url=body.page_url,
            message=body.message,
            ip_hash=_hash_ip(client_ip),
            user_agent=user_agent[:300] if user_agent else None,
        )
        await self._repo.add(report)
        return FeedbackResponse(ok=True)

    async def list_reports(
        self,
        page: int,
        per_page: int,
        status: FeedbackStatus | None,
    ) -> FeedbackListResponse:
        items, total = await self._repo.list_paginated(page, per_page, status)
        return FeedbackListResponse(
            items=[FeedbackReportAdmin.model_validate(r) for r in items],
            total=total,
            page=page,
            per_page=per_page,
        )

    async def update_status(
        self,
        report_id,
        body: FeedbackStatusUpdate,
    ) -> FeedbackReportAdmin:
        report = await self._repo.get_by_id(report_id)
        if report is None:
            raise FeedbackNotFound()
        report.status = body.status
        await self._repo._session.flush()
        return FeedbackReportAdmin.model_validate(report)
