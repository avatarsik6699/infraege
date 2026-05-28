import enum
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class TaskDifficulty(enum.StrEnum):
    basic = "basic"
    medium = "medium"
    high = "high"


class ContentStatus(enum.StrEnum):
    draft = "draft"
    published = "published"


class Task(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("ege_number >= 1 AND ege_number <= 27", name="ck_tasks_ege_number_range"),
        CheckConstraint(
            "estimated_minutes IS NULL OR estimated_minutes > 0",
            name="ck_tasks_estimated_minutes_positive",
        ),
        CheckConstraint("length(source_hash) = 64", name="ck_tasks_source_hash_len"),
    )

    ege_number: Mapped[int] = mapped_column(SmallInteger, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[TaskDifficulty] = mapped_column(
        Enum(TaskDifficulty, name="task_difficulty"),
        nullable=False,
    )
    estimated_minutes: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    theory_html: Mapped[str] = mapped_column(Text, nullable=False)
    theory_toc: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    asset_manifest: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    task_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status"),
        nullable=False,
        default=ContentStatus.draft,
        server_default=ContentStatus.draft.value,
    )
    source_path: Mapped[str] = mapped_column(String(300), nullable=False)
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    practice_items: Mapped[list["PracticeItem"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="PracticeItem.position",
    )


class PracticeItem(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "practice_items"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_practice_items_position_nonnegative"),
        CheckConstraint("year IS NULL OR year >= 2000", name="ck_practice_items_year_min"),
        CheckConstraint(
            "length(answer_pattern) <= 200",
            name="ck_practice_items_answer_pattern_len",
        ),
        UniqueConstraint("task_id", "source_key", name="uq_practice_items_task_source_key"),
    )

    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_key: Mapped[str] = mapped_column(String(80), nullable=False)
    position: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        default=0,
        server_default="0",
    )
    year: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    prompt_html: Mapped[str] = mapped_column(Text, nullable=False)
    code_block: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    answer_pattern: Mapped[str] = mapped_column(String(200), nullable=False)
    expected_value: Mapped[str] = mapped_column(String(80), nullable=False)
    explanation_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    task: Mapped[Task] = relationship(back_populates="practice_items")
