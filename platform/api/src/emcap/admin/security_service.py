from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.auth.abac import DEFAULT_POLICIES, AbacPolicy
from emcap.config.models import PlatformConfig
from emcap.entity.registry import EntityRegistry
from emcap.persistence.database import AdminAuditRow, SettingOverrideRow

ABAC_OVERRIDE_KEY = "security.abac_policies"

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


def list_security_policies(registry: EntityRegistry) -> dict[str, Any]:
    entities: list[dict[str, Any]] = []
    for entity in registry.all():
        read_permission = f"{entity.code.lower()}.read"
        fields = [
            {
                "name": field.name,
                "read_roles": list(field.read_roles),
                "access": "restricted" if field.read_roles else "open",
            }
            for field in entity.fields
        ]
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
