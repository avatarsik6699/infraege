from pathlib import Path

import pytest

from app.content.assets import prepare_asset_manifest
from app.content.errors import ContentValidationException
from app.content.markdown import render_markdown


def test_markdown_renderer_extracts_toc_and_sanitizes_html() -> None:
    rendered = render_markdown("# Теория\n\n<script>alert(1)</script>\n\n## Подраздел")

    assert rendered.toc == [
        {"id": "теория", "title": "Теория", "level": 1},
        {"id": "подраздел", "title": "Подраздел", "level": 2},
    ]
    assert "<script>" not in rendered.html
    assert 'id="теория"' in rendered.html


def test_asset_manifest_reports_missing_references(tmp_path: Path) -> None:
    with pytest.raises(ContentValidationException) as exc_info:
        prepare_asset_manifest(["![alt](missing.png)"], tmp_path)

    assert exc_info.value.errors[0].field_path == "missing.png"


def test_asset_manifest_includes_image_dimensions(tmp_path: Path) -> None:
    from PIL import Image

    image_path = tmp_path / "diagram.png"
    Image.new("RGB", (2, 3)).save(image_path)

    manifest = prepare_asset_manifest(["![diagram](diagram.png)"], tmp_path)

    assert manifest[0].url.endswith("/diagram.png")
    assert manifest[0].width == 2
    assert manifest[0].height == 3
