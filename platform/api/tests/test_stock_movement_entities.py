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


def _create_draft_movement_with_line(
    client: TestClient,
    *,
    movement_number: str,
    movement_type: str,
    warehouse_id: str,
    product_id: str,
    quantity: float = 10,
    source_warehouse_id: str | None = None,
) -> tuple[dict, dict]:
    payload: dict[str, object] = {
        "movement_number": movement_number,
        "movement_type": movement_type,
        "movement_date": "2026-06-14",
        "warehouse_id": warehouse_id,
        "reference_type": "manual",
        "status": "draft",
        "active": True,
    }
    if source_warehouse_id is not None:
        payload["source_warehouse_id"] = source_warehouse_id

    movement = client.post("/api/v1/entities/STOCK_MOVEMENT/records", json=payload)
    assert movement.status_code == 201
    movement_body = movement.json()

    line = client.post(
        "/api/v1/entities/STOCK_MOVEMENT_LINE/records",
        json={
            "movement_id": movement_body["id"],
            "product_id": product_id,
            "quantity": quantity,
        },
    )
    assert line.status_code == 201
    return movement_body, line.json()


def _post_movement(client: TestClient, movement: dict) -> dict:
    response = client.put(
        f"/api/v1/entities/STOCK_MOVEMENT/records/{movement['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(movement["record_version"])},
    )
    assert response.status_code == 200
    return response.json()


def test_posted_receive_increases_quantity_on_hand(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-RCV", name="Receive WH")
    assert product["quantity_on_hand"] == 50

    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-RCV-01",
        movement_type="receive",
        warehouse_id=warehouse["id"],
        product_id=product["id"],
        quantity=12,
    )
    _post_movement(client, movement)

    updated = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert updated["quantity_on_hand"] == 62


def test_posted_issue_decreases_quantity_on_hand(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-ISS", name="Issue WH")

    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-ISS-01",
        movement_type="issue",
        warehouse_id=warehouse["id"],
        product_id=product["id"],
        quantity=15,
    )
    _post_movement(client, movement)

    updated = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert updated["quantity_on_hand"] == 35


def test_posted_issue_rejects_insufficient_quantity(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-INS", name="Insufficient WH")

    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-INS-01",
        movement_type="issue",
        warehouse_id=warehouse["id"],
        product_id=product["id"],
        quantity=100,
    )
    response = client.put(
        f"/api/v1/entities/STOCK_MOVEMENT/records/{movement['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(movement["record_version"])},
    )
    assert response.status_code == 400
    assert "insufficient quantity_on_hand" in response.json()["detail"]

    unchanged = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert unchanged["quantity_on_hand"] == 50


def test_posted_transfer_keeps_product_level_quantity(client: TestClient) -> None:
    """Product-level qty is unchanged; warehouse context lives on the movement header."""
    product = _seed_product(client)
    source = _seed_warehouse(client, code="SM-WH-TX-S", name="Transfer Source")
    dest = _seed_warehouse(client, code="SM-WH-TX-D", name="Transfer Dest")

    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-TX-POST",
        movement_type="transfer",
        warehouse_id=dest["id"],
        source_warehouse_id=source["id"],
        product_id=product["id"],
        quantity=8,
    )
    posted = _post_movement(client, movement)
    assert posted["status"] == "posted"
    assert posted["source_warehouse_id"] == source["id"]
    assert posted["warehouse_id"] == dest["id"]

    updated = client.get(f"/api/v1/entities/PRODUCT/records/{product['id']}").json()
    assert updated["quantity_on_hand"] == 50


def test_transfer_update_without_source_rejected(client: TestClient) -> None:
    dest = _seed_warehouse(client, code="SM-WH-TX-FAIL", name="Transfer Dest Fail")

    movement = client.post(
        "/api/v1/entities/STOCK_MOVEMENT/records",
        json={
            "movement_number": "SM-TX-BAD",
            "movement_type": "receive",
            "movement_date": "2026-06-14",
            "warehouse_id": dest["id"],
            "status": "draft",
        },
    )
    assert movement.status_code == 201
    body = movement.json()

    updated = client.put(
        f"/api/v1/entities/STOCK_MOVEMENT/records/{body['id']}",
        json={"movement_type": "transfer"},
        headers={"If-Match": str(body["record_version"])},
    )
    assert updated.status_code == 400
    assert "source_warehouse_id is required when movement_type is transfer" in updated.json()["detail"]


def test_double_post_rejected(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-DBL", name="Double Post WH")

    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-DBL-01",
        movement_type="receive",
        warehouse_id=warehouse["id"],
        product_id=product["id"],
        quantity=3,
    )
    posted = _post_movement(client, movement)

    again = client.put(
        f"/api/v1/entities/STOCK_MOVEMENT/records/{movement['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(posted["record_version"])},
    )
    assert again.status_code == 400
    assert "already posted" in again.json()["detail"]


def test_stock_movement_history_report_registered(client: TestClient) -> None:
    listed = client.get("/api/v1/reports")
    assert listed.status_code == 200
    report_codes = [r["code"] for r in listed.json()["reports"]]
    assert "STOCK_MOVEMENT_HISTORY" in report_codes

    history = next(
        r for r in listed.json()["reports"] if r["code"] == "STOCK_MOVEMENT_HISTORY"
    )
    assert history["name"] == "Stock Movement History"
    assert history["entity_code"] == "STOCK_MOVEMENT"


def test_stock_movement_history_report_run(client: TestClient) -> None:
    product = _seed_product(client)
    warehouse = _seed_warehouse(client, code="SM-WH-RPT", name="Report WH")
    movement, _line = _create_draft_movement_with_line(
        client,
        movement_number="SM-RPT-01",
        movement_type="receive",
        warehouse_id=warehouse["id"],
        product_id=product["id"],
        quantity=4,
    )
    _post_movement(client, movement)

    run = client.post("/api/v1/reports/STOCK_MOVEMENT_HISTORY/run")
    assert run.status_code == 200
    body = run.json()
    assert body["report_code"] == "STOCK_MOVEMENT_HISTORY"
    assert body["row_count"] >= 1
    numbers = [row["movement_number"] for row in body["rows"]]
    assert "SM-RPT-01" in numbers
    assert list(body["rows"][0].keys()) == [
        "movement_number",
        "movement_type",
        "warehouse_id",
        "status",
        "movement_date",
    ]
