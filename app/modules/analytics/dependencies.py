from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.analytics.repository import PageEventRepository


def get_page_event_repository(
    session: AsyncSession = Depends(get_db),
) -> PageEventRepository:
    return PageEventRepository(session)
