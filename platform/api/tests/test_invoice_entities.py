"""P28 invoice entities — balance consistency and status transitions."""

from pathlib import Path
import importlib.util

from fastapi.testclient import TestClient


def _load_sales_validators() -> dict[str, object]:
    path = Path(__file__).resolve().parents[3] / "modules" / "sales" / "module.py"
    spec = importlib.util.spec_from_file_location("sales_module", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.ENTITY_VALIDATORS


def _seed_customer(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Invoice Customer", "email": "inv@example.com", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_invoice_validator_registered() -> None:
    validators = _load_sales_validators()
    assert "INVOICE" in validators


def test_invoice_draft_create_and_send(client: TestClient) -> None:
    customer = _seed_customer(client)

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-001",
            "customer_id": customer["id"],
            "amount": 150.0,
            "status": "draft",
            "active": True,
        },
    )
    assert invoice.status_code == 201
    body = invoice.json()

    sent = client.put(
        f"/api/v1/entities/INVOICE/records/{body['id']}",
        json={"status": "sent", "balance_due": 150.0},
        headers={"If-Match": str(body["record_version"])},
    )
    assert sent.status_code == 200
    assert sent.json()["status"] == "sent"
    assert sent.json()["balance_due"] == 150.0


def test_invoice_inconsistent_amounts_rejected(client: TestClient) -> None:
    customer = _seed_customer(client)

    response = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-BAD",
            "customer_id": customer["id"],
            "amount": 100.0,
            "amount_paid": 30.0,
            "balance_due": 80.0,
            "status": "partial",
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "inconsistent" in response.json()["detail"]


def test_invoice_invalid_status_transition_rejected(client: TestClient) -> None:
    customer = _seed_customer(client)

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-XFR",
            "customer_id": customer["id"],
            "amount": 50.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    response = client.put(
        f"/api/v1/entities/INVOICE/records/{invoice['id']}",
        json={"status": "paid", "amount_paid": 50.0, "balance_due": 0.0},
        headers={"If-Match": str(invoice["record_version"])},
    )
    assert response.status_code == 400
    assert "invalid invoice status transition" in response.json()["detail"]


def test_invoice_void_guard_with_payments(client: TestClient) -> None:
    customer = _seed_customer(client)

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-VOID",
            "customer_id": customer["id"],
            "amount": 80.0,
            "amount_paid": 20.0,
            "balance_due": 60.0,
            "status": "partial",
            "active": True,
        },
    ).json()

    response = client.put(
        f"/api/v1/entities/INVOICE/records/{invoice['id']}",
        json={"status": "void"},
        headers={"If-Match": str(invoice["record_version"])},
    )
    assert response.status_code == 400
    assert "cannot void invoice with payments applied" in response.json()["detail"]


def test_invoice_void_from_draft(client: TestClient) -> None:
    customer = _seed_customer(client)

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-VD",
            "customer_id": customer["id"],
            "amount": 60.0,
            "status": "draft",
            "active": True,
        },
    ).json()

    voided = client.put(
        f"/api/v1/entities/INVOICE/records/{invoice['id']}",
        json={"status": "void", "balance_due": 60.0},
        headers={"If-Match": str(invoice["record_version"])},
    )
    assert voided.status_code == 200
    assert voided.json()["status"] == "void"


def test_invoice_paid_cannot_be_modified(client: TestClient) -> None:
    customer = _seed_customer(client)

    invoice = client.post(
        "/api/v1/entities/INVOICE/records",
        json={
            "invoice_number": "INV-P28-PD",
            "customer_id": customer["id"],
            "amount": 40.0,
            "amount_paid": 40.0,
            "balance_due": 0.0,
            "status": "paid",
            "active": True,
        },
    ).json()

    response = client.put(
        f"/api/v1/entities/INVOICE/records/{invoice['id']}",
        json={"status": "sent"},
        headers={"If-Match": str(invoice["record_version"])},
    )
    assert response.status_code == 400
    assert "paid invoices cannot be modified" in response.json()["detail"]
