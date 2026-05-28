from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.models import ContentStatus, PracticeItem, Task, TaskDifficulty


@pytest.fixture()
async def task_catalog(db_session: AsyncSession) -> dict[str, Task]:
    published_basic = Task(
        ege_number=1,
        slug="ege-01",
        title="Задание 1",
        summary="Графы и таблицы истинности",
        difficulty=TaskDifficulty.basic,
        estimated_minutes=5,
        theory_html="<h1 id='task-1'>Задание 1</h1><p>Теория</p>",
        theory_toc=[{"id": "task-1", "title": "Задание 1", "level": 1}],
        asset_manifest=[
            {
                "url": "/assets/tasks/ege-01/schema.png",
                "alt": "Схема",
                "width": 640,
                "height": 360,
                "original_path": "content/assets/ege-01/schema.png",
                "optimized_path": None,
            }
        ],
        task_metadata={"keywords": ["графы"]},
        status=ContentStatus.published,
        source_path="content/tasks/ege-01.md",
        source_hash="a" * 64,
        published_at=datetime(2026, 5, 1, tzinfo=UTC),
    )
    published_basic.practice_items.append(
        PracticeItem(
            source_key="ege-01-001",
            position=1,
            year=2024,
            prompt_html="<p>Введите ответ</p>",
            code_block=None,
            answer_pattern="^42$",
            expected_value="42",
            explanation_html="<p>Ответ 42</p>",
        )
    )

    published_high = Task(
        ege_number=27,
        slug="ege-27",
        title="Задание 27",
        summary="Динамическое программирование",
        difficulty=TaskDifficulty.high,
        estimated_minutes=45,
        theory_html="<h1 id='task-27'>Задание 27</h1>",
        theory_toc=[{"id": "task-27", "title": "Задание 27", "depth": 1}],
        asset_manifest=[],
        task_metadata={},
        status=ContentStatus.published,
        source_path="content/tasks/ege-27.md",
        source_hash="b" * 64,
        published_at=None,
    )
    published_high.practice_items.append(
        PracticeItem(
            source_key="ege-27-001",
            position=1,
            year=None,
            prompt_html="<p>Введите ответ</p>",
            code_block={"language": "python", "code": "print(27)", "title": None},
            answer_pattern="^27$",
            expected_value="27",
            explanation_html=None,
        )
    )

    draft = Task(
        ege_number=2,
        slug="ege-02",
        title="Задание 2",
        summary="Черновик",
        difficulty=TaskDifficulty.medium,
        estimated_minutes=10,
        theory_html="<h1 id='task-2'>Задание 2</h1>",
        theory_toc=[{"id": "task-2", "title": "Задание 2", "depth": 1}],
        asset_manifest=[],
        task_metadata={},
        status=ContentStatus.draft,
        source_path="content/tasks/ege-02.md",
        source_hash="c" * 64,
        published_at=None,
    )
    draft.practice_items.append(
        PracticeItem(
            source_key="ege-02-001",
            position=1,
            year=2024,
            prompt_html="<p>Черновик</p>",
            code_block=None,
            answer_pattern="^2$",
            expected_value="2",
            explanation_html=None,
        )
    )

    db_session.add_all([published_basic, published_high, draft])
    await db_session.flush()
    return {"basic": published_basic, "high": published_high, "draft": draft}


async def test_public_catalog_returns_published_tasks_only(
    client: AsyncClient,
    task_catalog: dict[str, Task],
) -> None:
    response = await client.get("/api/v1/public/tasks")

    assert response.status_code == 200
    data = response.json()
    assert [item["slug"] for item in data] == ["ege-01", "ege-27"]
    assert data[0]["egeNumber"] == 1
    assert data[0]["practiceCount"] == 1
    assert data[0]["publishedAt"] == "2026-05-01T00:00:00Z"
    assert "ege-02" not in {item["slug"] for item in data}
    assert "expected_value" not in response.text
    assert "answer_pattern" not in response.text


async def test_public_catalog_filters_by_search_and_difficulty(
    client: AsyncClient,
    task_catalog: dict[str, Task],
) -> None:
    search_response = await client.get("/api/v1/public/tasks", params={"search": "динамическое"})
    assert search_response.status_code == 200
    assert [item["slug"] for item in search_response.json()] == ["ege-27"]

    difficulty_response = await client.get(
        "/api/v1/public/tasks",
        params={"difficulty": "basic"},
    )
    assert difficulty_response.status_code == 200
    assert [item["slug"] for item in difficulty_response.json()] == ["ege-01"]


async def test_public_task_detail_returns_public_theory_payload(
    client: AsyncClient,
    task_catalog: dict[str, Task],
) -> None:
    response = await client.get("/api/v1/public/tasks/ege-01")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "ege-01"
    assert data["theoryHtml"].startswith("<h1")
    assert data["theoryToc"] == [{"id": "task-1", "title": "Задание 1", "depth": 1}]
    assert data["assetManifest"][0]["alt"] == "Схема"
    assert data["metadata"] == {"keywords": ["графы"]}
    assert data["practice"] == [
        {
            "id": str(task_catalog["basic"].practice_items[0].id),
            "taskId": str(task_catalog["basic"].id),
            "position": 1,
            "year": 2024,
        }
    ]
    assert "expected_value" not in response.text
    assert "answer_pattern" not in response.text
    assert "validation" not in response.text


async def test_public_task_detail_hides_drafts_and_missing_slugs(
    client: AsyncClient,
    task_catalog: dict[str, Task],
) -> None:
    draft_response = await client.get("/api/v1/public/tasks/ege-02")
    missing_response = await client.get("/api/v1/public/tasks/not-found")

    assert draft_response.status_code == 404
    assert missing_response.status_code == 404
