from pathlib import Path
from socket import gaierror, getaddrinfo
from typing import Any

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.content.assets import prepare_asset_manifest
from app.content.markdown import render_inline_markdown, render_markdown
from app.content.schemas import ContentTaskDocument
from app.content.validators import load_content_documents
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.modules.tasks.models import PracticeItem, Task
from app.modules.tasks.repository import TaskRepository


def validate_content(content_root: Path) -> list[ContentTaskDocument]:
    return load_content_documents(content_root)


async def import_content(content_root: Path, session: AsyncSession | None = None) -> int:
    documents = validate_content(content_root)
    if session is None:
        session_factory, disposable_engine = _content_import_session_factory()
        try:
            async with session_factory() as managed_session:
                count = await import_documents(documents, managed_session)
                await managed_session.commit()
                return count
        finally:
            if disposable_engine is not None:
                await disposable_engine.dispose()
    return await import_documents(documents, session)


async def import_documents(documents: list[ContentTaskDocument], session: AsyncSession) -> int:
    repository = TaskRepository(session)
    for document in documents:
        task, practice_items = build_models(document)
        await repository.upsert_task(task, practice_items)
    return len(documents)


def build_models(document: ContentTaskDocument) -> tuple[Task, list[PracticeItem]]:
    frontmatter = document.frontmatter
    theory = render_markdown(document.theory_markdown)
    markdown_blocks = [document.theory_markdown]
    for item in frontmatter.practice_items:
        markdown_blocks.append(item.prompt)
        if item.explanation:
            markdown_blocks.append(item.explanation)
    asset_manifest = prepare_asset_manifest(markdown_blocks, document.asset_dir)

    task = Task(
        ege_number=frontmatter.ege_number,
        slug=frontmatter.slug,
        title=frontmatter.title,
        summary=frontmatter.summary,
        difficulty=frontmatter.difficulty,
        estimated_minutes=frontmatter.estimated_minutes,
        theory_html=theory.html,
        theory_toc=theory.toc,
        asset_manifest=[item.model_dump() for item in asset_manifest],
        task_metadata=frontmatter.metadata,
        status=frontmatter.status,
        source_path=document.source_path.as_posix(),
        source_hash=document.source_hash,
    )
    practice_items = [
        PracticeItem(
            source_key=item.id,
            position=item.position,
            year=item.year,
            prompt_html=render_inline_markdown(item.prompt),
            code_block=item.code_block.model_dump() if item.code_block else None,
            answer_pattern=item.answer_pattern,
            expected_value=item.expected_value,
            explanation_html=render_inline_markdown(item.explanation) if item.explanation else None,
        )
        for item in frontmatter.practice_items
    ]
    return task, practice_items


def _content_import_session_factory() -> tuple[async_sessionmaker[AsyncSession], Any | None]:
    database_url = _resolve_local_database_url(settings.DATABASE_URL)
    if database_url == settings.DATABASE_URL:
        return AsyncSessionLocal, None

    engine_kwargs: dict[str, Any] = {
        "echo": settings.APP_ENV == "development",
        "pool_pre_ping": True,
    }
    if not str(database_url).startswith("sqlite"):
        engine_kwargs["pool_recycle"] = 3600
        engine_kwargs["max_overflow"] = 10

    engine = create_async_engine(database_url, **engine_kwargs)
    return (
        async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        ),
        engine,
    )


def _resolve_local_database_url(database_url: str) -> str | URL:
    url = make_url(database_url)
    if url.host != "db" or Path("/.dockerenv").exists():
        return database_url

    try:
        getaddrinfo(url.host, url.port or 5432)
    except gaierror:
        return url.set(host="localhost")
    return database_url
