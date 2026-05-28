import multiprocessing
import queue
import re
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.regex_safety import UnsafeRegexPattern, ensure_safe_pattern
from app.modules.tasks.models import PracticeItem, Task, TaskDifficulty
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.schemas import (
    AssetManifestItem,
    CodeBlock,
    PracticeValidationResponse,
    PublicPracticeItem,
    PublicPracticePreview,
    PublicTaskDetail,
    PublicTaskSummary,
    TheoryTocItem,
)

logger = structlog.get_logger("practice")

REGEX_MATCH_TIMEOUT_SECONDS = 0.5


class PracticeValidationUnavailable(RuntimeError):
    pass


def _regex_match_worker(pattern: str, answer: str, result_queue: multiprocessing.Queue) -> None:
    try:
        result_queue.put(("ok", re.fullmatch(pattern, answer) is not None))
    except re.error as exc:
        result_queue.put(("error", str(exc)))


def _safe_fullmatch(pattern: str, answer: str) -> bool:
    ensure_safe_pattern(pattern)
    start_method = (
        "forkserver" if "forkserver" in multiprocessing.get_all_start_methods() else "spawn"
    )
    context = multiprocessing.get_context(start_method)
    result_queue: multiprocessing.Queue = context.Queue(maxsize=1)
    process = context.Process(target=_regex_match_worker, args=(pattern, answer, result_queue))
    process.start()
    process.join(REGEX_MATCH_TIMEOUT_SECONDS)

    if process.is_alive():
        process.terminate()
        process.join()
        raise PracticeValidationUnavailable("Regex validation timed out")

    try:
        status, payload = result_queue.get_nowait()
    except queue.Empty as exc:
        raise PracticeValidationUnavailable("Regex validation failed") from exc

    if status == "error":
        raise UnsafeRegexPattern("Pattern is not a valid regex")

    return bool(payload)


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

    async def get_practice(self, task_id: UUID) -> list[PublicPracticeItem] | None:
        task = await self._repository.get_published_by_id(task_id)
        if task is None:
            return None

        return [self._to_practice_item(task, item) for item in task.practice_items]

    async def validate_answer(
        self,
        *,
        item_id: UUID,
        answer: str,
    ) -> PracticeValidationResponse | None:
        item = await self._repository.get_published_practice_item(item_id)
        if item is None:
            return None

        normalized_answer = answer.strip()
        try:
            correct = _safe_fullmatch(item.answer_pattern, normalized_answer)
        except (PracticeValidationUnavailable, UnsafeRegexPattern) as exc:
            logger.warning(
                "practice_validation_rejected",
                item_id=str(item.id),
                task_id=str(item.task_id),
                reason=exc.__class__.__name__,
            )
            raise

        return PracticeValidationResponse(
            correct=correct,
            expected_value=item.expected_value,
            explanation_html=item.explanation_html,
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

    @staticmethod
    def _to_practice_item(task: Task, item: PracticeItem) -> PublicPracticeItem:
        return PublicPracticeItem(
            id=item.id,
            task_id=task.id,
            task_slug=task.slug,
            task_title=task.title,
            ege_number=task.ege_number,
            position=item.position,
            year=item.year,
            prompt_html=item.prompt_html,
            code_block=CodeBlock.model_validate(item.code_block) if item.code_block else None,
        )
