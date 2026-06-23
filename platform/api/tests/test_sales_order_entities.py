"""P25 sales order entities — lines and invoice chain."""

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


def _seed_customer(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "P25 Customer", "email": "p25@example.com", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_product(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": "SO-P25-SKU", "name": "SO Widget", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_sales_order_line_entities_registered(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "SALES_ORDER_LINE" in entities


def test_sales_order_line_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SALES_ORDER_LINE").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["sales_order_id"]["lookup_entity"] == "SALES_ORDER"
    assert fields["product_id"]["lookup_entity"] == "PRODUCT"
    assert _field_read_roles("sales", "SALES_ORDER_LINE", "unit_price") == ["accounting.view"]


def test_so_line_create_chain(client: TestClient) -> None:
    customer = _seed_customer(client)
    product = _seed_product(client)

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-P25-001",
            "customer_id": customer["id"],
            "status": "draft",
            "active": True,
        },
    )
    assert so.status_code == 201
    so_id = so.json()["id"]

    line = client.post(
        "/api/v1/entities/SALES_ORDER_LINE/records",
        json={
            "sales_order_id": so_id,
            "product_id": product["id"],
            "quantity": 2,
            "unit_price": 15.0,
        },
    )
    assert line.status_code == 201
    assert line.json()["sales_order_id"] == so_id


def test_so_confirm_rollup_total(client: TestClient) -> None:
    customer = _seed_customer(client)
    product = _seed_product(client)

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-P25-ROLL",
            "customer_id": customer["id"],
            "status": "draft",
            "active": True,
        },
    ).json()

    client.post(
        "/api/v1/entities/SALES_ORDER_LINE/records",
        json={
            "sales_order_id": so["id"],
            "product_id": product["id"],
            "quantity": 4,
            "unit_price": 25.0,
        },
    )

    confirmed = client.put(
        f"/api/v1/entities/SALES_ORDER/records/{so['id']}",
        json={"status": "confirmed"},
        headers={"If-Match": str(so["record_version"])},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["total_amount"] == 100.0


def test_so_confirm_without_lines_rejected(client: TestClient) -> None:
    customer = _seed_customer(client)

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-P28-NOLINE",
            "customer_id": customer["id"],
            "status": "draft",
            "active": True,
        },
    )
    assert so.status_code == 201
    so_body = so.json()

    response = client.put(
        f"/api/v1/entities/SALES_ORDER/records/{so_body['id']}",
        json={"status": "confirmed"},
        headers={"If-Match": str(so_body["record_version"])},
    )
    assert response.status_code == 400
    assert "without lines" in response.json()["detail"]


def test_so_ship_without_lines_rejected(client: TestClient) -> None:
    customer = _seed_customer(client)

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-P28-NOSHIP",
            "customer_id": customer["id"],
            "status": "draft",
            "active": True,
        },
    ).json()

    response = client.put(
        f"/api/v1/entities/SALES_ORDER/records/{so['id']}",
        json={"status": "shipped"},
        headers={"If-Match": str(so["record_version"])},
    )
    assert response.status_code == 400
    assert "without lines" in response.json()["detail"]


def test_invoice_chain_with_balance_fields(client: TestClient) -> None:
    customer = _seed_customer(client)
    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-P25-INV",
            "customer_id": customer["id"],
            "status": "draft",
            "total_amount": 200.0,
            "active": True,
        },
    ).json()

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P25-001",
            "sales_order_id": so["id"],
            "customer_id": customer["id"],
            "amount": 200.0,
            "balance_due": 200.0,
            "status": "sent",
            "active": True,
        },
    )
    assert invoice.status_code == 201
    body = invoice.json()
    assert body["sales_order_id"] == so["id"]
    assert body["balance_due"] == 200.0
