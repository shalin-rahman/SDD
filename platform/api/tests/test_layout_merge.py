"""Unit tests for layout override merge helpers (P13-T31 / ADR-007)."""

from emcap.metadata.layout_merge import merge_form_metadata_dict, merge_grid_metadata_dict

_FORM_BASE = {
    "entity_code": "CUSTOMER",
    "sections": [
        {
            "code": "main",
            "fields": [
                {"name": "name", "row": 1, "col": 1, "span": 6, "read_only": False},
                {"name": "email", "row": 1, "col": 7, "span": 6, "read_only": False},
                {"name": "active", "row": 2, "col": 1, "span": 4, "read_only": False},
            ],
        },
        {
            "code": "system",
            "fields": [{"name": "created_at", "read_only": True}],
        },
    ],
}

_GRID_BASE = {
    "entity_code": "CUSTOMER",
    "columns": [
        {"field": "name", "sortable": True, "filterable": True, "width": 180},
        {"field": "email", "sortable": True, "filterable": True, "width": 200},
        {"field": "active", "sortable": True, "filterable": True, "width": 80},
        {"field": "created_at", "sortable": False, "filterable": False},
        {"field": "updated_at", "sortable": False, "filterable": False},
        {"field": "created_by", "sortable": False, "filterable": False},
        {"field": "updated_by", "sortable": False, "filterable": False},
        {"field": "record_version", "sortable": False, "filterable": False},
    ],
}


def test_merge_form_returns_copy_when_no_sections_override() -> None:
    result = merge_form_metadata_dict(_FORM_BASE, {})
    assert result is not _FORM_BASE
    assert result == _FORM_BASE


def test_merge_form_returns_copy_when_sections_empty() -> None:
    result = merge_form_metadata_dict(_FORM_BASE, {"sections": []})
    assert result == _FORM_BASE


def test_merge_form_reorders_and_patches_main_fields() -> None:
    override = {
        "sections": [
            {
                "code": "main",
                "fields": [
                    {"name": "email", "row": 2, "col": 1, "span": 12, "read_only": True},
                    {"name": "name", "row": 1, "col": 1, "span": 8, "read_only": False},
                ],
            }
        ]
    }
    result = merge_form_metadata_dict(_FORM_BASE, override)
    main_fields = result["sections"][0]["fields"]
    assert [field["name"] for field in main_fields] == ["email", "name"]
    email_field = main_fields[0]
    assert email_field["row"] == 2
    assert email_field["col"] == 1
    assert email_field["span"] == 12
    assert email_field["read_only"] is True
    assert result["sections"][1]["code"] == "system"


def test_merge_form_skips_unknown_section_codes() -> None:
    override = {"sections": [{"code": "unknown", "fields": [{"name": "name", "row": 9, "col": 9, "span": 1}]}]}
    result = merge_form_metadata_dict(_FORM_BASE, override)
    assert result["sections"][0]["fields"][0]["row"] == 1


def test_merge_grid_returns_copy_when_no_columns_override() -> None:
    result = merge_grid_metadata_dict(_GRID_BASE, {})
    assert result is not _GRID_BASE
    assert result == _GRID_BASE


def test_merge_grid_returns_copy_when_override_columns_empty() -> None:
    result = merge_grid_metadata_dict(_GRID_BASE, {"columns": []})
    assert result == _GRID_BASE


def test_merge_grid_reorders_business_columns_and_appends_system_columns() -> None:
    override = {
        "columns": [
            {"field": "active", "sortable": False, "filterable": False, "width": 60},
            {"field": "name", "sortable": True, "filterable": True, "width": 240},
        ]
    }
    result = merge_grid_metadata_dict(_GRID_BASE, override)
    fields = [column["field"] for column in result["columns"]]
    assert fields[:2] == ["active", "name"]
    assert fields[-5:] == ["created_at", "updated_at", "created_by", "updated_by", "record_version"]
    active_column = result["columns"][0]
    assert active_column["width"] == 60
    assert active_column["sortable"] is False
