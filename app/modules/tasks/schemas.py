from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

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


class TheoryTocItem(BaseModel):
    id: str
    title: str
    depth: int = Field(validation_alias=AliasChoices("depth", "level"))


class PublicPracticePreview(BaseModel):
    id: UUID
    task_id: UUID = Field(alias="taskId")
    position: int
    year: int | None

    model_config = ConfigDict(populate_by_name=True)


class PublicTaskSummary(BaseModel):
    id: UUID
    ege_number: int = Field(alias="egeNumber")
    slug: str
    title: str
    summary: str | None
    difficulty: TaskDifficulty
    estimated_minutes: int | None = Field(alias="estimatedMinutes")
    practice_count: int = Field(alias="practiceCount")
    published_at: datetime | None = Field(alias="publishedAt")

    model_config = ConfigDict(populate_by_name=True)


class PublicTaskDetail(PublicTaskSummary):
    theory_html: str = Field(alias="theoryHtml")
    theory_toc: list[TheoryTocItem] = Field(alias="theoryToc")
    asset_manifest: list[AssetManifestItem] = Field(alias="assetManifest")
    metadata: dict[str, Any]
    practice: list[PublicPracticePreview]
