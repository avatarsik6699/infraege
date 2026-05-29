import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class FeedbackStatus(enum.StrEnum):
    new = "new"
    reviewed = "reviewed"
    archived = "archived"


class FeedbackReport(UUIDMixin, Base):
    __tablename__ = "feedback_reports"

    page_url: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    ip_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    status: Mapped[FeedbackStatus] = mapped_column(
        Enum(FeedbackStatus, name="feedback_status"),
        nullable=False,
        default=FeedbackStatus.new,
        server_default=FeedbackStatus.new.value,
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
