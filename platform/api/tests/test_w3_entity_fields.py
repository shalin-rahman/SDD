"""W3 module fields — ACCOUNT, TERMINAL, EMPLOYEE currency/enum/status upgrades."""

from fastapi.testclient import TestClient

DEPARTMENTS = ["sales", "ops", "finance", "hr", "it", "other"]


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def test_account_balance_currency_and_status_field(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/ACCOUNT").json()
    grid = client.get("/api/v1/metadata/grids/ACCOUNT").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["balance"]["field_type"] == "currency"
    assert fields["balance"]["currency_code"] == "USD"

    grid_balance = next(column for column in grid["columns"] if column["field"] == "balance")
    assert grid_balance["field_type"] == "currency"
    assert grid_balance["currency_code"] == "USD"

    status = form["display"]["status_field"]
    assert status["field"] == "active"
    assert status["labels"]["active"]["bn"] == "সক্রিয়"


def test_terminal_status_field(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/TERMINAL").json()
    status = form["display"]["status_field"]
    assert status["field"] == "active"


def test_employee_department_enum_and_status_field(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/EMPLOYEE").json()
    grid = client.get("/api/v1/metadata/grids/EMPLOYEE").json()
    fields = {field["name"]: field for field in _main_form_fields(form)}

    assert fields["department"]["field_type"] == "select"
    assert fields["department"]["options"] == DEPARTMENTS

    grid_dept = next(column for column in grid["columns"] if column["field"] == "department")
    assert grid_dept["field_type"] == "select"

    status = form["display"]["status_field"]
    assert status["field"] == "active"


def test_account_crud_smoke(client: TestClient) -> None:
    created = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "W3-1000", "name": "W3 Cash", "balance": 2500.5, "active": True},
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    fetched = client.get(f"/api/v1/entities/ACCOUNT/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["balance"] == 2500.5

    updated = client.put(
        f"/api/v1/entities/ACCOUNT/records/{record_id}",
        json={"code": "W3-1000", "name": "W3 Cash Updated", "balance": 3000.0, "active": True},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "W3 Cash Updated"


def test_terminal_crud_smoke(client: TestClient) -> None:
    created = client.post(
        "/api/v1/entities/TERMINAL/records",
        json={"terminal_id": "T-W3-01", "location": "Lobby", "active": True},
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    fetched = client.get(f"/api/v1/entities/TERMINAL/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["terminal_id"] == "T-W3-01"

    updated = client.put(
        f"/api/v1/entities/TERMINAL/records/{record_id}",
        json={"terminal_id": "T-W3-01", "location": "Back Office", "active": True},
    )
    assert updated.status_code == 200
    assert updated.json()["location"] == "Back Office"


def test_employee_crud_smoke(client: TestClient) -> None:
    created = client.post(
        "/api/v1/entities/EMPLOYEE/records",
        json={
            "employee_no": "EMP-W3-01",
            "full_name": "Alice Jones",
            "department": "sales",
            "active": True,
        },
    )
    assert created.status_code == 201
    record_id = created.json()["id"]
    assert created.json()["department"] == "sales"

    fetched = client.get(f"/api/v1/entities/EMPLOYEE/records/{record_id}")
    assert fetched.status_code == 200

    updated = client.put(
        f"/api/v1/entities/EMPLOYEE/records/{record_id}",
        json={
            "employee_no": "EMP-W3-01",
            "full_name": "Alice Jones",
            "department": "finance",
            "active": True,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["department"] == "finance"


def test_employee_create_rejects_invalid_department(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/EMPLOYEE/records",
        json={
            "employee_no": "EMP-W3-BAD",
            "full_name": "Bad Dept",
            "department": "Sales",
            "active": True,
        },
    )
    assert response.status_code == 400
