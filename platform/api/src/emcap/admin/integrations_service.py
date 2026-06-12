from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from emcap.config.models import PlatformConfig
from emcap.integrations.adapters import RestAdapter
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

SECRET_INTEGRATION_PATHS: frozenset[str] = frozenset(
    {"integrations.webhook.signing_secret"}
)

ALLOWED_INTEGRATION_PATHS: frozenset[str] = frozenset(
    {
        "integrations.rest.base_url",
        "integrations.kafka.bootstrap",
        "integrations.kafka.topic_prefix",
        "integrations.soap.endpoint",
        "integrations.webhook.signing_secret",
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


def _validate_http_url(value: str, field: str) -> None:
    if not value.strip():
        return
    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        msg = f"{field} must be a valid http(s) URL"
        raise AdminValidationError(msg)


def _validate_integration_value(key: str, value: Any) -> Any:
    if not isinstance(value, str):
        msg = f"{key} must be a string"
        raise AdminValidationError(msg)
    trimmed = value.strip()
    if key in {"integrations.rest.base_url", "integrations.soap.endpoint"}:
        _validate_http_url(trimmed, key)
    if key == "integrations.kafka.bootstrap" and trimmed:
        if ":" not in trimmed and not trimmed.startswith("localhost"):
            msg = f"{key} must include host:port (e.g. localhost:9092)"
            raise AdminValidationError(msg)
    if (
        key == "integrations.kafka.topic_prefix"
        and trimmed
        and not trimmed.replace(".", "").replace("_", "").isalnum()
    ):
        msg = f"{key} must be alphanumeric (dots/underscores allowed)"
        raise AdminValidationError(msg)
    return trimmed


def _validate_integration_set(values: dict[str, Any]) -> None:
    bootstrap = values.get("integrations.kafka.bootstrap", "")
    topic_prefix = values.get("integrations.kafka.topic_prefix", "")
    if isinstance(bootstrap, str) and bootstrap.strip():
        if not isinstance(topic_prefix, str) or not topic_prefix.strip():
            msg = "integrations.kafka.topic_prefix is required when bootstrap is set"
            raise AdminValidationError(msg)


def _extract_integrations_view(config: PlatformConfig) -> dict[str, Any]:
    raw = config.model_dump(mode="json")
    view: dict[str, Any] = {}
    readable_paths = ALLOWED_INTEGRATION_PATHS - SECRET_INTEGRATION_PATHS
    for path in sorted(readable_paths):
        value = _get_nested(raw, path)
        if value is not None:
            relative = path.removeprefix("integrations.")
            _set_nested(view, relative, value)
    return view


def _masked_webhook_secret(session: Session) -> dict[str, Any]:
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key="integrations.webhook.signing_secret")
        .one_or_none()
    )
    if row is None or not row.value:
        return dict(UNCONFIGURED_SECRET_VALUE)
    return dict(MASKED_SECRET_VALUE)


def _apply_secret_masks(view: dict[str, Any], session: Session) -> None:
    masked = _masked_webhook_secret(session)
    _set_nested(view, "webhook.signing_secret", masked)


def _is_masked_secret_payload(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and "masked" in value
        and "configured" in value
    )


def _audit_payload_for(key: str, value: Any) -> dict[str, Any]:
    if key in SECRET_INTEGRATION_PATHS:
        return {"value": "[redacted]", "configured": bool(value)}
    return {"value": value}


def get_integrations(session: Session, config: PlatformConfig) -> dict[str, Any]:
    view = _extract_integrations_view(config)
    overrides = session.query(SettingOverrideRow).all()
    for row in overrides:
        if (
            row.key in ALLOWED_INTEGRATION_PATHS
            and row.key not in SECRET_INTEGRATION_PATHS
        ):
            relative = row.key.removeprefix("integrations.")
            _set_nested(view, relative, row.value)
    _apply_secret_masks(view, session)
    return {
        "integrations": view,
        "editable_paths": sorted(ALLOWED_INTEGRATION_PATHS),
        "write_only_paths": sorted(SECRET_INTEGRATION_PATHS),
    }


def update_integrations(
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

    flatten("integrations", updates)
    if not flat_updates:
        msg = "No integrations provided"
        raise AdminValidationError(msg)

    normalized: dict[str, Any] = {}
    for key, value in flat_updates.items():
        if key in SECRET_INTEGRATION_PATHS:
            if _is_masked_secret_payload(value):
                continue
            if not isinstance(value, str) or not value.strip():
                msg = f"{key} must be a non-empty string"
                raise AdminValidationError(msg)
            normalized[key] = value.strip()
            continue
        normalized[key] = _validate_integration_value(key, value)

    if not normalized:
        msg = "No integrations provided"
        raise AdminValidationError(msg)

    invalid = [key for key in normalized if key not in ALLOWED_INTEGRATION_PATHS]
    if invalid:
        msg = f"Unsupported integrations: {', '.join(invalid)}"
        raise AdminValidationError(msg)

    merged = dict(normalized)
    current = get_integrations(session, config)["integrations"]
    for path in ALLOWED_INTEGRATION_PATHS - SECRET_INTEGRATION_PATHS:
        if path not in merged:
            relative = path.removeprefix("integrations.")
            existing = _get_nested(current, relative)
            if isinstance(existing, str):
                merged[path] = existing
    _validate_integration_set(merged)

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
                action="integrations.update",
                target=key,
                payload=_audit_payload_for(key, value),
            )
        )

    session.commit()
    return get_integrations(session, config)


def test_rest_integration(
    session: Session,
    config: PlatformConfig,
    *,
    tenant_id: str,
) -> dict[str, Any]:
    data = get_integrations(session, config)
    rest = _get_nested(data["integrations"], "rest.base_url")
    if not isinstance(rest, str) or not rest.strip():
        msg = "integrations.rest.base_url is not configured"
        raise AdminValidationError(msg)
    _validate_http_url(rest, "integrations.rest.base_url")
    return RestAdapter(session, tenant_id=tenant_id).dispatch(
        rest.strip(),
        {"ping": True, "source": "admin.integrations.test"},
    )
