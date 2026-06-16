"""Merge tenant layout overrides onto SDK metadata (ADR-007 / P13-T31)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS


def merge_form_metadata_dict(base: dict[str, Any], form_override: dict[str, Any]) -> dict[str, Any]:
    sections_override = form_override.get("sections")
    if not sections_override:
        return deepcopy(base)

    override_by_code = {
        section["code"]: section
        for section in sections_override
        if isinstance(section, dict) and section.get("code")
    }
    if not override_by_code:
        return deepcopy(base)

    result = deepcopy(base)
    merged_sections: list[dict[str, Any]] = []
    for section in result.get("sections", []):
        code = section.get("code")
        override_section = override_by_code.get(code)
        if override_section is None:
            merged_sections.append(section)
            continue

        field_overrides = {
            field["name"]: field
            for field in override_section.get("fields", [])
            if isinstance(field, dict) and field.get("name")
        }
        order = [field["name"] for field in override_section.get("fields", []) if field.get("name")]
        order_index = {name: index for index, name in enumerate(order)}

        patched_fields: list[dict[str, Any]] = []
        for field in section.get("fields", []):
            name = field.get("name")
            if name not in field_overrides:
                continue
            patched = deepcopy(field)
            override_field = field_overrides[name]
            for key in ("row", "col", "span", "read_only"):
                if key in override_field:
                    patched[key] = override_field[key]
            patched_fields.append(patched)

        if order:
            patched_fields.sort(key=lambda item: order_index.get(item.get("name"), 9999))

        section_copy = deepcopy(section)
        section_copy["fields"] = patched_fields
        merged_sections.append(section_copy)

    result["sections"] = merged_sections
    return result


def merge_grid_metadata_dict(base: dict[str, Any], grid_override: dict[str, Any]) -> dict[str, Any]:
    columns_override = grid_override.get("columns")
    if not columns_override:
        return deepcopy(base)

    override_by_field = {
        column["field"]: column
        for column in columns_override
        if isinstance(column, dict) and column.get("field")
    }
    if not override_by_field:
        return deepcopy(base)

    order = [column["field"] for column in columns_override if column.get("field")]
    order_index = {name: index for index, name in enumerate(order)}
    system = set(GRID_SYSTEM_COLUMNS)

    result = deepcopy(base)
    merged_columns: list[dict[str, Any]] = []
    for column in result.get("columns", []):
        field = column.get("field")
        if field in system:
            continue
        if field not in override_by_field:
            continue
        patched = deepcopy(column)
        override_column = override_by_field[field]
        for key in ("width", "sortable", "filterable"):
            if key in override_column:
                patched[key] = override_column[key]
        merged_columns.append(patched)

    merged_columns.sort(key=lambda item: order_index.get(item.get("field"), 9999))

    for column in result.get("columns", []):
        field = column.get("field")
        if field in system:
            merged_columns.append(column)

    result["columns"] = merged_columns
    return result
