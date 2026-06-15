"""P21-T02: migration file contracts and migrate.py smoke tests."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import pytest

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"
MIGRATE_SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "migrate.py"


def _read_sql(name: str) -> str:
    path = MIGRATIONS_DIR / name
    assert path.is_file(), f"missing migration file: {name}"
    return path.read_text(encoding="utf-8")


def test_migration_files_follow_naming_convention() -> None:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    assert files, "expected at least one migration file"
    for path in files:
        assert re.match(r"^\d{3}_.+\.sql$", path.name), path.name


def test_002_system_columns_sql_declares_pg_columns() -> None:
    sql = _read_sql("002_system_columns.sql")
    for column in ("created_by", "updated_by", "record_version", "deleted_at"):
        assert column in sql
    assert "ALTER TABLE entity_records" in sql
    assert "ADD COLUMN IF NOT EXISTS" in sql
    # PostgreSQL-specific type — must not be applied on SQLite local dev
    assert "TIMESTAMPTZ" in sql


def test_002_system_columns_sql_has_no_unterminated_statements() -> None:
    sql = _read_sql("002_system_columns.sql")
    statements = [line.strip() for line in sql.splitlines() if line.strip() and not line.strip().startswith("--")]
    for statement in statements:
        assert statement.endswith(";"), f"statement missing semicolon: {statement}"


def test_migrate_script_status_lists_002() -> None:
    result = subprocess.run(
        [sys.executable, str(MIGRATE_SCRIPT), "status"],
        cwd=MIGRATE_SCRIPT.parent.parent,
        capture_output=True,
        text=True,
        check=False,
        env={"DATABASE_URL": "sqlite:///:memory:", **__import__("os").environ},
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "002_system_columns.sql" in result.stdout


def test_migrate_script_applies_001_on_sqlite() -> None:
    """001 is a no-op SELECT; safe to apply in unit tests without Postgres."""
    result = subprocess.run(
        [sys.executable, str(MIGRATE_SCRIPT), "up", "--to", "001"],
        cwd=MIGRATE_SCRIPT.parent.parent,
        capture_output=True,
        text=True,
        check=False,
        env={"DATABASE_URL": "sqlite:///:memory:", **__import__("os").environ},
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "applied 001_baseline.sql" in result.stdout
