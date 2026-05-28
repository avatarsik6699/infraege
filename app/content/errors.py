from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ContentValidationError:
    source_path: Path
    field_path: str
    message: str

    def format(self) -> str:
        return f"{self.source_path}:{self.field_path}: {self.message}"


class ContentValidationException(Exception):
    def __init__(self, errors: list[ContentValidationError]) -> None:
        self.errors = errors
        super().__init__("\n".join(error.format() for error in errors))
