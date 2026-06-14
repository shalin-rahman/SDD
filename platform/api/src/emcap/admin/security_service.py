from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.auth.abac import DEFAULT_POLICIES, AbacPolicy
from emcap.config.models import PlatformConfig
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

ABAC_OVERRIDE_KEY = "security.abac_policies"
FIELD_OVERRIDES_KEY = "security.field_overrides"

ROW_ACCESS_RULE = (
    "can_access_record: granted when user has entity read permission "
    "or matching tenant_id"
)
FIELD_ACCESS_RULE = (
    "apply_field_security: empty read_roles = open to entity readers; "
    "non-empty requires a matching permission"
)


class SecurityValidationError(Exception):
    pass


def _deserialize_abac_policies(raw: list[dict[str, Any]]) -> list[AbacPolicy]:
    policies: list[AbacPolicy] = []
    for item in raw:
        policies.append(AbacPolicy(**item))
    return policies


def load_abac_policies(session: Session, config: PlatformConfig) -> list[AbacPolicy]:
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key=ABAC_OVERRIDE_KEY)
        .one_or_none()
    )
    if row is not None and isinstance(row.value, list):
        return _deserialize_abac_policies(row.value)
    if config.security.abac_policies:
        return [
            AbacPolicy(**policy.model_dump())
            for policy in config.security.abac_policies
        ]
    return list(DEFAULT_POLICIES)


def get_abac_policies(session: Session, config: PlatformConfig) -> dict[str, Any]:
    policies = load_abac_policies(session, config)
    return {"policies": [policy.model_dump() for policy in policies]}


def update_abac_policies(
    session: Session,
    config: PlatformConfig,
    policies: list[dict[str, Any]],
    *,
    actor: str,
) -> dict[str, Any]:
    if not isinstance(policies, list):
        msg = "policies must be a list"
        raise SecurityValidationError(msg)

    parsed: list[AbacPolicy] = []
    for index, item in enumerate(policies):
        if not isinstance(item, dict):
            msg = f"policy at index {index} must be an object"
            raise SecurityValidationError(msg)
        permission = str(item.get("permission", "")).strip()
        attribute = str(item.get("attribute", "")).strip()
        if not permission or not attribute:
            msg = f"policy at index {index} requires permission and attribute"
            raise SecurityValidationError(msg)
        parsed.append(
            AbacPolicy(
                permission=permission,
                effect=str(item.get("effect", "allow")),
                attribute=attribute,
                operator=str(item.get("operator", "equals")),
                value=str(item.get("value", "")),
            )
        )

    payload = [policy.model_dump() for policy in parsed]
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key=ABAC_OVERRIDE_KEY)
        .one_or_none()
    )
    if row is None:
        row = SettingOverrideRow(key=ABAC_OVERRIDE_KEY, value=payload, updated_by=actor)
        session.add(row)
    else:
        row.value = payload
        row.updated_by = actor
        row.updated_at = datetime.now(UTC)
    session.add(
        AdminAuditRow(
            actor=actor,
            action="security.abac.update",
            target=ABAC_OVERRIDE_KEY,
            payload={"count": len(payload)},
        )
    )
    session.commit()
    return get_abac_policies(session, config)


def _field_override_key(entity_code: str, field_name: str) -> str:
    return f"{entity_code}.{field_name}"


def load_field_overrides(session: Session) -> dict[str, list[str]]:
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key=FIELD_OVERRIDES_KEY)
        .one_or_none()
    )
    if row is None or not isinstance(row.value, dict):
        return {}
    overrides: dict[str, list[str]] = {}
    for key, roles in row.value.items():
        if isinstance(key, str) and isinstance(roles, list):
            overrides[key] = [str(role) for role in roles]
    return overrides


def effective_read_roles(
    entity_code: str,
    field_name: str,
    base_read_roles: list[str],
    field_overrides: dict[str, list[str]] | None,
) -> list[str]:
    if not field_overrides:
        return list(base_read_roles)
    key = _field_override_key(entity_code, field_name)
    if key in field_overrides:
        return list(field_overrides[key])
    return list(base_read_roles)


def update_field_access(
    session: Session,
    registry: EntityRegistry,
    *,
    entity_code: str,
    field_name: str,
    read_roles: list[str],
    actor: str,
) -> dict[str, Any]:
    code = entity_code.strip().upper()
    name = field_name.strip()
    if not code or not name:
        msg = "entity_code and field_name are required"
        raise SecurityValidationError(msg)
    if not isinstance(read_roles, list):
        msg = "read_roles must be a list"
        raise SecurityValidationError(msg)

    try:
        entity = registry.get(code)
    except EntityRegistryError as exc:
        raise SecurityValidationError(str(exc)) from exc

    if not any(field.name == name for field in entity.fields):
        msg = f"unknown field: {name} on entity {code}"
        raise SecurityValidationError(msg)

    normalized_roles = [str(role).strip() for role in read_roles if str(role).strip()]
    key = _field_override_key(code, name)
    row = (
        session.query(SettingOverrideRow)
        .filter_by(key=FIELD_OVERRIDES_KEY)
        .one_or_none()
    )
    payload: dict[str, list[str]] = {}
    if row is not None and isinstance(row.value, dict):
        payload = {
            str(item_key): [str(role) for role in roles]
            for item_key, roles in row.value.items()
            if isinstance(item_key, str) and isinstance(roles, list)
        }
    payload[key] = normalized_roles
    if row is None:
        row = SettingOverrideRow(key=FIELD_OVERRIDES_KEY, value=payload, updated_by=actor)
        session.add(row)
    else:
        row.value = payload
        row.updated_by = actor
        row.updated_at = datetime.now(UTC)
    session.add(
        AdminAuditRow(
            actor=actor,
            action="security.field_access.update",
            target=key,
            payload={"read_roles": normalized_roles},
        )
    )
    session.commit()
    return {
        "entity_code": code,
        "field_name": name,
        "read_roles": normalized_roles,
    }


def list_security_policies(
    registry: EntityRegistry,
    field_overrides: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    entities: list[dict[str, Any]] = []
    for entity in registry.all():
        read_permission = f"{entity.code.lower()}.read"
        fields = []
        for field in entity.fields:
            merged_roles = effective_read_roles(
                entity.code,
                field.name,
                field.read_roles,
                field_overrides,
            )
            fields.append(
                {
                    "name": field.name,
                    "read_roles": merged_roles,
                    "access": "restricted" if merged_roles else "open",
                }
            )
        entities.append(
            {
                "code": entity.code,
                "read_permission": read_permission,
                "row_access": "permission",
                "fields": fields,
            }
        )
    return {
        "entities": entities,
        "rules": {
            "row_access": ROW_ACCESS_RULE,
            "field_access": FIELD_ACCESS_RULE,
        },
    }
