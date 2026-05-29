"""Phase 05: user_attempts table

Revision ID: 0003_user_attempts
Revises: 0002_content_model
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_user_attempts"
down_revision: str | None = "0002_content_model"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_attempts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("practice_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column(
            "attempts_count",
            sa.SmallInteger(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "last_answered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["practice_item_id"], ["practice_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "practice_item_id", name="uq_user_attempts_user_item"),
    )
    op.create_index("ix_user_attempts_user_id", "user_attempts", ["user_id"])
    op.create_index(
        "ix_user_attempts_last_answered_at",
        "user_attempts",
        ["user_id", "last_answered_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_attempts_last_answered_at", table_name="user_attempts")
    op.drop_index("ix_user_attempts_user_id", table_name="user_attempts")
    op.drop_table("user_attempts")
