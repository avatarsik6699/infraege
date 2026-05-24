"""Database seed runner.

Usage:
    uv run python scripts/seed.py
    uv run python scripts/seed.py --all
    uv run python scripts/seed.py --list
    uv run python scripts/seed.py --seeder NAME
    uv run python scripts/seed.py --dry-run
"""

import argparse
import asyncio
import sys

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.seeders import ALL_SEEDERS, REFERENCE_SEEDERS


async def _run(seeder_names: list[str] | None, dry_run: bool) -> None:
    candidates = [cls() for cls in ALL_SEEDERS]

    if seeder_names:
        by_name = {seeder.name: seeder for seeder in candidates}
        unknown = set(seeder_names) - by_name.keys()
        if unknown:
            print(f"error: unknown seeder(s): {', '.join(sorted(unknown))}", file=sys.stderr)
            print("run --list to see available seeders", file=sys.stderr)
            sys.exit(1)
        candidates = [by_name[name] for name in seeder_names]

    if not candidates:
        print("no seeders to run")
        return

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    try:
        async with session_factory() as session:
            for seeder in candidates:
                if dry_run:
                    print(f"[dry-run]  {seeder.name:<35} {seeder.description}")
                    continue
                count = await seeder.run(session)
                print(f"[seeded]   {seeder.name:<35} {count} row(s) inserted")
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run database seeders",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--seeder",
        action="append",
        dest="seeders",
        metavar="NAME",
        help="run a specific seeder by name; repeatable",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="run all registered seeders, including demo data",
    )
    parser.add_argument("--list", action="store_true", help="list registered seeders and exit")
    parser.add_argument("--dry-run", action="store_true", help="preview without writing")
    args = parser.parse_args()

    if args.list:
        print("registered seeders:")
        for cls in ALL_SEEDERS:
            seeder = cls()
            print(f"  {seeder.name:<35} {seeder.description}")
        sys.exit(0)

    selected_seeders = args.seeders
    if selected_seeders is None and not args.all:
        selected_seeders = REFERENCE_SEEDERS

    asyncio.run(_run(seeder_names=selected_seeders, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
