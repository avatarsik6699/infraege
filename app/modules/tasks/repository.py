from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.tasks.models import ContentStatus, PracticeItem, Task, TaskDifficulty


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_slug(self, slug: str) -> Task | None:
        result = await self._session.execute(
            select(Task).options(selectinload(Task.practice_items)).where(Task.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_by_ege_number(self, ege_number: int) -> Task | None:
        result = await self._session.execute(
            select(Task)
            .options(selectinload(Task.practice_items))
            .where(Task.ege_number == ege_number)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Task]:
        result = await self._session.execute(
            select(Task).options(selectinload(Task.practice_items)).order_by(Task.ege_number)
        )
        return list(result.scalars().all())

    async def list_published(
        self,
        *,
        search: str | None = None,
        difficulty: TaskDifficulty | None = None,
    ) -> list[Task]:
        statement = (
            select(Task)
            .options(selectinload(Task.practice_items))
            .where(Task.status == ContentStatus.published)
            .order_by(Task.ege_number)
        )

        if difficulty is not None:
            statement = statement.where(Task.difficulty == difficulty)

        result = await self._session.execute(statement)
        tasks = list(result.scalars().all())

        normalized_search = search.casefold().strip() if search else ""
        if not normalized_search:
            return tasks

        return [
            task
            for task in tasks
            if normalized_search
            in " ".join(
                value
                for value in (task.title, task.summary, task.slug)
                if value is not None
            ).casefold()
        ]

    async def get_published_by_slug(self, slug: str) -> Task | None:
        result = await self._session.execute(
            select(Task)
            .options(selectinload(Task.practice_items))
            .where(Task.slug == slug, Task.status == ContentStatus.published)
        )
        return result.scalar_one_or_none()

    async def upsert_task(self, task: Task, practice_items: Iterable[PracticeItem]) -> Task:
        existing = await self.get_by_slug(task.slug)
        if existing is None:
            existing = await self.get_by_ege_number(task.ege_number)
        if existing is None:
            self._session.add(task)
            await self._session.flush()
            existing = task
            existing_by_key: dict[str, PracticeItem] = {}
        else:
            for field in (
                "ege_number",
                "title",
                "summary",
                "difficulty",
                "estimated_minutes",
                "theory_html",
                "theory_toc",
                "asset_manifest",
                "task_metadata",
                "status",
                "source_path",
                "source_hash",
                "published_at",
            ):
                setattr(existing, field, getattr(task, field))
            existing_by_key = {item.source_key: item for item in existing.practice_items}

        incoming_keys: set[str] = set()
        for item in practice_items:
            incoming_keys.add(item.source_key)
            current = existing_by_key.get(item.source_key)
            if current is None:
                item.task_id = existing.id
                self._session.add(item)
                continue
            for field in (
                "position",
                "year",
                "prompt_html",
                "code_block",
                "answer_pattern",
                "expected_value",
                "explanation_html",
            ):
                setattr(current, field, getattr(item, field))

        for source_key, item in list(existing_by_key.items()):
            if source_key not in incoming_keys:
                await self._session.delete(item)

        await self._session.flush()
        return existing
