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


def test_ap_full_chain_receive_and_pay(client: TestClient) -> None:
    """P25 AP chain: supplier → PO + line → receive → vendor payment → PO settled."""
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "AP", "name": "AP", "account_type": "liability", "balance": 0, "active": True},
    )
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "CASH", "name": "Cash", "account_type": "asset", "balance": 500, "active": True},
    )

    supplier = client.post(
        "/api/v1/entities/SUPPLIER/records",
        json={"code": "SUP-AP", "name": "AP Supplier", "active": True},
    ).json()
    warehouse = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": "WH-AP", "name": "AP WH", "active": True},
    ).json()
    product = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": "AP-SKU", "name": "AP Widget", "quantity_on_hand": 0, "active": True},
    ).json()

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": "PO-AP-CHAIN",
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "status": "draft",
            "active": True,
        },
    ).json()

    client.post(
        "/api/v1/entities/PURCHASE_ORDER_LINE/records",
        json={
            "po_id": po["id"],
            "product_id": product["id"],
            "quantity": 2,
            "unit_price": 50.0,
        },
    )

    received = client.put(
        f"/api/v1/entities/PURCHASE_ORDER/records/{po['id']}",
        json={"status": "received"},
        headers={"If-Match": str(po["record_version"])},
    )
    assert received.status_code == 200
    po_received = received.json()
    assert po_received["total_amount"] == 100.0
    assert po_received["balance_due"] == 100.0

    payment = client.post(
        "/api/v1/entities/VENDOR_PAYMENT/records",
        json={
            "payment_number": "VP-AP-CHAIN",
            "po_id": po_received["id"],
            "supplier_id": supplier["id"],
            "amount": 100.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    posted = client.put(
        f"/api/v1/entities/VENDOR_PAYMENT/records/{payment['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(payment["record_version"])},
    )
    assert posted.status_code == 200

    po_final = client.get(f"/api/v1/entities/PURCHASE_ORDER/records/{po_received['id']}").json()
    assert po_final["amount_paid"] == 100.0
    assert po_final["balance_due"] == 0.0


def test_ar_full_chain_invoice_and_collect(client: TestClient) -> None:
    """P25 AR chain: customer → SO + line → invoice → customer payment → paid."""
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "AR", "name": "AR", "account_type": "asset", "balance": 0, "active": True},
    )
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "CASH", "name": "Cash AR", "account_type": "asset", "balance": 200, "active": True},
    )

    customer = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "AR Customer", "email": "ar-chain@example.com", "active": True},
    ).json()
    product = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": "AR-SKU", "name": "AR Widget", "active": True},
    ).json()

    so = client.post(
        "/api/v1/entities/SALES_ORDER/records",
        json={
            "order_number": "SO-AR-CHAIN",
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
            "quantity": 3,
            "unit_price": 40.0,
        },
    )

    confirmed = client.put(
        f"/api/v1/entities/SALES_ORDER/records/{so['id']}",
        json={"status": "confirmed"},
        headers={"If-Match": str(so["record_version"])},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["total_amount"] == 120.0

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-AR-CHAIN",
            "sales_order_id": so["id"],
            "customer_id": customer["id"],
            "amount": 120.0,
            "balance_due": 120.0,
            "status": "sent",
            "active": True,
        },
    ).json()

    payment = client.post(
        "/api/v1/entities/CUSTOMER_PAYMENT/records",
        json={
            "payment_number": "CP-AR-CHAIN",
            "invoice_id": invoice["id"],
            "customer_id": customer["id"],
            "amount": 120.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    posted = client.put(
        f"/api/v1/entities/CUSTOMER_PAYMENT/records/{payment['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(payment["record_version"])},
    )
    assert posted.status_code == 200

    inv_final = client.get(f"/api/v1/entities/INVOICE/records/{invoice['id']}").json()
    assert inv_final["amount_paid"] == 120.0
    assert inv_final["balance_due"] == 0.0
    assert inv_final["status"] == "paid"
