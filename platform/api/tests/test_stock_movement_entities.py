"""W5 stock movement entities — metadata, CRUD chain, lookup and transfer validation."""

from fastapi.testclient import TestClient

MOVEMENT_TYPES = [
    "receive",
    "return",
    "bonus",
    "gift",
    "damage",
    "lost",
    "transfer",
    "adjustment",
    "issue",
]


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def _seed_product(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "SM-SKU-001",
            "name": "Movement Widget",
            "quantity_on_hand": 50,
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def _seed_warehouse(client: TestClient, *, code: str, name: str) -> dict:
    response = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": code, "name": name, "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_stock_movement_entities_registered(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "STOCK_MOVEMENT" in entities
    assert "STOCK_MOVEMENT_LINE" in entities


def test_stock_movement_movement_type_enum_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/STOCK_MOVEMENT").json()
    grid = client.get("/api/v1/metadata/grids/STOCK_MOVEMENT").json()

    form_field = next(
        field for field in _main_form_fields(form) if field["name"] == "movement_type"
    )
    grid_column = next(column for column in grid["columns"] if column["field"] == "movement_type")

    assert form_field["field_type"] == "select"
    assert form_field["options"] == MOVEMENT_TYPES
    assert grid_column["field_type"] == "select"


def test_stock_movement_line_parent_lookup_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/STOCK_MOVEMENT_LINE").json()
    form_field = next(
        field for field in _main_form_fields(form) if field["name"] == "movement_id"
    )
    assert form_field["field_type"] == "lookup"
    assert form_field["lookup_entity"] == "STOCK_MOVEMENT"


def test_stock_movement_status_field_display_contract(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/STOCK_MOVEMENT").json()
    status = form["display"]["status_field"]
    assert status["field"] == "status"
    assert status["active_values"] == ["draft"]


def test_stock_movement_create_chain_with_line(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-01", name="Movement WH")

    movement = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SM-0001",
            "movement_type": "receive",
            "movement_date": "2026-06-14",
            "warehouse_id": warehouse["id"],
            "reference_type": "manual",
            "status": "draft",
            "active": True,
        },
    )
    assert movement.status_code == 201
    movement_id = movement.json()["id"]

    line = client.post(
        "/api/v1/entities/STOCK_MOVEMENT_LINE/records",
        json={
            "movement_id": movement_id,
            "product_id": product["id"],
            "quantity": 10.5,
            "unit_cost": 4.25,
        },
    )
    assert line.status_code == 201
    assert line.json()["movement_id"] == movement_id
    assert line.json()["product_id"] == product["id"]


def test_stock_movement_line_rejects_invalid_product_lookup(client: TestClient) -> None:
    warehouse = _seed_warehouse(client, code="SM-WH-02", name="Lookup WH")
    movement = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SM-0002",
            "movement_type": "issue",
            "movement_date": "2026-06-14",
            "warehouse_id": warehouse["id"],
            "status": "draft",
        },
    )
    assert movement.status_code == 201

    line = client.post(
        "/api/v1/entities/STOCK_MOVEMENT_LINE/records",
        json={
            "movement_id": movement.json()["id"],
            "product_id": "00000000-0000-0000-0000-000000000000",
            "quantity": 1,
        },
    )
    assert line.status_code == 400
    assert "Invalid lookup for product_id" in line.json()["detail"]


def test_transfer_requires_source_warehouse(client: TestClient) -> None:
    dest = _seed_warehouse(client, code="SM-WH-DST", name="Destination WH")

    response = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SM-TX-01",
            "movement_type": "transfer",
            "movement_date": "2026-06-14",
            "warehouse_id": dest["id"],
            "status": "draft",
        },
    )
    assert response.status_code == 400
    assert "source_warehouse_id is required when movement_type is transfer" in response.json()["detail"]


def test_transfer_accepts_source_and_destination(client: TestClient) -> None:
    source = _seed_warehouse(client, code="SM-WH-SRC", name="Source WH")
    dest = _seed_warehouse(client, code="SM-WH-DST2", name="Destination WH 2")

    response = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SM-TX-02",
            "movement_type": "transfer",
            "movement_date": "2026-06-14",
            "warehouse_id": dest["id"],
            "source_warehouse_id": source["id"],
            "status": "draft",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["source_warehouse_id"] == source["id"]
    assert body["warehouse_id"] == dest["id"]
