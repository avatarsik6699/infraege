"""Phase 02 content model

Revision ID: 0002_content_model
Revises: 0001_users_table
Create Date: 2026-05-28

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_content_model"
down_revision: str | None = "0001_users_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    task_difficulty = postgresql.ENUM(
        "basic",
        "medium",
        "high",
        name="task_difficulty",
        create_type=False,
    )
    content_status = postgresql.ENUM(
        "draft",
        "published",
        name="content_status",
        create_type=False,
    )
    task_difficulty.create(op.get_bind(), checkfirst=True)
    content_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("ege_number", sa.SmallInteger(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("difficulty", task_difficulty, nullable=False),
        sa.Column("estimated_minutes", sa.SmallInteger(), nullable=True),
        sa.Column("theory_html", sa.Text(), nullable=False),
        sa.Column("theory_toc", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("asset_manifest", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("status", content_status, nullable=False, server_default="draft"),
        sa.Column("source_path", sa.String(length=300), nullable=False),
        sa.Column("source_hash", sa.CHAR(length=64), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "ege_number >= 1 AND ege_number <= 27",
            name="ck_tasks_ege_number_range",
        ),
        sa.CheckConstraint(
            "estimated_minutes IS NULL OR estimated_minutes > 0",
            name="ck_tasks_estimated_minutes_positive",
        ),
        sa.CheckConstraint("length(source_hash) = 64", name="ck_tasks_source_hash_len"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ege_number"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_tasks_slug", "tasks", ["slug"])
    op.create_index("ix_tasks_status", "tasks", ["status"])

    op.create_table(
        "practice_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_key", sa.String(length=80), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("year", sa.SmallInteger(), nullable=True),
        sa.Column("prompt_html", sa.Text(), nullable=False),
        sa.Column("code_block", postgresql.JSONB(), nullable=True),
        sa.Column("answer_pattern", sa.String(length=200), nullable=False),
        sa.Column("expected_value", sa.String(length=80), nullable=False),
        sa.Column("explanation_html", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("position >= 0", name="ck_practice_items_position_nonnegative"),
        sa.CheckConstraint("year IS NULL OR year >= 2000", name="ck_practice_items_year_min"),
        sa.CheckConstraint(
            "length(answer_pattern) <= 200",
            name="ck_practice_items_answer_pattern_len",
        ),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "source_key"),
    )
    op.create_index("ix_practice_items_task_id", "practice_items", ["task_id"])
    op.create_index("ix_practice_items_position", "practice_items", ["task_id", "position"])


def downgrade() -> None:
    op.drop_index("ix_practice_items_position", table_name="practice_items")
    op.drop_index("ix_practice_items_task_id", table_name="practice_items")
    op.drop_table("practice_items")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_slug", table_name="tasks")
    op.drop_table("tasks")
    op.execute("DROP TYPE IF EXISTS content_status")
    op.execute("DROP TYPE IF EXISTS task_difficulty")
