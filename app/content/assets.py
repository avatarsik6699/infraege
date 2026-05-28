import mimetypes
import re
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from app.content.errors import ContentValidationError, ContentValidationException
from app.modules.tasks.schemas import AssetManifestItem

IMAGE_SUFFIXES = {".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"}
MARKDOWN_ASSET_RE = re.compile(r"!\[[^\]]*]\((?P<path>[^)]+)\)")


def prepare_asset_manifest(markdown_blocks: list[str], asset_dir: Path) -> list[AssetManifestItem]:
    errors: list[ContentValidationError] = []
    referenced = _referenced_asset_names(markdown_blocks)
    existing = {path.name: path for path in asset_dir.iterdir() if path.is_file()}

    for name in sorted(referenced):
        if name not in existing:
            errors.append(ContentValidationError(asset_dir, name, "referenced asset is missing"))

    if errors:
        raise ContentValidationException(errors)

    manifest: list[AssetManifestItem] = []
    for path in sorted(existing.values()):
        if path.name == ".gitkeep":
            continue
        if path.suffix.lower() not in IMAGE_SUFFIXES:
            errors.append(ContentValidationError(path, "$", "unsupported asset type"))
            continue
        width, height = _image_size(path)
        manifest.append(
            AssetManifestItem(
                url=f"/assets/{asset_dir.name}/{path.name}",
                alt=path.stem.replace("-", " "),
                width=width,
                height=height,
                original_path=path.as_posix(),
            )
        )

    if errors:
        raise ContentValidationException(errors)
    return manifest


def _referenced_asset_names(markdown_blocks: list[str]) -> set[str]:
    names: set[str] = set()
    for markdown in markdown_blocks:
        for match in MARKDOWN_ASSET_RE.finditer(markdown):
            raw_path = match.group("path").split()[0].strip("<>")
            if raw_path.startswith(("http://", "https://", "/")):
                continue
            names.add(Path(raw_path).name)
    return names


def _image_size(path: Path) -> tuple[int | None, int | None]:
    if path.suffix.lower() == ".svg" or mimetypes.guess_type(path.name)[0] is None:
        return None, None
    try:
        with Image.open(path) as image:
            return image.width, image.height
    except (UnidentifiedImageError, OSError):
        return None, None
