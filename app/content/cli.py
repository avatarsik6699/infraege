import argparse
import asyncio
from pathlib import Path

from app.content.errors import ContentValidationException
from app.content.importer import import_content, validate_content


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.content")
    parser.add_argument("command", choices=["check", "import"])
    parser.add_argument("--content-root", default="content")
    args = parser.parse_args(argv)
    content_root = Path(args.content_root)

    try:
        if args.command == "check":
            documents = validate_content(content_root)
            print(f"content check passed: {len(documents)} task files")
            return 0
        count = asyncio.run(import_content(content_root))
        print(f"content import passed: {count} tasks upserted")
        return 0
    except ContentValidationException as exc:
        for error in exc.errors:
            print(error.format())
        return 1
    except Exception as exc:
        print(f"content {args.command} failed: {exc}")
        return 1
