from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.tasks.models import ContentStatus, TaskDifficulty


class SourceCodeBlock(BaseModel):
    language: str = Field(min_length=1, max_length=40)
    title: str | None = Field(default=None, max_length=120)
    code: str = Field(min_length=1)


class SourcePracticeItem(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    position: int = Field(ge=0, le=32767)
    year: int | None = Field(default=None, ge=2000, le=2100)
    prompt: str = Field(min_length=1)
    code_block: SourceCodeBlock | None = None
    answer_pattern: str = Field(min_length=1, max_length=200)
    expected_value: str = Field(min_length=1, max_length=80)
    explanation: str | None = None

    @field_validator("expected_value")
    @classmethod
    def expected_value_is_deterministic(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("expected_value must not be blank")
        if "\n" in normalized or "\r" in normalized:
            raise ValueError("expected_value must be a single line")
        return normalized


class ContentTaskFrontmatter(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ege_number: int = Field(ge=1, le=27)
    slug: str = Field(pattern=r"^ege-\d{2}[-a-z0-9]*$", max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str | None = None
    difficulty: TaskDifficulty
    estimated_minutes: int | None = Field(default=None, ge=1, le=240)
    status: ContentStatus = ContentStatus.draft
    metadata: dict[str, Any] = Field(default_factory=dict)
    practice_items: list[SourcePracticeItem] = Field(min_length=1)

    @model_validator(mode="after")
    def slug_matches_number(self) -> "ContentTaskFrontmatter":
        expected_prefix = f"ege-{self.ege_number:02d}"
        if not self.slug.startswith(expected_prefix):
            raise ValueError(f"slug must start with {expected_prefix}")
        return self


class ContentTaskDocument(BaseModel):
    source_path: Path
    source_hash: str
    frontmatter: ContentTaskFrontmatter
    theory_markdown: str
    asset_dir: Path

    @property
    def slug(self) -> str:
        return self.frontmatter.slug
