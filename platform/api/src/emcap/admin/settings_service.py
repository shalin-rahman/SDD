from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.config.models import PlatformConfig
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

SECRET_SETTING_PATHS: frozenset[str] = frozenset(
    {"payments.stripe.secret_key"}
)

ALLOWED_SETTING_PATHS: frozenset[str] = frozenset(
    {
        "modules.workflow.enabled",
        "modules.payments.enabled",
        "modules.notifications.enabled",
        "modules.ai.enabled",
        "authentication.username_password",
        "authentication.oauth",
        "authentication.ldap",
        "authentication.sso",
        "notifications.email",
        "notifications.sms",
        "notifications.push",
        "notifications.whatsapp",
        "grid.export_excel",
        "grid.export_pdf",
        "grid.export_csv",
        "grid.grouping",
        "grid.realtime",
        "grid.offline",
        "workflow.enabled",
        "workflow.escalation",
        "workflow.delegation",
        "workflow.sla_tracking",
        "rules.scripting_enabled",
        "rules.formula_enabled",
        "payments.enabled",
        "payments.provider",
        "payments.stripe.publishable_key",
        "payments.stripe.secret_key",
        "ai.enabled",
        "audit.enabled",
        "audit.immutable",
        "tenants.default.theme",
        "tenants.default.domain",
        "tenants.default.primary_color",
        "tenants.default.logo_url",
        "documents.storage_backend",
        "documents.max_upload_size_mb",
        "documents.virus_scan_enabled",
        "documents.retention_days",
    }
)

MASKED_SECRET_VALUE = {"masked": "••••••••", "configured": True}
UNCONFIGURED_SECRET_VALUE = {"masked": "", "configured": False}


class AdminValidationError(Exception):
    pass


def _get_nested(data: dict[str, Any], path: str) -> Any:
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def _set_nested(data: dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    current = data
    for part in parts[:-1]:
        next_value = current.get(part)
        if not isinstance(next_value, dict):
            next_value = {}
            current[part] = next_value
        current = next_value
    current[parts[-1]] = value


def _extract_settings_view(config: PlatformConfig) -> dict[str, Any]:
    raw = config.model_dump(mode="json")
    view: dict[str, Any] = {}
    readable_paths = ALLOWED_SETTING_PATHS - SECRET_SETTING_PATHS
    for path in sorted(readable_paths):
        value = _get_nested(raw, path)
        if value is not None:
            _set_nested(view, path, value)
    return view


def _masked_secret_view(session: Session) -> dict[str, Any]:
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key="payments.stripe.secret_key")
        .one_or_none()
    )
    if row is None or not row.value:
        return dict(UNCONFIGURED_SECRET_VALUE)
    return dict(MASKED_SECRET_VALUE)


def _apply_secret_masks(view: dict[str, Any], session: Session) -> None:
    masked = _masked_secret_view(session)
    _set_nested(view, "payments.stripe.secret_key", masked)


def _is_masked_secret_payload(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and "masked" in value
        and "configured" in value
    )


def _audit_payload_for(key: str, value: Any) -> dict[str, Any]:
    if key in SECRET_SETTING_PATHS:
        return {"value": "[redacted]", "configured": bool(value)}
    return {"value": value}


def _override_paths(session: Session, allowed: frozenset[str]) -> list[str]:
    rows = session.query(SettingOverrideRow).filter(
        SettingOverrideRow.key.in_(allowed)
    )
    return sorted(row.key for row in rows.all())


def get_settings(session: Session, config: PlatformConfig) -> dict[str, Any]:
    view = _extract_settings_view(config)
    overrides = session.query(SettingOverrideRow).all()
    for row in overrides:
        if (
            row.key in ALLOWED_SETTING_PATHS
            and row.key not in SECRET_SETTING_PATHS
        ):
            _set_nested(view, row.key, row.value)
    _apply_secret_masks(view, session)
    override_keys = _override_paths(session, ALLOWED_SETTING_PATHS)
    return {
        "settings": view,
        "editable_paths": sorted(ALLOWED_SETTING_PATHS),
        "write_only_paths": sorted(SECRET_SETTING_PATHS),
        "override_paths": override_keys,
    }


def update_settings(
    session: Session,
    config: PlatformConfig,
    updates: dict[str, Any],
    *,
    actor: str,
) -> dict[str, Any]:
    flat_updates: dict[str, Any] = {}

    def flatten(prefix: str, value: Any) -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                flatten(f"{prefix}.{key}" if prefix else key, nested)
            return
        if prefix:
            flat_updates[prefix] = value

    flatten("", updates)
    if not flat_updates:
        msg = "No settings provided"
        raise AdminValidationError(msg)

    normalized: dict[str, Any] = {}
    for key, value in flat_updates.items():
        if key in SECRET_SETTING_PATHS:
            if _is_masked_secret_payload(value):
                continue
            if not isinstance(value, str) or not value.strip():
                msg = f"{key} must be a non-empty string"
                raise AdminValidationError(msg)
            normalized[key] = value.strip()
            continue
        normalized[key] = value

    if not normalized:
        msg = "No settings provided"
        raise AdminValidationError(msg)

    invalid = [key for key in normalized if key not in ALLOWED_SETTING_PATHS]
    if invalid:
        msg = f"Unsupported settings: {', '.join(invalid)}"
        raise AdminValidationError(msg)

    for key, value in normalized.items():
        row = (
            session.query(SettingOverrideRow)
            .filter_by(key=key)
            .one_or_none()
        )
        if row is None:
            row = SettingOverrideRow(key=key, value=value, updated_by=actor)
            session.add(row)
        else:
            row.value = value
            row.updated_by = actor
            row.updated_at = datetime.now(UTC)
        session.add(
            AdminAuditRow(
                actor=actor,
                action="settings.update",
                target=key,
                payload=_audit_payload_for(key, value),
            )
        )

    session.commit()
    return get_settings(session, config)


def list_admin_audit(session: Session, limit: int = 50) -> list[dict[str, Any]]:
    query = session.query(AdminAuditRow).order_by(AdminAuditRow.created_at.desc())
    rows = query.limit(limit).all()
    return [
        {
            "id": row.id,
            "actor": row.actor,
            "action": row.action,
            "target": row.target,
            "payload": row.payload,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
