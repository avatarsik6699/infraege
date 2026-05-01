import re

from app.core.exceptions import AppException


class UnsafeRegexPattern(AppException):
    status_code = 422
    detail = "Unsafe regex pattern"


def ensure_safe_pattern(pattern: str) -> None:
    if len(pattern) > 200:
        raise UnsafeRegexPattern("Pattern is too long")

    deny_tokens = [
        r"(.*)+",
        r"(.+)+",
        r"(\\w+)+",
        r"(\\d+)+",
    ]
    if any(token in pattern for token in deny_tokens):
        raise UnsafeRegexPattern("Pattern contains potentially catastrophic nested quantifiers")

    try:
        re.compile(pattern)
    except re.error as exc:
        raise UnsafeRegexPattern("Pattern is not a valid regex") from exc
