"""Tenant layout override storage and admin API (P13-T31 / ADR-007)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.config.models import PlatformConfig
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS
from emcap.metadata.builder import build_form_metadata, build_grid_metadata
from emcap.metadata.layout_merge import merge_form_metadata_dict, merge_grid_metadata_dict
from emcap.persistence.database import AdminAuditRow, TenantLayoutOverrideRow


class LayoutValidationError(ValueError):
    pass


def _validate_override_fields(registry: EntityRegistry, entity_code: str, payload: dict[str, Any]) -> None:
    code = entity_code.strip().upper()
    try:
        entity = registry.get(code)
    except EntityRegistryError as exc:
        raise LayoutValidationError(str(exc)) from exc

    business_fields = {field.name for field in entity.fields}
    system_fields = set(GRID_SYSTEM_COLUMNS)

    form = payload.get("form")
    if isinstance(form, dict):
        for section in form.get("sections", []):
            if not isinstance(section, dict):
                continue
            for field in section.get("fields", []):
                if not isinstance(field, dict):
                    continue
                name = str(field.get("name", "")).strip()
                if not name:
                    raise LayoutValidationError("form field name is required")
                section_code = section.get("code")
                allowed = business_fields if section_code == "main" else business_fields | system_fields
                if name not in allowed:
                    raise LayoutValidationError(f"unknown form field: {name} on entity {code}")

    grid = payload.get("grid")
    if isinstance(grid, dict):
        for column in grid.get("columns", []):
            if not isinstance(column, dict):
                continue
            field = str(column.get("field", "")).strip()
            if not field:
                raise LayoutValidationError("grid column field is required")
            if field not in business_fields and field not in system_fields:
                raise LayoutValidationError(f"unknown grid column: {field} on entity {code}")


def load_layout_override(
    session: Session,
    *,
    tenant_id: str,
    entity_code: str,
) -> dict[str, Any] | None:
    row = (
        session.query(TenantLayoutOverrideRow)
        .filter_by(tenant_id=tenant_id, entity_code=entity_code.strip().upper())
        .one_or_none()
    )
    if row is None or not isinstance(row.payload, dict):
        return None
    return row.payload


def build_effective_metadata(
    registry: EntityRegistry,
    config: PlatformConfig,
    *,
    session: Session,
    tenant_id: str,
    entity_code: str,
) -> dict[str, Any]:
    code = entity_code.strip().upper()
    entity = registry.get(code)
    form_base = build_form_metadata(entity).model_dump(mode="json")
    grid_base = build_grid_metadata(entity, config).model_dump(mode="json")
    override = load_layout_override(session, tenant_id=tenant_id, entity_code=code)
    if override:
        if override.get("form"):
            form_base = merge_form_metadata_dict(form_base, override["form"])
        if override.get("grid"):
            grid_base = merge_grid_metadata_dict(grid_base, override["grid"])
    return {
        "entity_code": code,
        "form": form_base,
        "grid": grid_base,
        "has_override": override is not None,
    }


def get_layout_override(
    session: Session,
    *,
    tenant_id: str,
    entity_code: str,
) -> dict[str, Any]:
    override = load_layout_override(session, tenant_id=tenant_id, entity_code=entity_code)
    if override is None:
        msg = f"no layout override for entity {entity_code.strip().upper()}"
        raise LayoutValidationError(msg)
    return {"entity_code": entity_code.strip().upper(), "override": override}


def put_layout_override(
    session: Session,
    registry: EntityRegistry,
    *,
    tenant_id: str,
    entity_code: str,
    payload: dict[str, Any],
    actor: str,
) -> dict[str, Any]:
    code = entity_code.strip().upper()
    if not code:
        raise LayoutValidationError("entity_code is required")
    if not isinstance(payload, dict):
        raise LayoutValidationError("override payload must be an object")

    _validate_override_fields(registry, code, payload)

    row = (
        session.query(TenantLayoutOverrideRow)
        .filter_by(tenant_id=tenant_id, entity_code=code)
        .one_or_none()
    )
    if row is None:
        row = TenantLayoutOverrideRow(
            tenant_id=tenant_id,
            entity_code=code,
            payload=payload,
            updated_by=actor,
        )
        session.add(row)
    else:
        row.payload = payload
        row.updated_by = actor
        row.updated_at = datetime.now(UTC)

    session.add(
        AdminAuditRow(
            actor=actor,
            action="metadata.layout_override.update",
            target=f"{tenant_id}:{code}",
            payload={"keys": sorted(payload.keys())},
        )
    )
    session.commit()
    return {"entity_code": code, "override": payload}


def delete_layout_override(
    session: Session,
    *,
    tenant_id: str,
    entity_code: str,
    actor: str,
) -> dict[str, Any]:
    code = entity_code.strip().upper()
    row = (
        session.query(TenantLayoutOverrideRow)
        .filter_by(tenant_id=tenant_id, entity_code=code)
        .one_or_none()
    )
    if row is None:
        raise LayoutValidationError(f"no layout override for entity {code}")

    session.delete(row)
    session.add(
        AdminAuditRow(
            actor=actor,
            action="metadata.layout_override.delete",
            target=f"{tenant_id}:{code}",
            payload={},
        )
    )
    session.commit()
    return {"entity_code": code, "deleted": True}
