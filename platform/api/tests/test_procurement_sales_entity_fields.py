"""W4 procurement/sales standard entity profile — lookups, enums, currency, status chip."""

from fastapi.testclient import TestClient


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def test_supplier_standard_profile_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SUPPLIER").json()
    grid = client.get("/api/v1/metadata/grids/SUPPLIER").json()

    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == ["code", "name", "email", "active"]

    status = form["display"]["status_field"]
    assert status["field"] == "active"
    assert status["active_values"] == [True]
    assert status["labels"]["active"]["bn"] == "সক্রিয়"

    assert grid["display"]["status_field"]["field"] == "active"


def test_purchase_order_lookups_enum_currency_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER").json()
    grid = client.get("/api/v1/metadata/grids/PURCHASE_ORDER").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["supplier_id"]["field_type"] == "lookup"
    assert fields["supplier_id"]["lookup_entity"] == "SUPPLIER"
    assert fields["warehouse_id"]["field_type"] == "lookup"
    assert fields["warehouse_id"]["lookup_entity"] == "WAREHOUSE"
    assert fields["status"]["field_type"] == "select"
    assert fields["status"]["options"] == ["draft", "submitted", "received", "cancelled"]
    assert fields["total_amount"]["field_type"] == "currency"
    assert fields["total_amount"]["currency_code"] == "USD"
    assert fields["notes"]["field_type"] == "textarea"

    status = form["display"]["status_field"]
    assert status["field"] == "status"
    assert status["active_values"] == ["draft", "submitted", "received"]
    assert status["labels"]["active"]["en"] == "Open"

    grid_status = next(column for column in grid["columns"] if column["field"] == "status")
    assert grid_status["field_type"] == "select"


def test_sales_order_standard_profile_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SALES_ORDER").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["customer_id"]["field_type"] == "lookup"
    assert fields["customer_id"]["lookup_entity"] == "CUSTOMER"
    assert fields["status"]["field_type"] == "select"
    assert fields["status"]["options"] == ["draft", "confirmed", "shipped", "invoiced", "cancelled"]
    assert fields["total_amount"]["field_type"] == "currency"
    assert fields["total_amount"]["currency_code"] == "USD"

    status = form["display"]["status_field"]
    assert status["field"] == "status"
    assert status["active_values"] == ["draft", "confirmed", "shipped"]


def test_invoice_standard_profile_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/INVOICE").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["sales_order_id"]["field_type"] == "lookup"
    assert fields["sales_order_id"]["lookup_entity"] == "SALES_ORDER"
    assert fields["customer_id"]["field_type"] == "lookup"
    assert fields["customer_id"]["lookup_entity"] == "CUSTOMER"
    assert fields["amount"]["field_type"] == "currency"
    assert fields["amount"]["currency_code"] == "USD"
    assert fields["status"]["field_type"] == "select"
    assert fields["status"]["options"] == ["draft", "sent", "paid", "void"]

    status = form["display"]["status_field"]
    assert status["field"] == "status"
    assert status["active_values"] == ["draft", "sent"]
    assert status["labels"]["active"]["en"] == "Outstanding"


def _seed_supplier(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/SUPPLIER/records",
        json={"code": "SUP-W4-01", "name": "W4 Supplier", "email": "w4@example.com", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_customer(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "W4 Customer", "email": "w4-customer@example.com", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_purchase_order_create_accepts_valid_supplier_lookup(client: TestClient) -> None:
    supplier = _seed_supplier(client)
    created = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-W4-001",
            "supplier_id": supplier["id"],
            "status": "draft",
            "total_amount": 1250.50,
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["supplier_id"] == supplier["id"]


def test_purchase_order_create_rejects_unknown_supplier_lookup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-W4-BAD",
            "supplier_id": "00000000-0000-0000-0000-000000000000",
            "status": "draft",
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for supplier_id" in response.json()["detail"]


def test_sales_order_create_accepts_valid_customer_lookup(client: TestClient) -> None:
    customer = _seed_customer(client)
    created = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-W4-001",
            "customer_id": customer["id"],
            "status": "draft",
            "total_amount": 999.99,
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["customer_id"] == customer["id"]


def test_invoice_create_accepts_valid_sales_order_lookup(client: TestClient) -> None:
    customer = _seed_customer(client)
    sales_order = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-W4-INV",
            "customer_id": customer["id"],
            "status": "confirmed",
            "active": True,
        },
    )
    assert sales_order.status_code == 201
    so_id = sales_order.json()["id"]

    created = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-W4-001",
            "sales_order_id": so_id,
            "customer_id": customer["id"],
            "amount": 500.0,
            "status": "draft",
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["sales_order_id"] == so_id
