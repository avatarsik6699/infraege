"""Phase 06: feedback_reports table

Revision ID: 0004_feedback_reports
Revises: 0003_user_attempts
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004_feedback_reports"
down_revision: str | None = "0003_user_attempts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    feedback_status = postgresql.ENUM(
        "new",
        "reviewed",
        "archived",
        name="feedback_status",
    )
    feedback_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "feedback_reports",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("page_url", sa.String(500), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("user_agent", sa.String(300), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "new",
                "reviewed",
                "archived",
                name="feedback_status",
                create_type=False,
            ),
            nullable=False,
            server_default="new",
        ),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feedback_reports_status", "feedback_reports", ["status"])
    op.create_index(
        "ix_feedback_reports_submitted_at",
        "feedback_reports",
        ["submitted_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_feedback_reports_submitted_at", table_name="feedback_reports")
    op.drop_index("ix_feedback_reports_status", table_name="feedback_reports")
    op.drop_table("feedback_reports")

    feedback_status = postgresql.ENUM(name="feedback_status")
    feedback_status.drop(op.get_bind(), checkfirst=True)
