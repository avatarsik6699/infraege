from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.models import Task, TaskDifficulty
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.schemas import (
    AssetManifestItem,
    PublicPracticePreview,
    PublicTaskDetail,
    PublicTaskSummary,
    TheoryTocItem,
)


class PublicTaskService:
    def __init__(self, session: AsyncSession) -> None:
        self._repository = TaskRepository(session)

    async def list_tasks(
        self,
        *,
        search: str | None = None,
        difficulty: TaskDifficulty | None = None,
    ) -> list[PublicTaskSummary]:
        tasks = await self._repository.list_published(search=search, difficulty=difficulty)
        return [self._to_summary(task) for task in tasks]

    async def get_task(self, slug: str) -> PublicTaskDetail | None:
        task = await self._repository.get_published_by_slug(slug)
        if task is None:
            return None

        summary = self._to_summary(task)
        return PublicTaskDetail(
            **summary.model_dump(),
            theory_html=task.theory_html,
            theory_toc=[TheoryTocItem.model_validate(item) for item in task.theory_toc],
            asset_manifest=[AssetManifestItem.model_validate(item) for item in task.asset_manifest],
            metadata=task.task_metadata,
            practice=[
                PublicPracticePreview(
                    id=item.id,
                    task_id=item.task_id,
                    position=item.position,
                    year=item.year,
                )
                for item in task.practice_items
            ],
        )

    @staticmethod
    def _to_summary(task: Task) -> PublicTaskSummary:
        return PublicTaskSummary(
            id=task.id,
            ege_number=task.ege_number,
            slug=task.slug,
            title=task.title,
            summary=task.summary,
            difficulty=task.difficulty,
            estimated_minutes=task.estimated_minutes,
            practice_count=len(task.practice_items),
            published_at=task.published_at,
        )
