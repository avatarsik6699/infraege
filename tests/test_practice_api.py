from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.models import ContentStatus, PracticeItem, Task, TaskDifficulty


@pytest.fixture()
async def practice_catalog(db_session: AsyncSession) -> dict[str, Task]:
    published = Task(
        ege_number=1,
        slug="ege-01",
        title="Задание 1",
        summary="Графы",
        difficulty=TaskDifficulty.basic,
        estimated_minutes=5,
        theory_html="<h1 id='task-1'>Задание 1</h1>",
        theory_toc=[{"id": "task-1", "title": "Задание 1", "depth": 1}],
        asset_manifest=[],
        task_metadata={},
        status=ContentStatus.published,
        source_path="content/tasks/ege-01.md",
        source_hash="a" * 64,
        published_at=datetime(2026, 5, 1, tzinfo=UTC),
    )
    published.practice_items.extend(
        [
            PracticeItem(
                source_key="ege-01-001",
                position=1,
                year=2024,
                prompt_html="<p>Сколько будет 40 + 2?</p>",
                code_block={"language": "python", "title": "demo.py", "code": "print(40 + 2)"},
                answer_pattern=r"^42$",
                expected_value="42",
                explanation_html="<p>Складываем числа.</p>",
            ),
            PracticeItem(
                source_key="ege-01-002",
                position=2,
                year=None,
                prompt_html="<p>Введите слово ok</p>",
                code_block=None,
                answer_pattern=r"^ok$",
                expected_value="ok",
                explanation_html=None,
            ),
        ]
    )

    draft = Task(
        ege_number=2,
        slug="ege-02",
        title="Задание 2",
        summary="Черновик",
        difficulty=TaskDifficulty.medium,
        estimated_minutes=10,
        theory_html="<h1 id='task-2'>Задание 2</h1>",
        theory_toc=[],
        asset_manifest=[],
        task_metadata={},
        status=ContentStatus.draft,
        source_path="content/tasks/ege-02.md",
        source_hash="b" * 64,
        published_at=None,
    )
    draft.practice_items.append(
        PracticeItem(
            source_key="ege-02-001",
            position=1,
            year=2024,
            prompt_html="<p>Черновик</p>",
            code_block=None,
            answer_pattern=r"^2$",
            expected_value="2",
            explanation_html=None,
        )
    )

    unsafe = Task(
        ege_number=3,
        slug="ege-03",
        title="Задание 3",
        summary="Небезопасный шаблон",
        difficulty=TaskDifficulty.high,
        estimated_minutes=10,
        theory_html="<h1 id='task-3'>Задание 3</h1>",
        theory_toc=[],
        asset_manifest=[],
        task_metadata={},
        status=ContentStatus.published,
        source_path="content/tasks/ege-03.md",
        source_hash="c" * 64,
        published_at=None,
    )
    unsafe.practice_items.append(
        PracticeItem(
            source_key="ege-03-001",
            position=1,
            year=None,
            prompt_html="<p>Небезопасный шаблон</p>",
            code_block=None,
            answer_pattern=r"(.*)+",
            expected_value="unsafe",
            explanation_html=None,
        )
    )

    db_session.add_all([published, draft, unsafe])
    await db_session.flush()
    return {"published": published, "draft": draft, "unsafe": unsafe}


async def test_public_practice_returns_published_items_without_answer_internals(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    task = practice_catalog["published"]
    response = await client.get(f"/api/v1/public/practice/{task.id}")

    assert response.status_code == 200
    data = response.json()
    assert [item["position"] for item in data] == [1, 2]
    assert data[0]["taskId"] == str(task.id)
    assert data[0]["taskSlug"] == "ege-01"
    assert data[0]["taskTitle"] == "Задание 1"
    assert data[0]["egeNumber"] == 1
    assert data[0]["promptHtml"] == "<p>Сколько будет 40 + 2?</p>"
    assert data[0]["codeBlock"] == {
        "language": "python",
        "title": "demo.py",
        "code": "print(40 + 2)",
    }
    assert "expected_value" not in response.text
    assert "expectedValue" not in response.text
    assert "answer_pattern" not in response.text
    assert "answerPattern" not in response.text
    assert "validation" not in response.text


async def test_public_practice_hides_draft_and_missing_tasks(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    draft = practice_catalog["draft"]

    draft_response = await client.get(f"/api/v1/public/practice/{draft.id}")
    missing_response = await client.get(
        "/api/v1/public/practice/11111111-1111-1111-1111-111111111111"
    )

    assert draft_response.status_code == 404
    assert missing_response.status_code == 404


async def test_public_validation_returns_correct_and_incorrect_feedback(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    item = practice_catalog["published"].practice_items[0]

    correct_response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": str(item.id), "answer": " 42 "},
    )
    incorrect_response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": str(item.id), "answer": "41"},
    )

    assert correct_response.status_code == 200
    assert correct_response.json() == {
        "correct": True,
        "expectedValue": "42",
        "explanationHtml": "<p>Складываем числа.</p>",
    }
    assert incorrect_response.status_code == 200
    assert incorrect_response.json()["correct"] is False
    assert incorrect_response.json()["expectedValue"] == "42"


async def test_public_validation_hides_draft_items_and_missing_items(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    draft_item = practice_catalog["draft"].practice_items[0]

    draft_response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": str(draft_item.id), "answer": "2"},
    )
    missing_response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": "11111111-1111-1111-1111-111111111111", "answer": "2"},
    )

    assert draft_response.status_code == 404
    assert missing_response.status_code == 404


async def test_public_validation_caps_answer_length(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    item = practice_catalog["published"].practice_items[0]

    response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": str(item.id), "answer": "1" * 201},
    )

    assert response.status_code == 422


async def test_public_validation_rejects_unsafe_runtime_patterns(
    client: AsyncClient,
    practice_catalog: dict[str, Task],
) -> None:
    item = practice_catalog["unsafe"].practice_items[0]

    response = await client.post(
        "/api/v1/public/validate",
        json={"itemId": str(item.id), "answer": "aaaaaaaaaaaaaaaaaaaaaaaa"},
    )

    assert response.status_code == 422
    assert "aaaaaaaa" not in response.text
