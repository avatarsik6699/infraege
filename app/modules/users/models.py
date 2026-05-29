import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class UserRole(enum.StrEnum):
    user = "user"
    admin = "admin"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(CITEXT(), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.user,
        nullable=False,
        server_default=UserRole.user.value,
    )
    consent_152fz: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    attempts: Mapped[list["UserAttempt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserAttempt(UUIDMixin, Base):
    __tablename__ = "user_attempts"
    __table_args__ = (
        UniqueConstraint("user_id", "practice_item_id", name="uq_user_attempts_user_item"),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    practice_item_id: Mapped[UUID] = mapped_column(
        ForeignKey("practice_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    attempts_count: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default="1"
    )
    last_answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    user: Mapped[User] = relationship(back_populates="attempts")
