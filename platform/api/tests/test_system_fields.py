"""Platform system fields — metadata injection and record persistence."""

import json
from pathlib import Path

from fastapi.testclient import TestClient

FIXTURES = Path(__file__).parent / "fixtures" / "metadata"


def _load_field_types_fixture() -> dict:
    return json.loads((FIXTURES / "product.field-types.json").read_text(encoding="utf-8"))


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def test_product_field_types_match_fixture(client: TestClient) -> None:
    fixture = _load_field_types_fixture()
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()
    assert form["entity_code"] == fixture["entity_code"]

    form_fields = {field["name"]: field for field in _main_form_fields(form)}
    grid_columns = {column["field"]: column for column in grid["columns"]}

    for spec in fixture["field_types"]:
        name = spec["name"]
        form_field = form_fields[name]
        grid_column = grid_columns[name]
        assert form_field["field_type"] == spec["field_type"]
        assert grid_column["field_type"] == spec["field_type"]
        if "lookup_entity" in spec:
            assert form_field["lookup_entity"] == spec["lookup_entity"]
            assert grid_column["lookup_entity"] == spec["lookup_entity"]
        if "currency_code" in spec:
            assert form_field["currency_code"] == spec["currency_code"]
            assert grid_column["currency_code"] == spec["currency_code"]
        if "span" in spec:
            assert form_field["span"] == spec["span"]
        if "options" in spec:
            assert form_field["options"] == spec["options"]


def test_product_field_types_fixture_web_mirror_matches(client: TestClient) -> None:
    repo_root = FIXTURES.parents[4]
    web_fixture = repo_root / "clients" / "web" / "src" / "assets" / "fixtures" / "metadata" / "product.field-types.json"
    if not web_fixture.is_file():
        return
    canonical = _load_field_types_fixture()
    mirror = json.loads(web_fixture.read_text(encoding="utf-8"))
    assert mirror == canonical


def test_product_field_types_fixture_mobile_support_reads_canonical() -> None:
    repo_root = FIXTURES.parents[4]
    mobile_support = (
        repo_root
        / "clients"
        / "mobile"
        / "test"
        / "support"
        / "field_types_fixture.dart"
    )
    assert mobile_support.is_file()
    source = mobile_support.read_text(encoding="utf-8")
    assert "product.field-types.json" in source
    canonical = _load_field_types_fixture()
    assert canonical["entity_code"] == "PRODUCT"
    assert len(canonical["field_types"]) == 4


def test_product_form_has_system_section(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    section_codes = [section["code"] for section in form["sections"]]
    assert section_codes == ["main", "system"]

    system_fields = form["sections"][1]["fields"]
    system_names = [field["name"] for field in system_fields]
    assert system_names == [
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "record_version",
        "deleted_at",
    ]
    assert all(field["read_only"] for field in system_fields)


def test_product_lookup_field_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()

    form_field = next(
        field for field in form["sections"][0]["fields"] if field["name"] == "primary_warehouse"
    )
    assert form_field["field_type"] == "lookup"
    assert form_field["lookup_entity"] == "WAREHOUSE"

    grid_column = next(column for column in grid["columns"] if column["field"] == "primary_warehouse")
    assert grid_column["field_type"] == "lookup"
    assert grid_column["lookup_entity"] == "WAREHOUSE"


def test_product_currency_and_textarea_field_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()

    price_field = next(
        field for field in form["sections"][0]["fields"] if field["name"] == "unit_price"
    )
    assert price_field["field_type"] == "currency"
    assert price_field["currency_code"] == "USD"

    price_column = next(column for column in grid["columns"] if column["field"] == "unit_price")
    assert price_column["field_type"] == "currency"
    assert price_column["currency_code"] == "USD"

    description_field = next(
        field for field in form["sections"][0]["fields"] if field["name"] == "description"
    )
    assert description_field["field_type"] == "textarea"
    assert description_field["span"] == 12

    description_column = next(column for column in grid["columns"] if column["field"] == "description")
    assert description_column["field_type"] == "textarea"


def test_product_metadata_status_field_contract(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()

    for payload in (form, grid):
        status = payload["display"]["status_field"]
        assert status["field"] == "active"
        assert status["active_values"] == [True]
        assert status["labels"]["active"]["en"] == "Active"
        assert status["labels"]["inactive"]["en"] == "Inactive"

    warehouse = client.get("/api/v1/metadata/forms/WAREHOUSE").json()
    status = warehouse["display"]["status_field"]
    assert status["field"] == "active"
    assert status["active_values"] == [True]
    assert status["labels"]["active"]["en"] == "Active"


def test_product_grid_includes_system_columns(client: TestClient) -> None:
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()
    fixture = json.loads((FIXTURES / "product.grid.keys.json").read_text(encoding="utf-8"))
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"]
    assert grid["i18n"]["en"]["created_at"] == "Created"


def test_create_record_sets_created_by_when_authenticated(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "sku": "SYS-TEST-001",
            "name": "System Field Probe",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "active": True,
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["created_by"] is not None
    assert body["created_at"]
    assert body["updated_at"]
    assert "created_at" not in body.get("sku", "")


def test_reject_system_fields_in_create_payload(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "SYS-TEST-002",
            "name": "Reject system injection",
            "created_at": "2099-01-01T00:00:00+00:00",
        },
    )
    assert response.status_code == 400
    assert "Cannot set system fields" in response.json()["detail"]


def test_update_sets_updated_by_and_version(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        headers=headers,
        json={
            "sku": "VER-001",
            "name": "Version probe",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "active": True,
        },
    )
    record_id = created.json()["id"]
    assert created.json()["record_version"] == 1

    updated = client.put(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        headers={**headers, "If-Match": "1"},
        json={"name": "Version probe v2"},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["record_version"] == 2
    assert body["updated_by"] is not None


def test_version_conflict_returns_409(client: TestClient) -> None:
    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "VER-002",
            "name": "Conflict",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "active": True,
        },
    )
    record_id = created.json()["id"]
    conflict = client.put(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        headers={"If-Match": "99"},
        json={"name": "Stale"},
    )
    assert conflict.status_code == 409


def test_soft_delete_and_restore(client: TestClient) -> None:
    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "SOFT-001",
            "name": "Soft delete",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "active": True,
        },
    )
    record_id = created.json()["id"]

    deleted = client.delete(f"/api/v1/entities/PRODUCT/records/{record_id}")
    assert deleted.status_code == 200
    assert deleted.json()["deleted_at"] is not None

    listed = client.get("/api/v1/entities/PRODUCT/records").json()["records"]
    assert not any(row["id"] == record_id for row in listed)

    restored = client.post(f"/api/v1/entities/PRODUCT/records/{record_id}/restore")
    assert restored.status_code == 200
    assert restored.json()["deleted_at"] is None


def _seed_warehouse(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={
            "code": "WH-LOOKUP",
            "name": "Lookup Test Warehouse",
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_record_accepts_valid_lookup_reference(client: TestClient) -> None:
    warehouse = _seed_warehouse(client)
    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "LOOKUP-OK",
            "name": "Lookup OK",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "primary_warehouse": warehouse["id"],
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["primary_warehouse"] == warehouse["id"]


def test_create_record_rejects_unknown_lookup_reference(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "LOOKUP-BAD",
            "name": "Lookup Bad",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "primary_warehouse": "00000000-0000-0000-0000-000000000000",
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for primary_warehouse" in response.json()["detail"]


def test_create_record_rejects_deleted_lookup_reference(client: TestClient) -> None:
    warehouse = _seed_warehouse(client)
    warehouse_id = warehouse["id"]
    deleted = client.delete(f"/api/v1/entities/WAREHOUSE/records/{warehouse_id}")
    assert deleted.status_code == 200

    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "LOOKUP-DEL",
            "name": "Lookup Deleted Target",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 0,
            "primary_warehouse": warehouse_id,
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for primary_warehouse" in response.json()["detail"]
