"""Admin overrides for module report schedule_cron (P19 / Sprint 12)."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import AdminAuditRow, SettingOverrideRow
from emcap.reporting.models import ReportDefinition

REPORT_SCHEDULE_PREFIX = "report_schedule."

_CRON_RE = re.compile(r"^\S+\s+\S+\s+\S+\s+\S+\s+\S+(\s+\S+)?$")


class ReportScheduleValidationError(ValueError):
    pass


def _override_key(report_code: str) -> str:
    return f"{REPORT_SCHEDULE_PREFIX}{report_code.strip().upper()}"


def _load_overrides(session: Session) -> dict[str, str]:
    rows = session.query(SettingOverrideRow).filter(
        SettingOverrideRow.key.like(f"{REPORT_SCHEDULE_PREFIX}%")
    )
    result: dict[str, str] = {}
    for row in rows:
        code = row.key.removeprefix(REPORT_SCHEDULE_PREFIX)
        if isinstance(row.value, str) and row.value.strip():
            result[code] = row.value.strip()
        elif isinstance(row.value, dict):
            cron = str(row.value.get("schedule_cron", "")).strip()
            if cron:
                result[code] = cron
    return result


def get_effective_schedule_cron(
    session: Session,
    report_code: str,
    default: str | None,
) -> str | None:
    overrides = _load_overrides(session)
    code = report_code.strip().upper()
    return overrides.get(code, default)


def list_report_schedules(
    session: Session,
    definitions: dict[str, ReportDefinition],
) -> list[dict[str, Any]]:
    overrides = _load_overrides(session)
    schedules: list[dict[str, Any]] = []
    for code in sorted(definitions):
        definition = definitions[code]
        default = definition.schedule_cron
        effective = overrides.get(code, default)
        schedules.append(
            {
                "code": code,
                "name": definition.name,
                "entity_code": definition.entity_code,
                "default_schedule_cron": default,
                "schedule_cron": effective,
                "has_override": code in overrides,
            }
        )
    return schedules


def _validate_cron(schedule_cron: str) -> str:
    value = schedule_cron.strip()
    if not value:
        msg = "schedule_cron is required"
        raise ReportScheduleValidationError(msg)
    if not _CRON_RE.match(value):
        msg = "schedule_cron must be a valid cron expression (5 or 6 fields)"
        raise ReportScheduleValidationError(msg)
    return value


def put_report_schedule(
    session: Session,
    *,
    report_code: str,
    schedule_cron: str,
    actor: str,
    definitions: dict[str, ReportDefinition],
) -> dict[str, Any]:
    code = report_code.strip().upper()
    if code not in definitions:
        msg = f"Unknown report: {code}"
        raise ReportScheduleValidationError(msg)

    cron = _validate_cron(schedule_cron)
    key = _override_key(code)
    row = session.query(SettingOverrideRow).filter_by(key=key).one_or_none()
    if row is None:
        row = SettingOverrideRow(key=key, value=cron, updated_by=actor)
        session.add(row)
    else:
        row.value = cron
        row.updated_by = actor
        row.updated_at = datetime.now(UTC)

    session.add(
        AdminAuditRow(
            actor=actor,
            action="report_schedule.update",
            target=code,
            payload={"schedule_cron": cron},
        )
    )
    session.commit()

    definition = definitions[code]
    return {
        "code": code,
        "name": definition.name,
        "entity_code": definition.entity_code,
        "default_schedule_cron": definition.schedule_cron,
        "schedule_cron": cron,
        "has_override": True,
    }
