from pathlib import Path

from sqlalchemy import inspect

from app.db.base import Base
from app.modules.tasks.models import ContentStatus, PracticeItem, Task, TaskDifficulty


def test_content_models_match_phase_contract() -> None:
    task_columns = {column.name for column in inspect(Task).columns}
    practice_columns = {column.name for column in inspect(PracticeItem).columns}

    assert {
        "ege_number",
        "slug",
        "title",
        "summary",
        "difficulty",
        "estimated_minutes",
        "theory_html",
        "theory_toc",
        "asset_manifest",
        "metadata",
        "status",
        "source_path",
        "source_hash",
        "published_at",
    } <= task_columns
    assert {
        "task_id",
        "source_key",
        "position",
        "year",
        "prompt_html",
        "code_block",
        "answer_pattern",
        "expected_value",
        "explanation_html",
    } <= practice_columns
    assert Task.__table__ in Base.metadata.tables.values()
    assert PracticeItem.__table__ in Base.metadata.tables.values()
    assert [item.value for item in TaskDifficulty] == ["basic", "medium", "high"]
    assert [item.value for item in ContentStatus] == ["draft", "published"]


def test_content_migration_declares_phase_tables_and_enums() -> None:
    migration = Path("alembic/versions/0002_content_model.py").read_text()

    assert 'down_revision: str | None = "0001_users_table"' in migration
    assert 'name="task_difficulty"' in migration
    assert 'name="content_status"' in migration
    assert "create_type=False" in migration
    assert '"tasks"' in migration
    assert '"practice_items"' in migration
    assert 'ondelete="CASCADE"' in migration
