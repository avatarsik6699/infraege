"""Dev/test user seeders."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import hash_password
from app.modules.users.models import User, UserRole
from app.seeders.base import BaseSeeder

_SEED_USERS = [
    {
        "email": "admin@example.com",
        "password": "Admin1234!",
        "role": UserRole.admin,
    },
    {
        "email": "user@example.com",
        "password": "User1234!",
        "role": UserRole.user,
    },
]

# Maps legacy dev.local addresses (created before R1 email fix) to canonical addresses.
# If a legacy row exists and the canonical row does not, the legacy row is migrated in-place.
_EMAIL_MIGRATIONS: dict[str, str] = {
    "admin@dev.local": "admin@example.com",
    "user@dev.local": "user@example.com",
}


class UserSeeder(BaseSeeder):
    name = "users"
    description = "dev admin + regular user (admin@example.com / user@example.com)"

    async def run(self, session: AsyncSession) -> int:
        inserted = 0

        spec_by_email = {s["email"]: s for s in _SEED_USERS}

        for old_email, new_email in _EMAIL_MIGRATIONS.items():
            canonical = await session.execute(select(User).where(User.email == new_email))
            if canonical.scalar_one_or_none() is not None:
                continue
            legacy = await session.execute(select(User).where(User.email == old_email))
            old_user = legacy.scalar_one_or_none()
            if old_user is None:
                continue
            spec = spec_by_email[new_email]
            old_user.email = new_email
            old_user.hashed_password = hash_password(spec["password"])
            old_user.role = spec["role"]
            old_user.is_active = True
            inserted += 1

        for spec in _SEED_USERS:
            existing = await session.execute(
                select(User).where(User.email == spec["email"])
            )
            existing_user = existing.scalar_one_or_none()
            if existing_user is not None:
                # Always re-hash to override migration placeholder passwords
                # (0001_users_table inserts admin@example.com with a hardcoded hash).
                existing_user.hashed_password = hash_password(spec["password"])
                existing_user.role = spec["role"]
                existing_user.is_active = True
            else:
                session.add(
                    User(
                        email=spec["email"],
                        hashed_password=hash_password(spec["password"]),
                        role=spec["role"],
                        consent_152fz=True,
                        consent_at=datetime.now(UTC),
                        is_active=True,
                    )
                )
                inserted += 1

        await session.commit()
        return inserted
