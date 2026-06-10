"""Tests for client-facing API gaps: notes, sync, workflow list, documents list."""

from fastapi.testclient import TestClient


def _create_product(client: TestClient) -> str:
    response = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "NOTE-001",
            "name": "Note Test Product",
            "quantity_on_hand": 3,
            "reorder_level": 5,
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_notes_crud(client: TestClient) -> None:
    record_id = _create_product(client)

    empty = client.get(f"/api/v1/entities/PRODUCT/records/{record_id}/notes")
    assert empty.status_code == 200
    assert empty.json()["notes"] == []

    created = client.post(
        f"/api/v1/entities/PRODUCT/records/{record_id}/notes",
        json={"body": "Stock check complete"},
    )
    assert created.status_code == 201
    assert created.json()["body"] == "Stock check complete"

    listed = client.get(f"/api/v1/entities/PRODUCT/records/{record_id}/notes")
    assert len(listed.json()["notes"]) == 1


def test_document_list_by_record(client: TestClient) -> None:
    record_id = _create_product(client)
    uploaded = client.post(
        "/api/v1/documents/upload",
        json={
            "entity_code": "PRODUCT",
            "record_id": record_id,
            "filename": "spec.txt",
            "content": "product spec",
        },
    )
    assert uploaded.status_code == 200

    listed = client.get(
        "/api/v1/documents",
        params={"entity_code": "PRODUCT", "record_id": record_id},
    )
    assert listed.status_code == 200
    assert len(listed.json()["documents"]) == 1


def test_workflow_instance_list(client: TestClient) -> None:
    record_id = _create_product(client)
    started = client.post(
        "/api/v1/workflows/STOCK_ADJUSTMENT/start",
        json={"record_id": record_id, "assignee": "admin"},
    )
    instance_id = started.json()["id"]

    listed = client.get("/api/v1/workflows/instances", params={"record_id": record_id})
    assert listed.status_code == 200
    assert len(listed.json()["instances"]) >= 1

    fetched = client.get(f"/api/v1/workflows/instances/{instance_id}")
    assert fetched.status_code == 200
    assert fetched.json()["current_state"] == "draft"


def test_offline_sync_snapshot_and_changes(client: TestClient) -> None:
    _create_product(client)

    snapshot = client.get("/api/v1/sync/PRODUCT/snapshot")
    assert snapshot.status_code == 200
    body = snapshot.json()
    assert body["entity_code"] == "PRODUCT"
    assert "form_metadata" in body
    assert "grid_metadata" in body
    assert len(body["records"]) >= 1

    since = "1970-01-01T00:00:00+00:00"
    changes = client.get("/api/v1/sync/PRODUCT/changes", params={"since": since})
    assert changes.status_code == 200
    assert changes.json()["count"] >= 1


def test_low_stock_report_filter(client: TestClient) -> None:
    client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "LOW-001",
            "name": "Low",
            "quantity_on_hand": 2,
            "reorder_level": 5,
            "active": True,
        },
    )
    client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "OK-001",
            "name": "OK",
            "quantity_on_hand": 20,
            "reorder_level": 5,
            "active": True,
        },
    )

    run = client.post("/api/v1/reports/LOW_STOCK/run")
    assert run.status_code == 200
    skus = {row["sku"] for row in run.json()["rows"]}
    assert "LOW-001" in skus
    assert "OK-001" not in skus


def test_realtime_stream_endpoint(client: TestClient) -> None:
    with client.stream("GET", "/api/v1/entities/PRODUCT/records/stream") as response:
        assert response.status_code == 200
        first = next(response.iter_lines())
        assert first.startswith("data:")
