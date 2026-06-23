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


def _create_balanced_journal(
    client: TestClient,
    *,
    reference: str,
    amount: float = 50.0,
) -> tuple[dict, dict, dict]:
    cash, revenue = _seed_accounts(client)
    entry = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={"reference": reference, "status": "draft", "active": True},
    ).json()

    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry["id"],
            "account_id": cash["id"],
            "debit": amount,
            "credit": 0.0,
        },
    )
    client.post(
        "/api/v1/entities/JOURNAL_ENTRY_LINE/records",
        json={
            "journal_entry_id": entry["id"],
            "account_id": revenue["id"],
            "debit": 0.0,
            "credit": amount,
        },
    )
    return cash, revenue, entry


def _post_journal(client: TestClient, entry: dict) -> dict:
    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "posted"},
        headers={"If-Match": str(entry["record_version"])},
    )
    assert response.status_code == 200
    return response.json()


def test_void_posted_journal_transition(client: TestClient) -> None:
    _cash, _revenue, entry = _create_balanced_journal(client, reference="JE-VOID-OK")
    posted = _post_journal(client, entry)

    voided = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "void"},
        headers={"If-Match": str(posted["record_version"])},
    )
    assert voided.status_code == 200
    assert voided.json()["status"] == "void"


def test_void_posted_journal_reverses_account_balances(client: TestClient) -> None:
    cash, revenue, entry = _create_balanced_journal(client, reference="JE-VOID-BAL")
    posted = _post_journal(client, entry)

    cash_posted = client.get(f"/api/v1/entities/ACCOUNT/records/{cash['id']}").json()
    revenue_posted = client.get(f"/api/v1/entities/ACCOUNT/records/{revenue['id']}").json()
    assert cash_posted["balance"] == 150.0
    assert revenue_posted["balance"] == 50.0

    voided = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "void"},
        headers={"If-Match": str(posted["record_version"])},
    )
    assert voided.status_code == 200

    cash_after = client.get(f"/api/v1/entities/ACCOUNT/records/{cash['id']}").json()
    revenue_after = client.get(f"/api/v1/entities/ACCOUNT/records/{revenue['id']}").json()
    assert cash_after["balance"] == 100.0
    assert revenue_after["balance"] == 0.0


def test_void_draft_journal_rejected(client: TestClient) -> None:
    _cash, _revenue, entry = _create_balanced_journal(client, reference="JE-VOID-DRAFT")

    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "void"},
        headers={"If-Match": str(entry["record_version"])},
    )
    assert response.status_code == 400
    assert "only posted journal entries can be voided" in response.json()["detail"]


def test_voided_journal_cannot_be_edited(client: TestClient) -> None:
    _cash, _revenue, entry = _create_balanced_journal(client, reference="JE-VOID-LOCK")
    posted = _post_journal(client, entry)
    voided = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"status": "void"},
        headers={"If-Match": str(posted["record_version"])},
    )
    assert voided.status_code == 200

    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"reference": "JE-VOID-LOCK-EDIT"},
        headers={"If-Match": str(voided.json()["record_version"])},
    )
    assert response.status_code == 400
    assert "void journal entries cannot be modified" in response.json()["detail"]


def test_posted_journal_cannot_be_edited_except_void(client: TestClient) -> None:
    _cash, _revenue, entry = _create_balanced_journal(client, reference="JE-POST-LOCK")
    posted = _post_journal(client, entry)

    response = client.put(
        f"/api/v1/entities/JOURNAL_ENTRY/records/{entry['id']}",
        json={"reference": "JE-POST-LOCK-EDIT"},
        headers={"If-Match": str(posted["record_version"])},
    )
    assert response.status_code == 400
    assert "posted journal entries cannot be modified except to void" in response.json()["detail"]


def test_cannot_create_journal_in_void_status(client: TestClient) -> None:
    response = client.post(
        "/api/v1/entities/JOURNAL_ENTRY/records",
        json={"reference": "JE-VOID-CREATE", "status": "void", "active": True},
    )
    assert response.status_code == 400
    assert "cannot create journal entry directly in void status" in response.json()["detail"]
