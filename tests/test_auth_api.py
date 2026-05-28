"""Integration tests for /api/v1/public/auth/* endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth import create_access_token, hash_password
from app.modules.users import User, UserRole


@pytest.fixture()
async def test_user(db_session: AsyncSession) -> User:
    from uuid import uuid4

    unique = uuid4().hex[:8]
    user = User(
        email=f"test_user_{unique}@example.com",
        hashed_password=hash_password("testpass123"),
        role=UserRole.admin,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
def access_headers(test_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(test_user.id), "role": test_user.role.value})
    return {"Authorization": f"Bearer {token}"}


async def test_login_success(client: AsyncClient, test_user: User) -> None:
    resp = await client.post(
        "/api/v1/public/auth/login",
        json={"email": test_user.email, "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]


async def test_login_wrong_password(client: AsyncClient, test_user: User) -> None:
    resp = await client.post(
        "/api/v1/public/auth/login",
        json={"email": test_user.email, "password": "wrongpassword"},
    )
    assert resp.status_code == 401


async def test_login_validates_password_length(client: AsyncClient, test_user: User) -> None:
    resp = await client.post(
        "/api/v1/public/auth/login",
        json={"email": test_user.email, "password": "x" * 129},
    )
    assert resp.status_code == 422


async def test_login_rate_limit_blocks_abuse(client: AsyncClient, test_user: User) -> None:
    status_codes: list[int] = []
    for _ in range(21):
        response = await client.post(
            "/api/v1/public/auth/login",
            json={"email": test_user.email, "password": "wrongpassword"},
        )
        status_codes.append(response.status_code)

    assert 429 in status_codes


async def test_refresh_rotates_token_pair(client: AsyncClient, test_user: User) -> None:
    login = await client.post(
        "/api/v1/public/auth/login",
        json={"email": test_user.email, "password": "testpass123"},
    )
    old = login.json()

    refreshed = await client.post(
        "/api/v1/public/auth/refresh",
        json={"refresh_token": old["refresh_token"]},
    )
    assert refreshed.status_code == 200

    payload = refreshed.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"] != old["access_token"]
    assert payload["refresh_token"] != old["refresh_token"]


async def test_me_with_valid_token(
    client: AsyncClient,
    test_user: User,
    access_headers: dict[str, str],
) -> None:
    resp = await client.get("/api/v1/public/auth/me", headers=access_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == test_user.email
    assert data["role"] == test_user.role.value
    assert data["is_active"] is True
    assert data["consent_152fz"] is True
    assert "created_at" in data


async def test_me_without_token(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/public/auth/me")
    assert resp.status_code == 401


async def test_logout_with_valid_token(client: AsyncClient, access_headers: dict[str, str]) -> None:
    resp = await client.post("/api/v1/public/auth/logout", headers=access_headers)
    assert resp.status_code == 200
    assert resp.json() == {"message": "Logged out"}


async def test_logout_without_token(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/public/auth/logout")
    assert resp.status_code == 401


async def test_account_deletion_is_out_of_phase_01(
    client: AsyncClient,
    access_headers: dict[str, str],
) -> None:
    resp = await client.delete("/api/v1/public/auth/me", headers=access_headers)
    assert resp.status_code == 405
