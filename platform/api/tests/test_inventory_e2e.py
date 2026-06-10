import json
from pathlib import Path

from fastapi.testclient import TestClient

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "metadata"


def _seed_product(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "SKU-001",
            "name": "Widget A",
            "unit_price": 9.99,
            "quantity_on_hand": 100,
            "reorder_level": 10,
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def _seed_warehouse(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={
            "code": "WH-01",
            "name": "Main Warehouse",
            "location": "Building A",
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_inventory_module_entities_loaded(client: TestClient) -> None:
    response = client.get("/api/v1/entities")
    assert response.status_code == 200
    entities = response.json()["entities"]
    assert "PRODUCT" in entities
    assert "WAREHOUSE" in entities


def test_product_crud(client: TestClient) -> None:
    created = _seed_product(client)
    record_id = created["id"]
    assert created["sku"] == "SKU-001"

    fetched = client.get(f"/api/v1/entities/PRODUCT/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Widget A"

    updated = client.put(
        f"/api/v1/entities/PRODUCT/records/{record_id}",
        json={"quantity_on_hand": 95},
    )
    assert updated.status_code == 200
    assert updated.json()["quantity_on_hand"] == 95

    deleted = client.delete(f"/api/v1/entities/PRODUCT/records/{record_id}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/entities/PRODUCT/records/{record_id}")
    assert missing.status_code == 404


def test_warehouse_crud(client: TestClient) -> None:
    created = _seed_warehouse(client)
    record_id = created["id"]
    assert created["code"] == "WH-01"

    fetched = client.get(f"/api/v1/entities/WAREHOUSE/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["location"] == "Building A"

    updated = client.put(
        f"/api/v1/entities/WAREHOUSE/records/{record_id}",
        json={"name": "Central Warehouse"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Central Warehouse"

    deleted = client.delete(f"/api/v1/entities/WAREHOUSE/records/{record_id}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/entities/WAREHOUSE/records/{record_id}")
    assert missing.status_code == 404


def test_product_form_metadata_api(client: TestClient) -> None:
    response = client.get("/api/v1/metadata/forms/PRODUCT")
    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1.0"
    assert body["entity_code"] == "PRODUCT"
    assert body["sections"][0]["fields"][0]["name"] == "sku"


def test_product_grid_metadata_api(client: TestClient) -> None:
    response = client.get("/api/v1/metadata/grids/PRODUCT")
    assert response.status_code == 200
    body = response.json()
    assert body["entity_code"] == "PRODUCT"
    assert body["export"]["excel"] is True
    assert len(body["columns"]) == 6


def test_product_metadata_contract_keys(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PRODUCT").json()
    grid = client.get("/api/v1/metadata/grids/PRODUCT").json()

    expected_form_keys = {"schema_version", "entity_code", "sections", "conditions", "i18n"}
    expected_grid_keys = {
        "schema_version",
        "entity_code",
        "columns",
        "export",
        "grouping",
        "realtime",
        "offline",
        "i18n",
    }
    assert expected_form_keys.issubset(form.keys())
    assert expected_grid_keys.issubset(grid.keys())

    fixture_form = json.loads((FIXTURES / "product.form.keys.json").read_text(encoding="utf-8"))
    fixture_grid = json.loads((FIXTURES / "product.grid.keys.json").read_text(encoding="utf-8"))
    assert fixture_form["field_names"] == [field["name"] for field in form["sections"][0]["fields"]]
    assert fixture_grid["column_fields"] == [column["field"] for column in grid["columns"]]


def test_stock_adjustment_workflow_lifecycle(client: TestClient) -> None:
    record = _seed_product(client)

    started = client.post(
        "/api/v1/workflows/STOCK_ADJUSTMENT/start",
        json={"record_id": record["id"], "assignee": "inventory-clerk"},
    )
    assert started.status_code == 200
    instance_id = started.json()["id"]
    assert started.json()["current_state"] == "draft"

    submitted = client.post(
        f"/api/v1/workflows/instances/{instance_id}/transition",
        json={"action": "submit", "actor": "inventory-clerk"},
    )
    assert submitted.json()["current_state"] == "submitted"

    delegated = client.post(
        f"/api/v1/workflows/instances/{instance_id}/delegate",
        json={"delegate_to": "inventory-manager"},
    )
    assert delegated.json()["delegated_to"] == "inventory-manager"


def test_inventory_valuation_report(client: TestClient) -> None:
    _seed_product(client)

    listed = client.get("/api/v1/reports")
    assert listed.status_code == 200
    assert "INVENTORY_VALUATION" in listed.json()["reports"]

    run = client.post("/api/v1/reports/INVENTORY_VALUATION/run")
    assert run.status_code == 200
    body = run.json()
    assert body["report_code"] == "INVENTORY_VALUATION"
    assert body["row_count"] >= 1

    runs = client.get("/api/v1/reports/INVENTORY_VALUATION/runs")
    assert runs.status_code == 200
    assert len(runs.json()["runs"]) >= 1


def test_inventory_overview_dashboard(client: TestClient) -> None:
    response = client.get("/api/v1/dashboards")
    assert response.status_code == 200
    dashboards = response.json()["dashboards"]
    assert any(d["code"] == "INVENTORY_OVERVIEW" for d in dashboards)


def test_inventory_menus(client: TestClient) -> None:
    response = client.get("/api/v1/menus")
    assert response.status_code == 200
    menus = response.json()["menus"]
    inventory_menus = [menu for menu in menus if menu["module"] == "INVENTORY"]
    menu_codes = {menu["code"] for menu in inventory_menus}
    assert "products" in menu_codes
    assert "warehouses" in menu_codes
    assert any(menu["entity_code"] == "PRODUCT" for menu in inventory_menus)
    assert any(menu["entity_code"] == "WAREHOUSE" for menu in inventory_menus)
