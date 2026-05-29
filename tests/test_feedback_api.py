"""Integration tests for the feedback API endpoints."""

from __future__ import annotations

import os
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import create_access_token, hash_password
from app.modules.feedback.models import FeedbackReport, FeedbackStatus
from app.modules.users.models import User, UserRole

os.environ.setdefault("FEEDBACK_IP_PEPPER", "test-pepper-value")


# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
async def admin_user(db_session: AsyncSession) -> User:
    unique = uuid4().hex[:8]
    user = User(
        email=f"admin_feedback_{unique}@example.com",
        hashed_password=hash_password("Pass1234!"),
        role=UserRole.admin,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture()
def admin_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
async def regular_user(db_session: AsyncSession) -> User:
    unique = uuid4().hex[:8]
    user = User(
        email=f"regular_fb_{unique}@example.com",
        hashed_password=hash_password("Pass1234!"),
        role=UserRole.user,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture()
def user_headers(regular_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(regular_user.id), "role": regular_user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
async def sample_report(db_session: AsyncSession) -> FeedbackReport:
    report = FeedbackReport(
        page_url="/topics",
        message="Test feedback message",
        ip_hash="a" * 64,
        user_agent="pytest/1.0",
    )
    db_session.add(report)
    await db_session.flush()
    return report


# ---------------------------------------------------------------------------
# POST /api/v1/public/feedback
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_feedback_ok(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/public/feedback",
        json={"page_url": "/topics", "message": "Отличный сайт!", "honeypot": ""},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


@pytest.mark.asyncio
async def test_submit_feedback_honeypot_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/public/feedback",
        json={"page_url": "/topics", "message": "Spam", "honeypot": "filled"},
    )
    # Honeypot rejection returns 200 ok=true to not leak detection
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


@pytest.mark.asyncio
async def test_submit_feedback_message_too_long(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/public/feedback",
        json={"page_url": "/topics", "message": "x" * 5001, "honeypot": ""},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_feedback_rate_limited(client: AsyncClient) -> None:
    # The default limit is 5/minute; hit it 6 times from same "ip"
    for _ in range(5):
        r = await client.post(
            "/api/v1/public/feedback",
            json={"page_url": "/topics", "message": "msg", "honeypot": ""},
        )
        assert r.status_code == 200

    r = await client.post(
        "/api/v1/public/feedback",
        json={"page_url": "/topics", "message": "should be limited", "honeypot": ""},
    )
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# GET /api/v1/admin/feedback
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_list_feedback_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/feedback")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_list_feedback_requires_admin_role(
    client: AsyncClient, user_headers: dict
) -> None:
    resp = await client.get("/api/v1/admin/feedback", headers=user_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_list_feedback_empty(
    client: AsyncClient, admin_headers: dict
) -> None:
    resp = await client.get("/api/v1/admin/feedback", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["per_page"] == 20


@pytest.mark.asyncio
async def test_admin_list_feedback_paginated(
    client: AsyncClient, admin_headers: dict, sample_report: FeedbackReport
) -> None:
    resp = await client.get(
        "/api/v1/admin/feedback?page=1&per_page=10", headers=admin_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    ids = [item["id"] for item in data["items"]]
    assert str(sample_report.id) in ids


@pytest.mark.asyncio
async def test_admin_list_feedback_filter_by_status(
    client: AsyncClient, admin_headers: dict, sample_report: FeedbackReport
) -> None:
    resp = await client.get(
        "/api/v1/admin/feedback?status=new", headers=admin_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    for item in data["items"]:
        assert item["status"] == "new"


# ---------------------------------------------------------------------------
# PATCH /api/v1/admin/feedback/{id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_patch_status(
    client: AsyncClient, admin_headers: dict, sample_report: FeedbackReport
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/feedback/{sample_report.id}",
        json={"status": "reviewed"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "reviewed"


@pytest.mark.asyncio
async def test_admin_patch_status_not_found(
    client: AsyncClient, admin_headers: dict
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/feedback/{uuid4()}",
        json={"status": "archived"},
        headers=admin_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_admin_patch_requires_admin(
    client: AsyncClient, user_headers: dict, sample_report: FeedbackReport
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/feedback/{sample_report.id}",
        json={"status": "reviewed"},
        headers=user_headers,
    )
    assert resp.status_code == 403
