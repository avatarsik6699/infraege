"""Dev/test feedback report seeders."""

import hashlib
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.feedback.models import FeedbackReport, FeedbackStatus
from app.seeders.base import BaseSeeder

_SEED_REPORTS = [
    {
        "page_url": "/topics",
        "message": "Не могу найти задания по тригонометрии. Добавьте, пожалуйста!",
        "status": FeedbackStatus.new,
        "delta_hours": -1,
    },
    {
        "page_url": "/tasks/ege-algebra-01",
        "message": "В задании опечатка в условии: написано «квадрат», а должно быть «куб».",
        "status": FeedbackStatus.new,
        "delta_hours": -3,
    },
    {
        "page_url": "/",
        "message": "Сайт отлично работает на телефоне, всё удобно. Спасибо!",
        "status": FeedbackStatus.new,
        "delta_hours": -5,
    },
    {
        "page_url": "/tasks/ege-geometry-02",
        "message": "Решение в подсказке содержит ошибку на шаге 3.",
        "status": FeedbackStatus.reviewed,
        "delta_hours": -24,
    },
    {
        "page_url": "/topics",
        "message": "Хочу больше заданий на производные.",
        "status": FeedbackStatus.reviewed,
        "delta_hours": -48,
    },
    {
        "page_url": "/",
        "message": "Страница загружается очень медленно на мобильном.",
        "status": FeedbackStatus.archived,
        "delta_hours": -72,
    },
]

_SEED_IP = "192.0.2.1"
_SEED_PEPPER = "seed-pepper"
_SEED_UA = "Mozilla/5.0 (seed data)"


def _ip_hash(ip: str) -> str:
    return hashlib.sha256(f"{ip}{_SEED_PEPPER}".encode()).hexdigest()


class FeedbackSeeder(BaseSeeder):
    name = "feedback"
    description = "sample feedback reports (2× new, 2× reviewed, 1× archived)"

    async def run(self, session: AsyncSession) -> int:
        existing_count = await session.execute(
            select(func.count()).select_from(FeedbackReport)
        )
        if existing_count.scalar_one() > 0:
            return 0

        now = datetime.now(UTC)
        for spec in _SEED_REPORTS:
            session.add(
                FeedbackReport(
                    page_url=spec["page_url"],
                    message=spec["message"],
                    ip_hash=_ip_hash(_SEED_IP),
                    user_agent=_SEED_UA,
                    status=spec["status"],
                    submitted_at=now + timedelta(hours=spec["delta_hours"]),
                )
            )
        await session.commit()
        return len(_SEED_REPORTS)
