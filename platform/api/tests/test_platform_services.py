from fastapi.testclient import TestClient


def _seed_customer(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Acme Corp", "email": "ops@acme.com", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def test_report_list_and_run(client: TestClient) -> None:
    _seed_customer(client)

    listed = client.get("/api/v1/reports")
    assert listed.status_code == 200
    report_codes = [r["code"] for r in listed.json()["reports"]]
    assert "CUSTOMER_LIST" in report_codes

    run = client.post("/api/v1/reports/CUSTOMER_LIST/run")
    assert run.status_code == 200
    body = run.json()
    assert body["report_code"] == "CUSTOMER_LIST"
    assert body["row_count"] >= 1

    runs = client.get("/api/v1/reports/CUSTOMER_LIST/runs")
    assert runs.status_code == 200
    run_list = runs.json()["runs"]
    assert len(run_list) >= 1
    assert run_list[0]["status"] == "completed"

    detail = client.get(f"/api/v1/reports/runs/{run_list[0]['run_id']}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["report_code"] == "CUSTOMER_LIST"
    assert payload["row_count"] >= 1
    assert len(payload["rows"]) >= 1


def test_dashboards_api(client: TestClient) -> None:
    response = client.get("/api/v1/dashboards")
    assert response.status_code == 200
    dashboards = response.json()["dashboards"]
    assert any(d["code"] == "CUSTOMER_OVERVIEW" for d in dashboards)


def test_notification_hub(client: TestClient) -> None:
    sent = client.post(
        "/api/v1/notifications/send",
        json={
            "channel": "email",
            "recipient": "user@example.com",
            "subject": "Welcome",
            "body": "Hello from EMCAP",
        },
    )
    assert sent.status_code == 200
    assert sent.json()["status"] == "sent"

    listed = client.get("/api/v1/notifications")
    assert listed.status_code == 200
    assert len(listed.json()["notifications"]) >= 1


def test_notification_channel_disabled(client: TestClient) -> None:
    response = client.post(
        "/api/v1/notifications/send",
        json={
            "channel": "sms",
            "recipient": "+15551234567",
            "subject": "Alert",
            "body": "Should be blocked",
        },
    )
    assert response.status_code == 403


def test_document_upload_and_get(client: TestClient) -> None:
    record = _seed_customer(client)
    uploaded = client.post(
        "/api/v1/documents/upload",
        json={
            "entity_code": "CUSTOMER",
            "record_id": record["id"],
            "filename": "notes.txt",
            "content": "Customer onboarding notes",
        },
    )
    assert uploaded.status_code == 200
    doc_id = uploaded.json()["id"]
    assert uploaded.json()["virus_scan_status"] == "clean"

    fetched = client.get(f"/api/v1/documents/{doc_id}")
    assert fetched.status_code == 200
    assert fetched.json()["filename"] == "notes.txt"


def test_integration_adapters(client: TestClient) -> None:
    rest = client.post(
        "/api/v1/integrations/rest/dispatch",
        json={"url": "https://example.com/hook", "payload": {"event": "created"}},
    )
    assert rest.status_code == 200
    assert rest.json()["adapter"] == "rest"

    kafka = client.post(
        "/api/v1/integrations/kafka/publish",
        json={"topic": "emcap.events", "payload": {"entity": "CUSTOMER"}},
    )
    assert kafka.status_code == 200
    assert kafka.json()["adapter"] == "kafka"


def test_payments_disabled_by_default(client: TestClient) -> None:
    response = client.post(
        "/api/v1/payments/intents",
        json={"amount": "49.99", "currency": "USD"},
    )
    assert response.status_code == 403


def test_payments_enabled(client: TestClient) -> None:
    client.app.state.platform_config.modules.payments.enabled = True
    client.app.state.platform_config.payments.enabled = True

    response = client.post(
        "/api/v1/payments/intents",
        json={"amount": "49.99", "currency": "USD"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "pending"


def test_ai_disabled_by_default(client: TestClient) -> None:
    response = client.post("/api/v1/ai/chat", json={"prompt": "Hello"})
    assert response.status_code == 403


def test_ai_enabled(client: TestClient) -> None:
    client.app.state.platform_config.modules.ai.enabled = True
    client.app.state.platform_config.ai.enabled = True

    chat = client.post("/api/v1/ai/chat", json={"prompt": "Summarize platform"})
    assert chat.status_code == 200
    assert "response" in chat.json()

    summary = client.post("/api/v1/ai/summarize", json={"text": "Long text " * 20})
    assert summary.status_code == 200
    assert "summary" in summary.json()


def test_prometheus_metrics(client: TestClient) -> None:
    client.get("/api/v1/health")
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    assert "emcap_http_requests_total" in response.text
