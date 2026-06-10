import json
from pathlib import Path

from fastapi.testclient import TestClient

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "metadata"


def test_form_metadata_api(client: TestClient) -> None:
    response = client.get("/api/v1/metadata/forms/CUSTOMER")
    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1.0"
    assert body["entity_code"] == "CUSTOMER"
    assert body["sections"][0]["fields"][0]["name"] == "name"


def test_grid_metadata_api(client: TestClient) -> None:
    response = client.get("/api/v1/metadata/grids/CUSTOMER")
    assert response.status_code == 200
    body = response.json()
    assert body["entity_code"] == "CUSTOMER"
    assert body["export"]["excel"] is True
    assert len(body["columns"]) == 3


def test_metadata_contract_keys(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/CUSTOMER").json()
    grid = client.get("/api/v1/metadata/grids/CUSTOMER").json()

    expected_form_keys = {"schema_version", "entity_code", "sections", "conditions", "i18n"}
    expected_grid_keys = {
        "schema_version",
        "entity_code",
        "columns",
        "export",
        "grouping",
        "realtime",
        "offline",
        "i18n",
    }
    assert expected_form_keys.issubset(form.keys())
    assert expected_grid_keys.issubset(grid.keys())

    fixture_form = json.loads((FIXTURES / "customer.form.keys.json").read_text(encoding="utf-8"))
    fixture_grid = json.loads((FIXTURES / "customer.grid.keys.json").read_text(encoding="utf-8"))
    assert fixture_form["field_names"] == [field["name"] for field in form["sections"][0]["fields"]]
    assert fixture_grid["column_fields"] == [column["field"] for column in grid["columns"]]


def test_workflow_lifecycle(client: TestClient) -> None:
    record = client.post(
        "/api/v1/entities/CUSTOMER/records",
        json={"name": "Workflow Co", "email": "wf@example.com", "active": True},
    ).json()

    started = client.post(
        "/api/v1/workflows/CUSTOMER_APPROVAL/start",
        json={"record_id": record["id"], "assignee": "admin"},
    )
    assert started.status_code == 200
    instance_id = started.json()["id"]
    assert started.json()["current_state"] == "draft"

    submitted = client.post(
        f"/api/v1/workflows/instances/{instance_id}/transition",
        json={"action": "submit", "actor": "admin"},
    )
    assert submitted.json()["current_state"] == "submitted"

    delegated = client.post(
        f"/api/v1/workflows/instances/{instance_id}/delegate",
        json={"delegate_to": "reviewer"},
    )
    assert delegated.json()["delegated_to"] == "reviewer"


def test_rule_engine_formula(client: TestClient) -> None:
    response = client.post(
        "/api/v1/workflows/rules/evaluate",
        json={
            "expression": "amount > 100 and active == True",
            "context": {"amount": 150, "active": True},
        },
    )
    assert response.status_code == 200
    assert response.json()["result"] is True
