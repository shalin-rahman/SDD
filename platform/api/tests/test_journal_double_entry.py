"""P25 journal double-entry — balance check and account rollup."""

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


def _seed_accounts(client: TestClient) -> tuple[dict, dict]:
    cash = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "JE-CASH", "name": "JE Cash", "account_type": "asset", "balance": 100.0, "active": True},
    )
    assert cash.status_code == 201
    revenue = client.post(
        "/api/v1/entities/ACCOUNT/records",
        json={"code": "JE-REV", "name": "JE Revenue", "account_type": "revenue", "balance": 0.0, "active": True},
    )
    assert revenue.status_code == 201
    return cash.json(), revenue.json()


def test_journal_entry_line_metadata(client: TestClient) -> None:
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "JOURNAL_ENTRY_LINE" in entities

    form = client.get("/api/v1/metadata/forms/JOURNAL_ENTRY_LINE").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["journal_entry_id"]["lookup_entity"] == "JOURNAL_ENTRY"
    assert _field_read_roles("accounting", "JOURNAL_ENTRY_LINE", "debit") == ["accounting.view"]
    assert _field_read_roles("accounting", "JOURNAL_ENTRY_LINE", "credit") == ["accounting.view"]


def test_journal_entry_extended_fields(client: TestClient) -> None:
    form = client.get("/api/v1/metadata/forms/JOURNAL_ENTRY").json()
    fields = {field["name"]: field for field in form["sections"][0]["fields"]}
    assert fields["source_type"]["field_type"] == "select"
    assert fields["status"]["options"] == ["draft", "posted", "void"]
    assert form["display"]["status_field"]["field"] == "status"


def test_unbalanced_journal_rejected_on_post(client: TestClient) -> None:
    cash, revenue = _seed_accounts(client)

    entry = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={"reference": "JE-UNBAL", "status": "draft", "active": True},
    )
    assert entry.status_code == 201
    entry_body = entry.json()

    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry_body["id"],
            "account_id": cash["id"],
            "debit": 50.0,
            "credit": 0.0,
        },
    )
    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry_body["id"],
            "account_id": revenue["id"],
            "debit": 0.0,
            "credit": 40.0,
        },
    )

    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry_body['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(entry_body["record_version"])},
    )
    assert response.status_code == 400
    assert "not balanced" in response.json()["detail"]


def test_balanced_journal_updates_account_balances(client: TestClient) -> None:
    cash, revenue = _seed_accounts(client)

    entry = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={"reference": "JE-BAL", "status": "draft", "active": True},
    ).json()

    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry["id"],
            "account_id": cash["id"],
            "debit": 50.0,
            "credit": 0.0,
        },
    )
    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry["id"],
            "account_id": revenue["id"],
            "debit": 0.0,
            "credit": 50.0,
        },
    )

    posted = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(entry["record_version"])},
    )
    assert posted.status_code == 200

    cash_after = client.get(f"/api/v1/entities/ACCOUNT/records/{cash['id']}").json()
    revenue_after = client.get(f"/api/v1/entities/ACCOUNT/records/{revenue['id']}").json()
    assert cash_after["balance"] == 150.0
    assert revenue_after["balance"] == 50.0


def test_post_journal_without_lines_rejected(client: TestClient) -> None:
    entry = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={"reference": "JE-NOLINE", "status": "draft", "active": True},
    ).json()

    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(entry["record_version"])},
    )
    assert response.status_code == 400
    assert "without lines" in response.json()["detail"]
