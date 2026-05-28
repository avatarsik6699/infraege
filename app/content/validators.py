import hashlib
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError
from yaml import YAMLError

from app.content.errors import ContentValidationError, ContentValidationException
from app.content.schemas import ContentTaskDocument, ContentTaskFrontmatter
from app.core.regex_safety import UnsafeRegexPattern, ensure_safe_pattern

TASK_FILE_COUNT = 27


def load_content_documents(content_root: Path) -> list[ContentTaskDocument]:
    task_dir = content_root / "tasks"
    asset_root = content_root / "assets"
    errors: list[ContentValidationError] = []
    documents: list[ContentTaskDocument] = []

    for number in range(1, TASK_FILE_COUNT + 1):
        source_path = task_dir / f"ege-{number:02d}.md"
        if not source_path.exists():
            errors.append(ContentValidationError(source_path, "$", "task file is missing"))
            continue
        try:
            document = load_content_document(source_path, asset_root)
        except ContentValidationException as exc:
            errors.extend(exc.errors)
            continue
        documents.append(document)

    seen_numbers: set[int] = set()
    seen_slugs: set[str] = set()
    for document in documents:
        ege_number = document.frontmatter.ege_number
        slug = document.frontmatter.slug
        if ege_number in seen_numbers:
            errors.append(
                ContentValidationError(document.source_path, "ege_number", "duplicate ege_number")
            )
        if slug in seen_slugs:
            errors.append(ContentValidationError(document.source_path, "slug", "duplicate slug"))
        seen_numbers.add(ege_number)
        seen_slugs.add(slug)

    if errors:
        raise ContentValidationException(errors)
    return sorted(documents, key=lambda item: item.frontmatter.ege_number)


def load_content_document(source_path: Path, asset_root: Path) -> ContentTaskDocument:
    raw = source_path.read_text(encoding="utf-8")
    source_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    errors: list[ContentValidationError] = []

    frontmatter_text, theory_markdown = _split_frontmatter(raw, source_path, errors)
    frontmatter: ContentTaskFrontmatter | None = None
    if frontmatter_text is not None:
        try:
            parsed = yaml.safe_load(frontmatter_text)
        except YAMLError as exc:
            errors.append(ContentValidationError(source_path, "$", f"invalid YAML: {exc}"))
            parsed = None
        if not isinstance(parsed, dict):
            errors.append(ContentValidationError(source_path, "$", "frontmatter must be a mapping"))
        else:
            frontmatter = _validate_frontmatter(source_path, parsed, errors)

    if not theory_markdown.strip():
        errors.append(ContentValidationError(source_path, "body", "theory Markdown is required"))

    if frontmatter is not None:
        _validate_answer_metadata(source_path, frontmatter, errors)
        asset_dir = asset_root / frontmatter.slug
        if not asset_dir.is_dir():
            errors.append(ContentValidationError(source_path, "assets", f"missing {asset_dir}"))
    else:
        asset_dir = asset_root / source_path.stem

    if errors or frontmatter is None:
        raise ContentValidationException(errors)

    return ContentTaskDocument(
        source_path=source_path,
        source_hash=source_hash,
        frontmatter=frontmatter,
        theory_markdown=theory_markdown.strip(),
        asset_dir=asset_dir,
    )


def _split_frontmatter(
    raw: str,
    source_path: Path,
    errors: list[ContentValidationError],
) -> tuple[str | None, str]:
    if not raw.startswith("---\n"):
        errors.append(ContentValidationError(source_path, "$", "missing YAML frontmatter"))
        return None, raw
    try:
        _, frontmatter, body = raw.split("---\n", 2)
    except ValueError:
        errors.append(ContentValidationError(source_path, "$", "frontmatter must be closed"))
        return None, ""
    return frontmatter, body


def _validate_frontmatter(
    source_path: Path,
    parsed: dict[str, Any],
    errors: list[ContentValidationError],
) -> ContentTaskFrontmatter | None:
    try:
        return ContentTaskFrontmatter.model_validate(parsed)
    except ValidationError as exc:
        for error in exc.errors():
            field_path = ".".join(str(part) for part in error["loc"]) or "$"
            errors.append(ContentValidationError(source_path, field_path, error["msg"]))
        return None


def _validate_answer_metadata(
    source_path: Path,
    frontmatter: ContentTaskFrontmatter,
    errors: list[ContentValidationError],
) -> None:
    for index, item in enumerate(frontmatter.practice_items):
        field_prefix = f"practice_items.{index}"
        try:
            ensure_safe_pattern(item.answer_pattern)
        except UnsafeRegexPattern as exc:
            errors.append(
                ContentValidationError(source_path, f"{field_prefix}.answer_pattern", str(exc))
            )
