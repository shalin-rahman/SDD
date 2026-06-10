from typing import Any

from emcap.auth.models import CurrentUser
from emcap.entity.models import EntityDefinition


def apply_field_security(
    entity: EntityDefinition,
    record: dict[str, Any],
    user: CurrentUser | None,
) -> dict[str, Any]:
    if user is None or user.has_permission("*.*"):
        return record

    secured: dict[str, Any] = {
        key: value for key, value in record.items() if key in {"id", "created_at", "updated_at"}
    }
    for field in entity.fields:
        if not field.read_roles:
            secured[field.name] = record.get(field.name)
            continue
        if any(user.has_permission(role) for role in field.read_roles):
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
