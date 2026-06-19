"""P25 customer payment entities — partial/multi pay, invoice status."""

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


def _seed_gl_accounts(client: TestClient) -> None:
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "AR", "name": "Accounts Receivable", "account_type": "asset", "balance": 0, "active": True},
    )
    client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "CASH", "name": "Cash", "account_type": "asset", "balance": 500, "active": True},
    )


def _seed_sent_invoice(client: TestClient, *, amount: float) -> dict:
    customer = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "AR Customer", "email": "ar@example.com", "active": True},
    ).json()

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": f"INV-{amount}",
            "customer_id": customer["id"],
            "amount": amount,
            "balance_due": amount,
            "status": "sent",
            "active": True,
        },
    )
    assert invoice.status_code == 201
    return invoice.json()


def test_customer_payment_metadata(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "CUSTOMER_PAYMENT" in entities

    form = client.get("/api/v1/metadata/forms/CUSTOMER_PAYMENT").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["invoice_id"]["lookup_entity"] == "INVOICE"
    assert _field_read_roles("sales", "CUSTOMER_PAYMENT", "amount") == ["accounting.view"]


def test_customer_payment_partial_then_paid(client: TestClient) -> None:
    _seed_gl_accounts(client)
    invoice = _seed_sent_invoice(client, amount=100.0)

    cp1 = client.post(
        "/api/v1/entities/CUSTOMER_PAYMENT/records",
        json={
            "payment_number": "CP-001-A",
            "invoice_id": invoice["id"],
            "customer_id": invoice["customer_id"],
            "amount": 30.0,
            "status": "draft",
            "active": True,
        },
    )
    assert cp1.status_code == 201
    p1 = cp1.json()

    client.put(
        f"/api/v1/entities/CUSTOMER_PAYMENT/records/{p1['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(p1["record_version"])},
    )

    inv_partial = client.get(f"/api/v1/entities/INVOICE/records/{invoice['id']}").json()
    assert inv_partial["amount_paid"] == 30.0
    assert inv_partial["balance_due"] == 70.0
    assert inv_partial["status"] == "partial"

    cp2 = client.post(
        "/api/v1/entities/CUSTOMER_PAYMENT/records",
        json={
            "payment_number": "CP-001-B",
            "invoice_id": invoice["id"],
            "customer_id": invoice["customer_id"],
            "amount": 70.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    client.put(
        f"/api/v1/entities/CUSTOMER_PAYMENT/records/{cp2['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(cp2["record_version"])},
    )

    inv_paid = client.get(f"/api/v1/entities/INVOICE/records/{invoice['id']}").json()
    assert inv_paid["amount_paid"] == 100.0
    assert inv_paid["balance_due"] == 0.0
    assert inv_paid["status"] == "paid"


def test_customer_payment_overpay_rejected(client: TestClient) -> None:
    _seed_gl_accounts(client)
    invoice = _seed_sent_invoice(client, amount=40.0)

    payment = client.post(
        "/api/v1/entities/CUSTOMER_PAYMENT/records",
        json={
            "payment_number": "CP-OVR",
            "invoice_id": invoice["id"],
            "customer_id": invoice["customer_id"],
            "amount": 50.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    response = client.put(
        f"/api/v1/entities/CUSTOMER_PAYMENT/records/{payment['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(payment["record_version"])},
    )
    assert response.status_code == 400
    assert "exceeds balance due" in response.json()["detail"]
