"""Field-level security filters for metadata responses (P23-T01)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from emcap.auth.models import CurrentUser
from emcap.auth.security import can_read_field
from emcap.entity.models import EntityDefinition
from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS


def filter_form_metadata_dict(
    data: dict[str, Any],
    entity: EntityDefinition,
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None,
) -> dict[str, Any]:
    result = deepcopy(data)
    allowed = {
        field.name
        for field in entity.fields
        if can_read_field(entity, field, user, field_overrides)
    }
    for section in result.get("sections", []):
        if section.get("code") != "main":
            continue
        section["fields"] = [
            field for field in section.get("fields", []) if field.get("name") in allowed
        ]
    return result


def filter_grid_metadata_dict(
    data: dict[str, Any],
    entity: EntityDefinition,
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None,
) -> dict[str, Any]:
    result = deepcopy(data)
    allowed = {
        field.name
        for field in entity.fields
        if can_read_field(entity, field, user, field_overrides)
    }
    system = set(GRID_SYSTEM_COLUMNS)
    result["columns"] = [
        column
        for column in result.get("columns", [])
        if column.get("field") in allowed or column.get("field") in system
    ]
    return result
