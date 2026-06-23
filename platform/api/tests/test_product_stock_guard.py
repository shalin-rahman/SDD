"""P28-T03 — PRODUCT quantity_on_hand guard via ENTITY_VALIDATORS."""

from fastapi.testclient import TestClient


def _seed_product(client: TestClient, *, sku: str = "PSG-SKU-001", qty: int = 40) -> dict:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": sku,
            "name": "Guard Widget",
            "quantity_on_hand": qty,
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def _seed_warehouse(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": "PSG-WH-01", "name": "Guard WH", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_product_create_allows_initial_quantity_on_hand(client: TestClient) -> None:
    product = _seed_product(client, sku="PSG-CREATE", qty=25)
    assert product["quantity_on_hand"] == 25


def test_product_direct_quantity_on_hand_update_rejected(client: TestClient) -> None:
    product = _seed_product(client)

    response = client.put(
        f"/api/v1/entities/PRODUCT/records/{product['id']}",
        json={"quantity_on_hand": 99},
        headers={"If-Match": str(product["record_version"])},
    )
    assert response.status_code == 400
    assert "quantity_on_hand cannot be changed directly" in response.json()["detail"]

    unchanged = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert unchanged["quantity_on_hand"] == 40


def test_product_update_other_fields_without_qty_change_allowed(client: TestClient) -> None:
    product = _seed_product(client, sku="PSG-OTHER")

    response = client.put(
        f"/api/v1/entities/PRODUCT/records/{product['id']}",
        json={"name": "Renamed Guard Widget", "reorder_level": 5},
        headers={"If-Match": str(product["record_version"])},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Renamed Guard Widget"
    assert body["reorder_level"] == 5
    assert body["quantity_on_hand"] == 40


def test_product_same_quantity_on_hand_noop_allowed(client: TestClient) -> None:
    product = _seed_product(client, sku="PSG-NOOP")

    response = client.put(
        f"/api/v1/entities/PRODUCT/records/{product['id']}",
        json={"quantity_on_hand": 40, "name": "Still Guard Widget"},
        headers={"If-Match": str(product["record_version"])},
    )
    assert response.status_code == 200
    assert response.json()["quantity_on_hand"] == 40


def test_quantity_on_hand_changes_via_posted_stock_movement(client: TestClient) -> None:
    product = _seed_product(client, sku="PSG-MOVE", qty=30)
    warehouse = _seed_warehouse(client)

    movement = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "PSG-RCV-01",
            "movement_type": "receive",
            "movement_date": "2026-06-14",
            "warehouse_id": warehouse["id"],
            "reference_type": "manual",
            "status": "draft",
            "active": True,
        },
    )
    assert movement.status_code == 201
    movement_body = movement.json()

    line = client.post(
        "/api/v1/entities/STOCK_MOVEMENT_LINE/records",
        json={
            "movement_id": movement_body["id"],
            "product_id": product["id"],
            "quantity": 7,
        },
    )
    assert line.status_code == 201

    posted = client.put(
        f"/api/v1/entities/STOCK_MOVEMENT/records/{movement_body['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(movement_body["record_version"])},
    )
    assert posted.status_code == 200

    updated = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert updated["quantity_on_hand"] == 37
