#!/usr/bin/env python3
"""EMCAP database migration runner (Alembic-compatible stub).

Tracks applied SQL files in schema_migrations. Replace with Alembic when
schema complexity grows; keep semver + filename conventions from
docs/ops/release-process.md.

Usage:
    python scripts/migrate.py status
    python scripts/migrate.py up [--to VERSION]
    python scripts/migrate.py stamp VERSION
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

MIGRATION_PATTERN = re.compile(r"^(\d+)_.+\.sql$")
MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"
DEFAULT_DATABASE_URL = "sqlite:///./emcap.db"


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)


def normalize_url(url: str) -> str:
    """SQLAlchemy 2 accepts postgresql+psycopg; psycopg uses postgresql://."""
    return url


def get_engine() -> Engine:
    return create_engine(normalize_url(get_database_url()), future=True)


def ensure_migrations_table(engine: Engine) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(32) PRIMARY KEY,
                    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )


def list_migration_files() -> list[tuple[str, Path]]:
    if not MIGRATIONS_DIR.is_dir():
        return []
    files: list[tuple[str, Path]] = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        match = MIGRATION_PATTERN.match(path.name)
        if not match:
            print(f"warning: skipping {path.name} (expected NNN_name.sql)", file=sys.stderr)
            continue
        files.append((match.group(1), path))
    return files


def applied_versions(engine: Engine) -> set[str]:
    ensure_migrations_table(engine)
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT version FROM schema_migrations")).fetchall()
    return {str(row[0]) for row in rows}


def apply_migration(engine: Engine, version: str, path: Path) -> None:
    sql = path.read_text(encoding="utf-8").strip()
    with engine.begin() as conn:
        if sql:
            conn.execute(text(sql))
        conn.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:v)"),
            {"v": version},
        )
    print(f"applied {path.name}")


def cmd_status(engine: Engine) -> int:
    all_migrations = list_migration_files()
    applied = applied_versions(engine)
    if not all_migrations:
        print("no migration files in", MIGRATIONS_DIR)
        return 0
    for version, path in all_migrations:
        state = "applied" if version in applied else "pending"
        print(f"{version:>3}  [{state:>7}]  {path.name}")
    pending = [v for v, _ in all_migrations if v not in applied]
    print(f"\n{len(pending)} pending")
    return 0


def cmd_up(engine: Engine, target: str | None) -> int:
    all_migrations = list_migration_files()
    applied = applied_versions(engine)
    pending = [(v, p) for v, p in all_migrations if v not in applied]
    if not pending:
        print("database is up to date")
        return 0
    for version, path in pending:
        apply_migration(engine, version, path)
        if target is not None and version == target:
            break
    if target is not None and target not in applied_versions(engine):
        print(f"error: target version {target} not reached", file=sys.stderr)
        return 1
    return 0


def cmd_stamp(engine: Engine, version: str) -> int:
    files = dict(list_migration_files())
    if version not in files:
        print(f"error: unknown migration version {version}", file=sys.stderr)
        return 1
    ensure_migrations_table(engine)
    applied = applied_versions(engine)
    if version in applied:
        print(f"version {version} already stamped")
        return 0
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:v)"),
            {"v": version},
        )
    print(f"stamped {version} ({files[version].name})")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="EMCAP SQL migration runner")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show applied and pending migrations")

    up_parser = sub.add_parser("up", help="Apply pending migrations")
    up_parser.add_argument("--to", dest="target", help="Stop after this version")

    stamp_parser = sub.add_parser("stamp", help="Mark version applied without SQL")
    stamp_parser.add_argument("version", help="Migration version number, e.g. 001")

    args = parser.parse_args(argv)
    engine = get_engine()

    if args.command == "status":
        return cmd_status(engine)
    if args.command == "up":
        return cmd_up(engine, args.target)
    if args.command == "stamp":
        return cmd_stamp(engine, args.version)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
