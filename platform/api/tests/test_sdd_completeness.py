"""Phase 9 — SDD §15 integrations, GraphQL, payments confirm, reference modules."""

from fastapi.testclient import TestClient


def test_graphql_health_query(client: TestClient) -> None:
    response = client.post(
        "/api/v1/graphql",
        json={"query": "{ health { status multi_tenant } }"},
    )
    assert response.status_code == 200
    data = response.json()["data"]["health"]
    assert data["status"] == "ok"
    assert "multi_tenant" in data


def test_graphql_entities_query(client: TestClient) -> None:
    response = client.post("/api/v1/graphql", json={"query": "{ entities }"})
    assert response.status_code == 200
    entities = response.json()["data"]["entities"]
    assert "PRODUCT" in entities
    assert "LEAD" in entities


def test_integration_adapters(client: TestClient) -> None:
    kafka = client.post(
        "/api/v1/integrations/kafka/publish",
        json={"topic": "emcap.events", "payload": {"event": "test"}},
    )
    assert kafka.status_code == 200
    assert kafka.json()["adapter"] == "kafka"

    soap = client.post(
        "/api/v1/integrations/soap/invoke",
        json={"endpoint": "https://example.com/soap", "action": "Ping", "payload": {}},
    )
    assert soap.status_code == 200
    assert soap.json()["adapter"] == "soap"

    sftp = client.post(
        "/api/v1/integrations/sftp/upload",
        json={"host": "sftp.example.com", "path": "/inbound/data.json", "payload": {"ok": True}},
    )
    assert sftp.status_code == 200
    assert sftp.json()["adapter"] == "sftp"


def test_payment_confirm(client: TestClient) -> None:
    created = client.post("/api/v1/payments/intents", json={"amount": "25.00"})
    if created.status_code == 403:
        return
    assert created.status_code == 200
    txn_id = created.json()["transaction_id"]
    confirmed = client.post(f"/api/v1/payments/intents/{txn_id}/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "succeeded"


def test_workflow_instance_detail(client: TestClient) -> None:
    product = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "WF-DET",
            "name": "WF Detail",
            "unit_price": 1.0,
            "quantity_on_hand": 1,
            "reorder_level": 1,
            "active": True,
        },
    )
    record_id = product.json()["id"]
    started = client.post(
        "/api/v1/workflows/STOCK_ADJUSTMENT/start",
        json={"record_id": record_id, "assignee": "admin"},
    )
    assert started.status_code == 200
    instance_id = started.json()["id"]
    detail = client.get(f"/api/v1/workflows/instances/{instance_id}")
    assert detail.status_code == 200
    assert detail.json()["id"] == instance_id


def test_reference_modules_menus(client: TestClient) -> None:
    menus = client.get("/api/v1/menus").json()["menus"]
    labels = {m["label"] for m in menus}
    assert "Accounts" in labels
    assert "Employees" in labels
    assert "Sales" in labels


def test_trace_header(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert "x-trace-id" in response.headers
