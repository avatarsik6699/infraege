from datetime import UTC, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.models import PracticeItem, Task
from app.modules.users.models import User, UserAttempt
from app.modules.users.schemas import (
    ProfileMe,
    ProfileStats,
    RecentActivity,
    SyncAttemptItem,
    WeakTask,
)


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def add(self, user: User) -> User:
        self._session.add(user)
        await self._session.flush()
        return user

    async def delete(self, user: User) -> None:
        await self._session.delete(user)
        await self._session.flush()


def _as_utc(dt: datetime) -> datetime:
    """Normalize datetime to UTC-aware for comparison."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


class UserAttemptRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def bulk_sync(
        self,
        user_id: UUID,
        items: list[SyncAttemptItem],
    ) -> tuple[int, int]:
        """Upsert guest attempts. Returns (inserted, updated) counts."""
        synced = 0
        updated = 0
        for item in items:
            result = await self._session.execute(
                select(UserAttempt).where(
                    UserAttempt.user_id == user_id,
                    UserAttempt.practice_item_id == item.practice_item_id,
                )
            )
            existing = result.scalar_one_or_none()
            if existing is None:
                self._session.add(
                    UserAttempt(
                        user_id=user_id,
                        practice_item_id=item.practice_item_id,
                        is_correct=item.is_correct,
                        attempts_count=item.attempts_count,
                        last_answered_at=item.last_answered_at,
                    )
                )
                synced += 1
            else:
                existing.attempts_count += item.attempts_count
                if _as_utc(item.last_answered_at) > _as_utc(existing.last_answered_at):
                    existing.last_answered_at = item.last_answered_at
                existing.is_correct = item.is_correct
                updated += 1
        await self._session.flush()
        return synced, updated

    async def get_profile_me(self, user_id: UUID) -> ProfileMe:
        attempts_result = await self._session.execute(
            select(UserAttempt).where(UserAttempt.user_id == user_id)
        )
        attempts = list(attempts_result.scalars().all())

        if not attempts:
            return ProfileMe(
                stats=ProfileStats(
                    total_tasks=0,
                    solved_tasks=0,
                    correct_attempts=0,
                    total_attempts=0,
                    streak=0,
                    last_activity_at=None,
                ),
                weak_tasks=[],
                recent_activity=[],
            )

        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.is_correct)
        last_activity_at = max(a.last_answered_at for a in attempts)

        # Collect practice_item_ids to join with tasks
        practice_item_ids = [a.practice_item_id for a in attempts]
        items_result = await self._session.execute(
            select(PracticeItem, Task)
            .join(Task, PracticeItem.task_id == Task.id)
            .where(PracticeItem.id.in_(practice_item_ids))
        )
        item_task_map: dict[UUID, tuple[UUID, str, str, int]] = {}
        for pi, task in items_result.all():
            item_task_map[pi.id] = (task.id, task.slug, task.title, task.ege_number)

        # Build per-task accuracy stats
        task_stats: dict[UUID, dict] = {}
        for attempt in attempts:
            info = item_task_map.get(attempt.practice_item_id)
            if info is None:
                continue
            task_id, task_slug, task_title, ege_number = info
            if task_id not in task_stats:
                task_stats[task_id] = {
                    "task_slug": task_slug,
                    "task_title": task_title,
                    "ege_number": ege_number,
                    "solved_count": 0,
                    "total_count": 0,
                }
            task_stats[task_id]["total_count"] += attempt.attempts_count
            if attempt.is_correct:
                task_stats[task_id]["solved_count"] += 1

        total_tasks = len(task_stats)
        solved_tasks = sum(1 for s in task_stats.values() if s["solved_count"] > 0)

        # Bottom-5 weak tasks by accuracy
        task_accuracies = [
            WeakTask(
                task_id=task_id,
                task_slug=stats["task_slug"],
                task_title=stats["task_title"],
                ege_number=stats["ege_number"],
                solved_count=stats["solved_count"],
                total_count=stats["total_count"],
                accuracy=stats["solved_count"] / stats["total_count"] if stats["total_count"] > 0 else 0.0,
            )
            for task_id, stats in task_stats.items()
        ]
        task_accuracies.sort(key=lambda w: w.accuracy)
        weak_tasks = task_accuracies[:5]

        # Streak: consecutive calendar days ending today with activity
        days_with_activity: set[str] = set()
        for a in attempts:
            days_with_activity.add(_as_utc(a.last_answered_at).strftime("%Y-%m-%d"))

        streak = 0
        today = datetime.now(tz=UTC).date()
        current = today
        while current.isoformat() in days_with_activity:
            streak += 1
            current = current - timedelta(days=1)

        # Recent activity: last 30 days
        cutoff = datetime.now(tz=UTC) - timedelta(days=30)
        activity_map: dict[str, int] = {}
        for a in attempts:
            if _as_utc(a.last_answered_at) >= cutoff:
                day = _as_utc(a.last_answered_at).strftime("%Y-%m-%d")
                activity_map[day] = activity_map.get(day, 0) + a.attempts_count
        recent_activity = [
            RecentActivity(date=day, count=cnt)
            for day, cnt in sorted(activity_map.items())
        ]

        return ProfileMe(
            stats=ProfileStats(
                total_tasks=total_tasks,
                solved_tasks=solved_tasks,
                correct_attempts=correct_attempts,
                total_attempts=total_attempts,
                streak=streak,
                last_activity_at=last_activity_at,
            ),
            weak_tasks=weak_tasks,
            recent_activity=recent_activity,
        )
