"""P25 vendor payment entities — multi-pay, overpay guard, PO balance updates."""

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


def _seed_gl_accounts(client: TestClient) -> tuple[dict, dict]:
    ap = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "AP", "name": "Accounts Payable", "account_type": "liability", "balance": 0, "active": True},
    )
    assert ap.status_code == 201
    cash = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "CASH", "name": "Cash", "account_type": "asset", "balance": 1000, "active": True},
    )
    assert cash.status_code == 201
    return ap.json(), cash.json()


def _seed_received_po(client: TestClient, *, po_number: str, line_total: float) -> dict:
    supplier = client.post(
        "/api/v1/entities/SUPPLIER/records",
        json={"code": f"SUP-{po_number}", "name": "Pay Supplier", "active": True},
    ).json()
    warehouse = client.post(
        "/api/v1/entities/WAREHOUSE/records",
        json={"code": f"WH-{po_number}", "name": "Pay WH", "active": True},
    ).json()
    product = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={"sku": f"SKU-{po_number}", "name": "Pay Product", "quantity_on_hand": 0, "active": True},
    ).json()

    po = client.post(
        "/api/v1/entities/PURCHASE_ORDER/records",
        json={
            "po_number": po_number,
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "status": "draft",
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
            "quantity": 1,
            "unit_price": line_total,
        },
    )

    received = client.put(
        f"/api/v1/entities/PURCHASE_ORDER/records/{po_body['id']}",
        json={"status": "received"},
        headers={"If-Match": str(po_body["record_version"])},
    )
    assert received.status_code == 200
    return received.json()


def test_vendor_payment_metadata(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "VENDOR_PAYMENT" in entities

    form = client.get("/api/v1/metadata/forms/VENDOR_PAYMENT").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["po_id"]["lookup_entity"] == "PURCHASE_ORDER"
    assert _field_read_roles("procurement", "VENDOR_PAYMENT", "amount") == ["accounting.view"]
    assert fields["status"]["options"] == ["draft", "posted", "void"]


def test_vendor_payment_partial_then_full(client: TestClient) -> None:
    _seed_gl_accounts(client)
    po = _seed_received_po(client, po_number="PO-VP-001", line_total=100.0)

    payment1 = client.post(
        "/api/v1/entities/VENDOR_PAYMENT/records",
        json={
            "payment_number": "VP-001-A",
            "po_id": po["id"],
            "supplier_id": po["supplier_id"],
            "amount": 40.0,
            "payment_method": "check",
            "status": "draft",
            "active": True,
        },
    )
    assert payment1.status_code == 201
    p1 = payment1.json()

    posted1 = client.put(
        f"/api/v1/entities/VENDOR_PAYMENT/records/{p1['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(p1["record_version"])},
    )
    assert posted1.status_code == 200

    po_after1 = client.get(f"/api/v1/entities/PURCHASE_ORDER/records/{po['id']}").json()
    assert po_after1["amount_paid"] == 40.0
    assert po_after1["balance_due"] == 60.0

    payment2 = client.post(
        "/api/v1/entities/VENDOR_PAYMENT/records",
        json={
            "payment_number": "VP-001-B",
            "po_id": po["id"],
            "supplier_id": po["supplier_id"],
            "amount": 60.0,
            "payment_method": "wire",
            "status": "draft",
            "active": True,
        },
    )
    assert payment2.status_code == 201
    p2 = payment2.json()

    posted2 = client.put(
        f"/api/v1/entities/VENDOR_PAYMENT/records/{p2['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(p2["record_version"])},
    )
    assert posted2.status_code == 200

    po_final = client.get(f"/api/v1/entities/PURCHASE_ORDER/records/{po['id']}").json()
    assert po_final["amount_paid"] == 100.0
    assert po_final["balance_due"] == 0.0


def test_vendor_payment_overpay_rejected(client: TestClient) -> None:
    _seed_gl_accounts(client)
    po = _seed_received_po(client, po_number="PO-VP-OVR", line_total=50.0)

    payment = client.post(
        "/api/v1/entities/VENDOR_PAYMENT/records",
        json={
            "payment_number": "VP-OVR",
            "po_id": po["id"],
            "supplier_id": po["supplier_id"],
            "amount": 75.0,
            "status": "draft",
            "active": True,
        },
    )
    assert payment.status_code == 201
    p = payment.json()

    response = client.put(
        f"/api/v1/entities/VENDOR_PAYMENT/records/{p['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(p["record_version"])},
    )
    assert response.status_code == 400
    assert "exceeds balance due" in response.json()["detail"]


def test_vendor_payment_post_creates_journal_draft(client: TestClient) -> None:
    _seed_gl_accounts(client)
    po = _seed_received_po(client, po_number="PO-VP-JE", line_total=25.0)

    payment = client.post(
        "/api/v1/entities/VENDOR_PAYMENT/records",
        json={
            "payment_number": "VP-JE-01",
            "po_id": po["id"],
            "supplier_id": po["supplier_id"],
            "amount": 25.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    client.put(
        f"/api/v1/entities/VENDOR_PAYMENT/records/{payment['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(payment["record_version"])},
    )

    entries = client.get("/api/v1/entities/JOURNAL_ENTRY/records").json()["records"]
    linked = [entry for entry in entries if entry.get("source_type") == "vendor_payment"]
    assert len(linked) >= 1
    assert linked[-1]["source_id"] == payment["id"]

    lines = client.get("/api/v1/entities/JOURNAL_ENTRY_LINE/records").json()["records"]
    je_lines = [line for line in lines if line["journal_entry_id"] == linked[-1]["id"]]
    assert len(je_lines) == 2
