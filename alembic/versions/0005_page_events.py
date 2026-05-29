"""Phase 07: page_events table

Revision ID: 0005_page_events
Revises: 0004_feedback_reports
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_page_events"
down_revision: str | None = "0004_feedback_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "page_events",
        sa.Column("id", sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("referrer", sa.String(500), nullable=True),
        sa.Column("user_agent", sa.String(300), nullable=True),
        sa.Column("session_id", sa.String(16), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_page_events_path_created_at",
        "page_events",
        ["path", "created_at"],
    )
    op.create_index(
        "ix_page_events_created_at",
        "page_events",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_page_events_created_at", table_name="page_events")
    op.drop_index("ix_page_events_path_created_at", table_name="page_events")
    op.drop_table("page_events")
