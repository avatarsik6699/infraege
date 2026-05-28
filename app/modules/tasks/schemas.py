from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.tasks.models import ContentStatus, TaskDifficulty


class CodeBlock(BaseModel):
    language: str
    title: str | None = None
    code: str


class AssetManifestItem(BaseModel):
    url: str
    alt: str
    width: int | None = None
    height: int | None = None
    original_path: str
    optimized_path: str | None = None


class PracticeItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    source_key: str
    position: int
    year: int | None
    prompt_html: str
    code_block: CodeBlock | None
    answer_pattern: str
    expected_value: str
    explanation_html: str | None
    created_at: datetime
    updated_at: datetime


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ege_number: int
    slug: str
    title: str
    summary: str | None
    difficulty: TaskDifficulty
    estimated_minutes: int | None
    theory_html: str
    theory_toc: list[dict[str, Any]]
    asset_manifest: list[AssetManifestItem]
    metadata: dict[str, Any] = Field(alias="task_metadata")
    status: ContentStatus
    source_path: str
    source_hash: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
