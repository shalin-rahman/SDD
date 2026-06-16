"""Field-level security filters for metadata responses (P23-T01)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from emcap.auth.models import CurrentUser
from emcap.auth.security import can_read_field
from emcap.entity.models import EntityDefinition
from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS


def _allowed_field_names(
    entity: EntityDefinition,
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None,
) -> set[str]:
    return {
        field.name
        for field in entity.fields
        if can_read_field(entity, field, user, field_overrides)
    }


def _strip_i18n_keys(data: dict[str, Any], allowed: set[str]) -> None:
    i18n = data.get("i18n")
    if not isinstance(i18n, dict):
        return
    for locale_payload in i18n.values():
        if not isinstance(locale_payload, dict):
            continue
        for key in list(locale_payload.keys()):
            if key not in allowed and not key.startswith("section."):
                locale_payload.pop(key, None)


def filter_form_metadata_dict(
    data: dict[str, Any],
    entity: EntityDefinition,
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None,
) -> dict[str, Any]:
    result = deepcopy(data)
    allowed = _allowed_field_names(entity, user, field_overrides)
    for section in result.get("sections", []):
        if section.get("code") != "main":
            continue
        section["fields"] = [
            field for field in section.get("fields", []) if field.get("name") in allowed
        ]
    _strip_i18n_keys(result, allowed)
    return result


def filter_grid_metadata_dict(
    data: dict[str, Any],
    entity: EntityDefinition,
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None,
) -> dict[str, Any]:
    result = deepcopy(data)
    allowed = _allowed_field_names(entity, user, field_overrides)
    system = set(GRID_SYSTEM_COLUMNS)
    result["columns"] = [
        column
        for column in result.get("columns", [])
        if column.get("field") in allowed or column.get("field") in system
    ]
    _strip_i18n_keys(result, allowed | system)
    return result
