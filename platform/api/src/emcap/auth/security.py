from typing import Any

from emcap.auth.models import CurrentUser
from emcap.entity.models import EntityDefinition


def apply_field_security(
    entity: EntityDefinition,
    record: dict[str, Any],
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    if user is None or user.has_permission("*.*"):
        return record

    secured: dict[str, Any] = {
        key: value
        for key, value in record.items()
        if key in {
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "record_version",
            "deleted_at",
        }
    }
    for field in entity.fields:
        read_roles = field.read_roles
        if field_overrides:
            override_key = f"{entity.code}.{field.name}"
            if override_key in field_overrides:
                read_roles = field_overrides[override_key]
        if not read_roles:
            secured[field.name] = record.get(field.name)
            continue
        if any(user.has_permission(role) for role in read_roles):
            secured[field.name] = record.get(field.name)
    return secured


def can_access_record(
    *,
    user: CurrentUser | None,
    tenant_id: str,
    record: dict[str, Any],
    permission: str,
    user_tenant_id: str | None = None,
) -> bool:
    if user is None:
        return True
    if user.has_permission("*.*") or user.has_permission(permission):
        return True
    effective_tenant = user_tenant_id or user.tenant_id
    return effective_tenant == tenant_id
