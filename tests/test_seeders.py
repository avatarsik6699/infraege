"""Integration tests for database seeders.

Covers the scenario where migration 0001_users_table inserts admin@example.com
with a placeholder password (changeme123). The UserSeeder must override it so
that Admin1234! / User1234! always work after SEED_ON_BOOT.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import hash_password, verify_password
from app.modules.users.models import User, UserRole
from app.seeders.users import UserSeeder


async def _seed(session: AsyncSession) -> int:
    return await UserSeeder().run(session)


# ---------------------------------------------------------------------------
# Scenario A: fresh DB (no pre-existing users)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_seeder_creates_admin_on_fresh_db(db_session: AsyncSession) -> None:
    """Seeder inserts admin@example.com when neither migration placeholder nor seed user exists."""
    existing = await db_session.scalar(select(User).where(User.email == "admin@example.com"))
    if existing is not None:
        await db_session.delete(existing)
        await db_session.flush()

    inserted = await _seed(db_session)
    assert inserted >= 1

    admin = await db_session.scalar(select(User).where(User.email == "admin@example.com"))
    assert admin is not None
    assert admin.role == UserRole.admin
    assert verify_password("Admin1234!", admin.hashed_password), (
        "Seeded admin password must match Admin1234!"
    )


# ---------------------------------------------------------------------------
# Scenario B: migration placeholder present (changeme123 hash)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_seeder_overrides_migration_placeholder_password(db_session: AsyncSession) -> None:
    """Seeder rewrites hashed_password even when admin@example.com already exists with old hash."""
    # Simulate state after 0001_users_table migration runs (placeholder password)
    existing = await db_session.scalar(select(User).where(User.email == "admin@example.com"))
    placeholder_hash = hash_password("changeme123")
    if existing is None:
        db_session.add(
            User(
                email="admin@example.com",
                hashed_password=placeholder_hash,
                role=UserRole.admin,
                consent_152fz=True,
                is_active=True,
            )
        )
        await db_session.flush()
    else:
        existing.hashed_password = placeholder_hash
        await db_session.flush()

    await _seed(db_session)

    admin = await db_session.scalar(select(User).where(User.email == "admin@example.com"))
    assert admin is not None
    assert not verify_password("changeme123", admin.hashed_password), (
        "Placeholder password must be replaced by seeder"
    )
    assert verify_password("Admin1234!", admin.hashed_password), (
        "Admin1234! must work after seeder runs"
    )


# ---------------------------------------------------------------------------
# Scenario C: login endpoint returns 200 after seeder runs
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_can_login_after_seeder(client: AsyncClient, db_session: AsyncSession) -> None:
    """POST /api/v1/public/auth/login with Admin1234! returns 200 after seeder re-hashes."""
    # Force seeder to run (re-hashes existing placeholder)
    await _seed(db_session)

    resp = await client.post(
        "/api/v1/public/auth/login",
        json={"email": "admin@example.com", "password": "Admin1234!"},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "access_token" in data
