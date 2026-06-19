"""W2 module fields — JOURNAL_ENTRY, SALE, LEAVE_REQUEST currency/lookup/enum upgrades."""

from fastapi.testclient import TestClient

LEAVE_TYPES = ["annual", "sick", "unpaid", "other"]


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def test_journal_entry_account_lookup_and_amount_currency(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/JOURNAL_ENTRY").json()
    grid = client.get("/api/v1/metadata/grids/JOURNAL_ENTRY").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["account_id"]["field_type"] == "lookup"
    assert fields["account_id"]["lookup_entity"] == "ACCOUNT"
    assert fields["amount"]["field_type"] == "currency"
    assert fields["amount"]["currency_code"] == "USD"

    grid_account = next(column for column in grid["columns"] if column["field"] == "account_id")
    assert grid_account["field_type"] == "lookup"
    assert grid_account["lookup_entity"] == "ACCOUNT"

    status = form["display"]["status_field"]
    assert status["field"] == "status"
    assert status["active_values"] == ["draft"]


def test_sale_total_currency_and_terminal_lookup(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/SALE").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["total"]["field_type"] == "currency"
    assert fields["total"]["currency_code"] == "USD"
    assert fields["terminal_id"]["field_type"] == "lookup"
    assert fields["terminal_id"]["lookup_entity"] == "TERMINAL"

    status = form["display"]["status_field"]
    assert status["field"] == "active"


def test_leave_request_employee_lookup_and_leave_type_enum(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/LEAVE_REQUEST").json()
    grid = client.get("/api/v1/metadata/grids/LEAVE_REQUEST").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["employee_id"]["field_type"] == "lookup"
    assert fields["employee_id"]["lookup_entity"] == "EMPLOYEE"
    assert fields["leave_type"]["field_type"] == "select"
    assert fields["leave_type"]["options"] == LEAVE_TYPES

    grid_leave = next(column for column in grid["columns"] if column["field"] == "leave_type")
    assert grid_leave["field_type"] == "select"

    status = form["display"]["status_field"]
    assert status["field"] == "active"


def _seed_account(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "W2-1000", "name": "W2 Cash", "balance": 1000.0, "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_terminal(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/TERMINAL/records",
        json={"terminal_id": "T-W2-01", "location": "Front Desk", "active": True},
    )
    assert response.status_code == 201
    return response.json()


def _seed_employee(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/entities/EMPLOYEE/records",
        json={
            "employee_no": "EMP-W2-01",
            "full_name": "Bob Smith",
            "department": "sales",
            "active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_journal_entry_create_accepts_valid_account_lookup(client: TestClient) -> None:
    account = _seed_account(client)
    created = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={
            "reference": "JE-W2-001",
            "account_id": account["id"],
            "amount": 250.75,
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["account_id"] == account["id"]


def test_journal_entry_create_rejects_unknown_account_lookup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={
            "reference": "JE-W2-BAD",
            "account_id": "00000000-0000-0000-0000-000000000000",
            "amount": 100.0,
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for account_id" in response.json()["detail"]


def test_sale_create_accepts_valid_terminal_lookup(client: TestClient) -> None:
    terminal = _seed_terminal(client)
    created = client.post(
        "/api/v1/entities/SALE/records",
        json={
            "receipt_no": "RC-W2-001",
            "total": 42.99,
            "terminal_id": terminal["id"],
            "payment_method": "card",
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["terminal_id"] == terminal["id"]


def test_leave_request_create_accepts_valid_employee_lookup(client: TestClient) -> None:
    employee = _seed_employee(client)
    created = client.post(
        "/api/v1/entities/LEAVE_REQUEST/records",
        json={
            "employee_id": employee["id"],
            "leave_type": "annual",
            "days": 5,
            "active": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["employee_id"] == employee["id"]
    assert created.json()["leave_type"] == "annual"


def test_leave_request_create_rejects_unknown_employee_lookup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/LEAVE_REQUEST/records",
        json={
            "employee_id": "00000000-0000-0000-0000-000000000000",
            "leave_type": "sick",
            "days": 1,
            "active": True,
        },
    )
    assert response.status_code == 400
    assert "Invalid lookup for employee_id" in response.json()["detail"]
