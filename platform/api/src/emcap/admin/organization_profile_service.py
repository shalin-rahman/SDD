from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from pydantic import ValidationError
from sqlalchemy.orm import Session

from emcap.config.models import OrganizationProfileSettings, PlatformConfig
from emcap.documents.service import (
    LOGO_ENTITY_CODE,
    LOGO_RECORD_ID,
    DocumentService,
    document_content_url,
    guess_image_mime_type,
)
from emcap.documents.hooks import scan_document_content
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

ORG_PROFILE_PREFIX = "organization_profile"

_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_WEBSITE_RE = re.compile(r"^https?://", re.IGNORECASE)
_HEX_COLOR_RE = re.compile(r"^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$")
_ALLOWED_LOGO_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"})


class AdminValidationError(Exception):
    pass


def organization_profile_paths() -> frozenset[str]:
    """Flattened dot-paths for organization_profile settings overrides."""

    def walk(prefix: str, schema: dict[str, Any]) -> list[str]:
        paths: list[str] = []
        for key, value in schema.items():
            path = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                paths.extend(walk(path, value))
            else:
                paths.append(path)
        return paths

    sample = OrganizationProfileSettings().model_dump(mode="json")
    return frozenset(walk(ORG_PROFILE_PREFIX, sample))


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


def _deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _apply_overrides(profile: dict[str, Any], session: Session) -> dict[str, Any]:
    paths = organization_profile_paths()
    rows = session.query(SettingOverrideRow).filter(SettingOverrideRow.key.in_(paths)).all()
    for row in rows:
        relative = row.key.removeprefix(f"{ORG_PROFILE_PREFIX}.")
        _set_nested(profile, relative, row.value)
    return profile


def _validate_profile_fields(profile: dict[str, Any]) -> None:
    email = str(profile.get("email") or "").strip()
    if email and not _EMAIL_RE.match(email):
        msg = "organization_profile.email must be a valid email address"
        raise AdminValidationError(msg)

    website = str(profile.get("website") or "").strip()
    if website and not _WEBSITE_RE.match(website):
        msg = "organization_profile.website must start with http:// or https://"
        raise AdminValidationError(msg)

    currency = str(profile.get("currency") or "").strip().upper()
    if currency and not _CURRENCY_RE.match(currency):
        msg = "organization_profile.currency must be a 3-letter ISO code"
        raise AdminValidationError(msg)

    secondary = str(profile.get("secondary_color") or "").strip()
    if secondary and not _HEX_COLOR_RE.match(secondary):
        msg = "organization_profile.secondary_color must be a hex color"
        raise AdminValidationError(msg)

    try:
        OrganizationProfileSettings.model_validate(profile)
    except ValidationError as exc:
        msg = f"Invalid organization profile: {exc.errors()[0]['msg']}"
        raise AdminValidationError(msg) from exc


def get_organization_profile(session: Session, config: PlatformConfig) -> dict[str, Any]:
    base = config.organization_profile.model_dump(mode="json")
    merged = _apply_overrides(base, session)
    paths = organization_profile_paths()
    override_keys = sorted(
        row.key
        for row in session.query(SettingOverrideRow)
        .filter(SettingOverrideRow.key.in_(paths))
        .all()
    )
    return {
        "profile": merged,
        "editable_paths": sorted(paths),
        "override_paths": override_keys,
    }


def update_organization_profile(
    session: Session,
    config: PlatformConfig,
    updates: dict[str, Any],
    *,
    actor: str,
) -> dict[str, Any]:
    if not updates:
        msg = "No organization profile fields provided"
        raise AdminValidationError(msg)

    current = get_organization_profile(session, config)["profile"]
    merged = _deep_merge(current, updates)
    _validate_profile_fields(merged)

    flat_updates: dict[str, Any] = {}

    def flatten(prefix: str, value: Any) -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                flatten(f"{prefix}.{key}" if prefix else key, nested)
            return
        if prefix:
            flat_updates[prefix] = value

    flatten(ORG_PROFILE_PREFIX, updates)
    allowed = organization_profile_paths()
    invalid = [key for key in flat_updates if key not in allowed]
    if invalid:
        msg = f"Unsupported organization profile fields: {', '.join(invalid)}"
        raise AdminValidationError(msg)

    for key, value in flat_updates.items():
        row = session.query(SettingOverrideRow).filter_by(key=key).one_or_none()
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
                action="organization_profile.update",
                target=key,
                payload={"value": value},
            )
        )

    session.commit()
    return get_organization_profile(session, config)


def _validate_logo_file(filename: str, content: bytes, config: PlatformConfig) -> None:
    ext = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
    if ext not in _ALLOWED_LOGO_EXTENSIONS:
        allowed = ", ".join(sorted(_ALLOWED_LOGO_EXTENSIONS))
        msg = f"Logo must be an image file ({allowed})"
        raise AdminValidationError(msg)

    max_bytes = config.documents.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        msg = f"Logo exceeds max upload size ({config.documents.max_upload_size_mb} MB)"
        raise AdminValidationError(msg)

    if not content:
        msg = "Logo file is empty"
        raise AdminValidationError(msg)

    # Basic content-type sanity for SVG (reject script tags).
    if ext == ".svg":
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError as exc:
            msg = "Logo SVG must be valid UTF-8"
            raise AdminValidationError(msg) from exc
        if "<script" in text.lower():
            msg = "Logo SVG must not contain script tags"
            raise AdminValidationError(msg)


def upload_organization_logo(
    session: Session,
    config: PlatformConfig,
    *,
    filename: str,
    content: bytes,
    actor: str,
    tenant_id: str,
) -> dict[str, Any]:
    """Upload organization logo blob, virus-scan, persist, and set logo_url override."""

    _validate_logo_file(filename, content, config)

    scan_status = scan_document_content(content, enabled=config.documents.virus_scan_enabled)
    if scan_status == "infected":
        msg = "Logo failed virus scan"
        raise AdminValidationError(msg)

    doc_service = DocumentService(
        session,
        tenant_id=tenant_id,
        virus_scan_enabled=config.documents.virus_scan_enabled,
    )
    uploaded = doc_service.upload(
        entity_code=LOGO_ENTITY_CODE,
        record_id=LOGO_RECORD_ID,
        filename=filename,
        content=content,
    )

    logo_url = document_content_url(str(uploaded["id"]))
    mime = guess_image_mime_type(filename)
    update_organization_profile(
        session,
        config,
        {"logo_url": logo_url},
        actor=actor,
    )
    return {
        "logo_url": logo_url,
        "document_id": uploaded["id"],
        "filename": filename,
        "mime_type": mime,
        "virus_scan_status": uploaded["virus_scan_status"],
        "profile": get_organization_profile(session, config)["profile"],
    }
