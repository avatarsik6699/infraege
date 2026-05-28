from pathlib import Path

import pytest

from app.content.errors import ContentValidationException
from app.content.validators import load_content_documents


def test_loads_repository_content_skeleton() -> None:
    documents = load_content_documents(Path("content"))

    assert len(documents) == 27
    assert documents[0].frontmatter.ege_number == 1
    assert documents[-1].frontmatter.slug == "ege-27"


def test_validation_errors_include_source_and_field(tmp_path: Path) -> None:
    (tmp_path / "tasks").mkdir()
    (tmp_path / "assets").mkdir()
    (tmp_path / "tasks" / "ege-01.md").write_text(
        """---
ege_number: 1
slug: wrong
title: ""
difficulty: impossible
practice_items: []
---

# Broken
""",
        encoding="utf-8",
    )

    with pytest.raises(ContentValidationException) as exc_info:
        load_content_documents(tmp_path)

    formatted = "\n".join(error.format() for error in exc_info.value.errors)
    assert "tasks/ege-01.md:title" in formatted
    assert "tasks/ege-01.md:difficulty" in formatted
    assert "tasks/ege-02.md:$: task file is missing" in formatted


def test_answer_pattern_safety_errors_include_field_path(tmp_path: Path) -> None:
    (tmp_path / "tasks").mkdir()
    (tmp_path / "assets" / "ege-01").mkdir(parents=True)
    (tmp_path / "tasks" / "ege-01.md").write_text(
        """---
ege_number: 1
slug: ege-01
title: "Задание 1"
difficulty: basic
practice_items:
  - id: ege-01-001
    position: 1
    prompt: "Опасный шаблон"
    answer_pattern: "(.*)+"
    expected_value: "1"
---

# Theory
""",
        encoding="utf-8",
    )

    with pytest.raises(ContentValidationException) as exc_info:
        load_content_documents(tmp_path)

    assert any(
        error.field_path == "practice_items.0.answer_pattern" for error in exc_info.value.errors
    )
