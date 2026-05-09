from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User, UserRole


async def test_register_requires_152fz_consent(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "new-user@example.com",
            "password": "password123",
            "consent_152fz": False,
        },
    )

    assert response.status_code == 422


async def test_register_returns_tokens_and_persists_consent(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "registered@example.com",
            "password": "password123",
            "consent_152fz": True,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]

    user = await db_session.scalar(
        select(User).where(User.email == "registered@example.com")
    )
    assert user is not None
    assert user.role == UserRole.user
    assert user.consent_152fz is True
    assert user.consent_at is not None


async def test_register_rejects_duplicate_email(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    db_session.add(
        User(
            email="duplicate@example.com",
            hashed_password="hashed",
            role=UserRole.user,
            consent_152fz=True,
            is_active=True,
        )
    )
    await db_session.flush()

    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "consent_152fz": True,
        },
    )

    assert response.status_code == 409
