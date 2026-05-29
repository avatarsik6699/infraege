"""Integration tests for progress sync and profile endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import create_access_token, hash_password
from app.modules.tasks.models import ContentStatus, PracticeItem, Task, TaskDifficulty
from app.modules.users.models import User, UserAttempt, UserRole

FIXED_DT = datetime(2026, 5, 29, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture()
async def auth_user(db_session: AsyncSession) -> User:
    unique = uuid4().hex[:8]
    user = User(
        email=f"progress_user_{unique}@example.com",
        hashed_password=hash_password("Pass1234!"),
        role=UserRole.user,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture()
def auth_headers(auth_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(auth_user.id), "role": auth_user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
async def sample_task(db_session: AsyncSession) -> Task:
    unique = uuid4().hex[:6]
    task = Task(
        ege_number=1,
        slug=f"test-task-{unique}",
        title="Test Task",
        difficulty=TaskDifficulty.basic,
        theory_html="<p>Theory</p>",
        source_path=f"content/tasks/test-{unique}.md",
        source_hash="a" * 64,
        status=ContentStatus.published,
    )
    db_session.add(task)
    await db_session.flush()
    return task


@pytest.fixture()
async def sample_practice_item(db_session: AsyncSession, sample_task: Task) -> PracticeItem:
    item = PracticeItem(
        task_id=sample_task.id,
        source_key="q1",
        position=0,
        prompt_html="<p>What is 2+2?</p>",
        answer_pattern="^4$",
        expected_value="4",
    )
    db_session.add(item)
    await db_session.flush()
    return item


# ── sync endpoint ──────────────────────────────────────────────────────────────

async def test_sync_unauthenticated(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={"attempts": []},
    )
    assert resp.status_code == 401


async def test_sync_empty_payload(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={"attempts": []},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 0
    assert data["updated"] == 0


async def test_sync_inserts_new_attempt(
    client: AsyncClient,
    auth_headers: dict[str, str],
    sample_practice_item: PracticeItem,
) -> None:
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={
            "attempts": [
                {
                    "practiceItemId": str(sample_practice_item.id),
                    "isCorrect": True,
                    "attemptsCount": 2,
                    "lastAnsweredAt": "2026-05-29T10:00:00Z",
                }
            ]
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 1
    assert data["updated"] == 0


async def test_sync_skips_unknown_practice_item(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={
            "attempts": [
                {
                    "practiceItemId": str(uuid4()),
                    "isCorrect": True,
                    "attemptsCount": 2,
                    "lastAnsweredAt": "2026-05-29T10:00:00Z",
                }
            ]
        },
        headers=auth_headers,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 0
    assert data["updated"] == 0


async def test_sync_skips_unknown_practice_item_and_syncs_valid_attempt(
    client: AsyncClient,
    auth_headers: dict[str, str],
    sample_practice_item: PracticeItem,
) -> None:
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={
            "attempts": [
                {
                    "practiceItemId": str(uuid4()),
                    "isCorrect": True,
                    "attemptsCount": 1,
                    "lastAnsweredAt": "2026-05-29T10:00:00Z",
                },
                {
                    "practiceItemId": str(sample_practice_item.id),
                    "isCorrect": True,
                    "attemptsCount": 2,
                    "lastAnsweredAt": "2026-05-29T10:00:00Z",
                },
            ]
        },
        headers=auth_headers,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 1
    assert data["updated"] == 0


async def test_sync_idempotency(
    client: AsyncClient,
    auth_headers: dict[str, str],
    sample_practice_item: PracticeItem,
) -> None:
    payload = {
        "attempts": [
            {
                "practiceItemId": str(sample_practice_item.id),
                "isCorrect": True,
                "attemptsCount": 3,
                "lastAnsweredAt": "2026-05-29T10:00:00Z",
            }
        ]
    }
    first = await client.post(
        "/api/v1/public/progress/sync",
        json=payload,
        headers=auth_headers,
    )
    assert first.status_code == 200
    assert first.json()["synced"] == 1

    second = await client.post(
        "/api/v1/public/progress/sync",
        json=payload,
        headers=auth_headers,
    )
    assert second.status_code == 200
    data = second.json()
    assert data["synced"] == 0
    assert data["updated"] == 1


async def test_sync_cap_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    attempts = [
        {
            "practiceItemId": str(uuid4()),
            "isCorrect": True,
            "attemptsCount": 1,
            "lastAnsweredAt": "2026-05-29T10:00:00Z",
        }
        for _ in range(301)
    ]
    resp = await client.post(
        "/api/v1/public/progress/sync",
        json={"attempts": attempts},
        headers=auth_headers,
    )
    assert resp.status_code == 422


# ── progress/me endpoint ───────────────────────────────────────────────────────

async def test_progress_me_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/public/progress/me")
    assert resp.status_code == 401


async def test_progress_me_empty(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    resp = await client.get("/api/v1/public/progress/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "stats" in data
    assert "weakTasks" in data
    assert "recentActivity" in data
    stats = data["stats"]
    assert stats["totalTasks"] == 0
    assert stats["totalAttempts"] == 0
    assert stats["streak"] == 0
    assert stats["lastActivityAt"] is None


async def test_progress_me_with_attempts(
    client: AsyncClient,
    auth_headers: dict[str, str],
    auth_user: User,
    db_session: AsyncSession,
    sample_practice_item: PracticeItem,
) -> None:
    db_session.add(
        UserAttempt(
            user_id=auth_user.id,
            practice_item_id=sample_practice_item.id,
            is_correct=True,
            attempts_count=3,
            last_answered_at=FIXED_DT,
        )
    )
    await db_session.flush()

    resp = await client.get("/api/v1/public/progress/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    stats = data["stats"]
    assert stats["totalAttempts"] == 1
    assert stats["correctAttempts"] == 1
    assert stats["totalTasks"] == 1
    assert stats["solvedTasks"] == 1
    assert data["weakTasks"] != [] or data["stats"]["totalTasks"] == 1


# ── DELETE /auth/me cascade ────────────────────────────────────────────────────

async def test_delete_me_cascades_attempts(
    client: AsyncClient,
    auth_user: User,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    sample_practice_item: PracticeItem,
) -> None:
    attempt = UserAttempt(
        user_id=auth_user.id,
        practice_item_id=sample_practice_item.id,
        is_correct=True,
        attempts_count=1,
        last_answered_at=FIXED_DT,
    )
    db_session.add(attempt)
    await db_session.flush()

    resp = await client.delete("/api/v1/public/auth/me", headers=auth_headers)
    assert resp.status_code == 204

    # Subsequent authenticated request returns 401 (token refers to deleted user)
    me_resp = await client.get("/api/v1/public/auth/me", headers=auth_headers)
    assert me_resp.status_code == 401
