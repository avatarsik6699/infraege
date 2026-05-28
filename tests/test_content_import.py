from pathlib import Path
from socket import gaierror

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content import importer
from app.content.importer import import_content
from app.modules.tasks.models import PracticeItem, Task


async def test_content_import_upserts_tasks_and_practice_items(db_session: AsyncSession) -> None:
    count = await import_content(Path("content"), db_session)
    await db_session.flush()

    assert count == 27
    first = await db_session.scalar(select(Task).where(Task.slug == "ege-01"))
    assert first is not None
    assert first.theory_html
    assert first.theory_toc[0]["title"] == "Задание 1"

    second_count = await import_content(Path("content"), db_session)
    await db_session.flush()

    task_count = len((await db_session.execute(select(Task))).scalars().all())
    practice_count = len((await db_session.execute(select(PracticeItem))).scalars().all())
    assert second_count == 27
    assert task_count == 27
    assert practice_count == 27


def test_content_import_resolves_compose_db_hostname_for_host_cli(monkeypatch) -> None:
    monkeypatch.setattr(importer.Path, "exists", lambda self: False)

    def raise_gaierror(host: str, port: int) -> None:
        raise gaierror

    monkeypatch.setattr(importer, "getaddrinfo", raise_gaierror)

    url = importer._resolve_local_database_url(
        "postgresql+asyncpg://app_user:changeme@db:5432/template_app"
    )

    assert url.host == "localhost"
    assert url.port == 5432
