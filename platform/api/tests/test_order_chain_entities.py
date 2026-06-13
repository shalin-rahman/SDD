"""W4 order-chain entities — procurement (P2P) and sales (O2C) metadata + lookups."""

from fastapi.testclient import TestClient


def test_supplier_status_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SUPPLIER").json()
    status = form["display"]["status_field"]
    assert status["field"] == "active"
    assert status["active_values"] == [True]


def test_purchase_order_lookup_and_currency_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["supplier_id"]["field_type"] == "lookup"
    assert fields["supplier_id"]["lookup_entity"] == "SUPPLIER"
    assert fields["warehouse_id"]["lookup_entity"] == "WAREHOUSE"
    assert fields["total_amount"]["field_type"] == "currency"
    assert fields["status"]["field_type"] == "select"
    assert form["display"]["status_field"]["field"] == "status"


def test_sales_order_customer_lookup(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SALES_ORDER").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["customer_id"]["lookup_entity"] == "CUSTOMER"
    assert fields["total_amount"]["currency_code"] == "USD"


def test_invoice_links_sales_order_and_customer(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/INVOICE").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["sales_order_id"]["lookup_entity"] == "SALES_ORDER"
    assert fields["customer_id"]["lookup_entity"] == "CUSTOMER"
    assert fields["amount"]["field_type"] == "currency"


def test_procurement_chain_create_with_valid_lookups(client: TestClient) -> None:
    supplier = client.post(
        "/api/v1/entities/SUPPLIER/records",
        json={"code": "SUP-W4", "name": "Acme Supply", "active": True},
    )
    assert supplier.status_code == 201
    supplier_id = supplier.json()["id"]

    warehouse = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": "WH-W4", "name": "Receiving Dock", "active": True},
    )
    assert warehouse.status_code == 201
    warehouse_id = warehouse.json()["id"]

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-W4-001",
            "supplier_id": supplier_id,
            "warehouse_id": warehouse_id,
            "status": "draft",
            "total_amount": 500.0,
            "active": True,
        },
    )
    assert po.status_code == 201
    assert po.json()["supplier_id"] == supplier_id


def test_sales_chain_create_with_valid_lookups(client: TestClient) -> None:
    customer = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Beta Corp", "email": "buyer@beta.example", "active": True},
    )
    assert customer.status_code == 201
    customer_id = customer.json()["id"]

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-W4-001",
            "customer_id": customer_id,
            "status": "draft",
            "total_amount": 1200.0,
            "active": True,
        },
    )
    assert so.status_code == 201
    so_id = so.json()["id"]

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-W4-001",
            "sales_order_id": so_id,
            "customer_id": customer_id,
            "amount": 1200.0,
            "status": "draft",
            "active": True,
        },
    )
    assert invoice.status_code == 201
    assert invoice.json()["sales_order_id"] == so_id


def test_purchase_order_rejects_invalid_supplier_lookup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-BAD",
            "supplier_id": "00000000-0000-0000-0000-000000000099",
            "status": "draft",
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup" in response.json()["detail"]
