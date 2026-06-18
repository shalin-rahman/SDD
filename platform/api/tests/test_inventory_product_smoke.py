"""P18-T08 — Inventory product smoke: WAREHOUSE + STOCK_MOVEMENT API chain."""

from fastapi.testclient import TestClient


def test_inventory_product_smoke_warehouse_and_movement(client: TestClient) -> None:
    """WAREHOUSE CRUD + STOCK_MOVEMENT draft chain for M4 product gate."""
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "WAREHOUSE" in entities
    assert "STOCK_MOVEMENT" in entities
    assert "STOCK_MOVEMENT_LINE" in entities

    warehouse_resp = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": "SMK-WH", "name": "Smoke Warehouse", "active": True},
    )
    assert warehouse_resp.status_code == 201
    warehouse_id = warehouse_resp.json()["id"]

    product_resp = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": "SMK-SKU", "name": "Smoke Product", "quantity_on_hand": 10, "active": True},
    )
    assert product_resp.status_code == 201
    product_id = product_resp.json()["id"]

    movement_resp = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SMK-0001",
            "movement_type": "receive",
            "status": "draft",
            "warehouse_id": warehouse_id,
            "movement_date": "2026-06-15",
            "reference_type": "manual",
            "active": True,
        },
    )
    assert movement_resp.status_code == 201
    movement_id = movement_resp.json()["id"]

    line_resp = client.post(
        "/api/v1/entities/STOCK_MOVEMENT_LINE/records",
        json={
            "movement_id": movement_id,
            "product_id": product_id,
            "quantity": 5,
            "unit_cost": 1.0,
        },
    )
    assert line_resp.status_code == 201

    list_wh = client.get("/api/v1/entities/WAREHOUSE/records").json()
    assert len(list_wh["records"]) >= 1

    wh_grid = client.get("/api/v1/metadata/grids/WAREHOUSE").json()
    assert any(col["field"] == "code" for col in wh_grid["columns"])
    assert wh_grid["bulk_actions"] is True

    product_grid = client.get("/api/v1/metadata/grids/PRODUCT").json()
    assert product_grid["bulk_actions"] is True

    movement_detail = client.get(f"/api/v1/entities/STOCK_MOVEMENT/records/{movement_id}").json()
    assert movement_detail["status"] == "draft"
    assert movement_detail["warehouse_id"] == warehouse_id
