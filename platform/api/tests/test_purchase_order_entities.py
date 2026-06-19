"""P25 purchase order entities — lines, receive, stock movement link."""

from pathlib import Path
import importlib.util

from fastapi.testclient import TestClient


def _field_read_roles(module_name: str, entity_code: str, field_name: str) -> list[str]:
    path = Path(__file__).resolve().parents[3] / "modules" / module_name / "module.py"
    spec = importlib.util.spec_from_file_location(f"{module_name}_module", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    entity = next(item for item in module.MODULE.entities if item.code == entity_code)
    field = next(item for item in entity.fields if item.name == field_name)
    return list(field.read_roles)


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def _seed_supplier(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/SUPPLIER/records",
        json={"code": "SUP-P25", "name": "P25 Supplier", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_warehouse(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": "WH-P25", "name": "P25 Warehouse", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_product(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": "PO-P25-SKU", "name": "PO Widget", "quantity_on_hand": 10, "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_purchase_order_line_entities_registered(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "PURCHASE_ORDER_LINE" in entities


def test_purchase_order_line_parent_lookup_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER_LINE").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}
    assert fields["po_id"]["field_type"] == "lookup"
    assert fields["po_id"]["lookup_entity"] == "PURCHASE_ORDER"
    assert fields["product_id"]["lookup_entity"] == "PRODUCT"
    assert fields["unit_price"]["field_type"] == "currency"
    assert _field_read_roles("procurement", "PURCHASE_ORDER_LINE", "unit_price") == ["accounting.view"]


def test_purchase_order_balance_fields_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}
    assert fields["amount_paid"]["field_type"] == "currency"
    assert fields["balance_due"]["field_type"] == "currency"
    assert _field_read_roles("procurement", "PURCHASE_ORDER", "amount_paid") == ["accounting.view"]


def test_po_line_create_chain(client: TestClient) -> None:
    supplier = _seed_supplier(client)
    warehouse = _seed_warehouse(client)
    product = _seed_product(client)

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-P25-001",
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "status": "draft",
            "active": True,
        },
    )
    assert po.status_code == 201
    po_id = po.json()["id"]

    line = client.post(
        "/api/v1/entities/PURCHASE_ORDER_LINE/records",
        json={
            "po_id": po_id,
            "product_id": product["id"],
            "quantity": 5,
            "unit_price": 20.0,
        },
    )
    assert line.status_code == 201
    assert line.json()["po_id"] == po_id


def test_po_receive_spawns_stock_movement(client: TestClient) -> None:
    supplier = _seed_supplier(client)
    warehouse = _seed_warehouse(client)
    product = _seed_product(client)

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-P25-RCV",
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "status": "draft",
            "order_date": "2026-06-18",
            "active": True,
        },
    )
    assert po.status_code == 201
    po_body = po.json()

    client.post(
        "/api/v1/entities/PURCHASE_ORDER_LINE/records",
        json={
            "po_id": po_body["id"],
            "product_id": product["id"],
            "quantity": 3,
            "unit_price": 10.0,
        },
    )

    received = client.put(
        f"/api/v1/entities/PURCHASE_ORDER/records/{po_body['id']}",
        json={"status": "received"},
        headers={"If-Match": str(po_body["record_version"])},
    )
    assert received.status_code == 200
    body = received.json()
    assert body["status"] == "received"
    assert body["total_amount"] == 30.0
    assert body["balance_due"] == 30.0

    movements = client.get("/api/v1/entities/STOCK_MOVEMENT/records").json()["records"]
    linked = [
        movement
        for movement in movements
        if movement.get("reference_type") == "purchase_order"
        and movement.get("reference_id") == po_body["id"]
    ]
    assert len(linked) == 1
    assert linked[0]["movement_type"] == "receive"
    assert linked[0]["warehouse_id"] == warehouse["id"]

    lines = client.get("/api/v1/entities/STOCK_MOVEMENT_LINE/records").json()["records"]
    movement_lines = [line for line in lines if line["movement_id"] == linked[0]["id"]]
    assert len(movement_lines) == 1
    assert movement_lines[0]["product_id"] == product["id"]
    assert movement_lines[0]["quantity"] == 3


def test_po_receive_without_lines_rejected(client: TestClient) -> None:
    supplier = _seed_supplier(client)
    warehouse = _seed_warehouse(client)

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-P25-NOLINE",
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "status": "draft",
            "active": True,
        },
    )
    assert po.status_code == 201
    po_body = po.json()

    response = client.put(
        f"/api/v1/entities/PURCHASE_ORDER/records/{po_body['id']}",
        json={"status": "received"},
        headers={"If-Match": str(po_body["record_version"])},
    )
    assert response.status_code == 400
    assert "without lines" in response.json()["detail"]


def test_po_cannot_create_received_directly(client: TestClient) -> None:
    supplier = _seed_supplier(client)
    response = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-P25-BAD",
            "supplier_id": supplier["id"],
            "status": "received",
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "received status" in response.json()["detail"]
