"""CRM W1 module fields — LEAD enum status, CONTACT lead lookup, status chip metadata."""

from fastapi.testclient import TestClient


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def test_lead_status_is_enum_with_options(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/LEAD").json()
    grid = client.get("/api/v1/metadata/grids/LEAD").json()

    form_field = next(field for field in _main_form_fields(form) if field["name"] == "status")
    grid_column = next(column for column in grid["columns"] if column["field"] == "status")

    expected_options = ["new", "qualified", "lost", "won"]
    assert form_field["field_type"] == "select"
    assert form_field["options"] == expected_options
    assert grid_column["field_type"] == "select"
    assert grid["bulk_actions"] is True


def test_lead_status_field_display_contract(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/LEAD").json()
    status = form["display"]["status_field"]
    assert status["field"] == "active"
    assert status["active_values"] == [True]
    assert status["labels"]["active"]["en"] == "Active"
    assert status["labels"]["active"]["bn"] == "সক্রিয়"


def test_contact_lead_id_lookup_metadata(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/CONTACT").json()
    grid = client.get("/api/v1/metadata/grids/CONTACT").json()

    form_field = next(field for field in _main_form_fields(form) if field["name"] == "lead_id")
    grid_column = next(column for column in grid["columns"] if column["field"] == "lead_id")

    assert form_field["field_type"] == "lookup"
    assert form_field["lookup_entity"] == "LEAD"
    assert grid_column["field_type"] == "lookup"
    assert grid_column["lookup_entity"] == "LEAD"


def test_contact_status_field_display_contract(client: TestClient) -> None:
    grid = client.get("/api/v1/metadata/grids/CONTACT").json()
    status = grid["display"]["status_field"]
    assert status["field"] == "active"
    assert status["labels"]["inactive"]["bn"] == "নিষ্ক্রিয়"


def _seed_lead(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/LEAD/records",
        json={
            "company": "Acme Corp",
            "contact_name": "Jane Doe",
            "status": "new",
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_contact_create_accepts_valid_lead_lookup(client: TestClient) -> None:
    lead = _seed_lead(client)
    created = client.post(
        "/api/v1/entities/CONTACT/records",
        json={
            "name": "Jane Doe",
            "email": "jane@acme.example",
            "lead_id": lead["id"],
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["lead_id"] == lead["id"]


def test_contact_create_rejects_unknown_lead_lookup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/CONTACT/records",
        json={
            "name": "Orphan Contact",
            "email": "orphan@example.com",
            "lead_id": "00000000-0000-0000-0000-000000000000",
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for lead_id" in response.json()["detail"]
