import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

TEST_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

if TEST_DATABASE_URL.startswith("sqlite"):
    from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler

    if not hasattr(SQLiteTypeCompiler, "visit_JSONB"):

        def _visit_JSONB(self, type_, **kw):  # noqa: N802
            return "JSON"

        SQLiteTypeCompiler.visit_JSONB = _visit_JSONB  # type: ignore[attr-defined]

    if not hasattr(SQLiteTypeCompiler, "visit_CITEXT"):

        def _visit_CITEXT(self, type_, **kw):  # noqa: N802
            return "TEXT"

        SQLiteTypeCompiler.visit_CITEXT = _visit_CITEXT  # type: ignore[attr-defined]

os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "14")

from app.core.rate_limit import limiter  # noqa: E402
from app.db.base import Base  # noqa
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.auth.utils import create_access_token, hash_password  # noqa: E402
from app.modules.tasks.models import PracticeItem, Task  # noqa: F401, E402
from app.modules.users.models import User, UserRole  # noqa: E402


class TemplateTestClient(AsyncClient):
    db_session: AsyncSession

    async def create_user_token(
        self,
        email: str,
        role: UserRole = UserRole.user,
        password: str = "Pass1234!",
    ) -> str:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            role=role,
            consent_152fz=True,
            is_active=True,
        )
        self.db_session.add(user)
        await self.db_session.flush()
        return create_access_token({"sub": str(user.id), "role": user.role.value})


@pytest.fixture(scope="session")
async def test_engine():
    if TEST_DATABASE_URL.startswith("sqlite"):
        engine = create_async_engine(
            TEST_DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture()
async def db_session(test_engine) -> AsyncSession:
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        existing_admin = await session.scalar(select(User).where(User.email == "admin@example.com"))
        if existing_admin is None:
            session.add(
                User(
                    email="admin@example.com",
                    hashed_password=hash_password("changeme123"),
                    role=UserRole.admin,
                    consent_152fz=True,
                    is_active=True,
                )
            )
            await session.flush()
        yield session
        await session.rollback()


@pytest.fixture()
async def client(db_session: AsyncSession) -> AsyncClient:
    limiter.reset()

    async def override_get_db() -> AsyncSession:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with TemplateTestClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        ac.db_session = db_session
        yield ac
    app.dependency_overrides.clear()
