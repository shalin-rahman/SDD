"""Parametrized system-metadata contract for every registered entity."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from emcap.entity.registry import EntityRegistry
from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS, SYSTEM_FIELD_NAMES
from emcap.module.loader import load_modules

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = Path(__file__).parent / "fixtures" / "metadata"

SYSTEM_FORM_FIELD_NAMES = [
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "record_version",
    "deleted_at",
]

W1_FIXTURE_ENTITIES = frozenset({"PRODUCT", "WAREHOUSE", "CUSTOMER", "LEAD", "CONTACT"})
W3_FIXTURE_ENTITIES = frozenset({"ACCOUNT", "TERMINAL", "EMPLOYEE"})
W4_FIXTURE_ENTITIES = frozenset({"SUPPLIER", "PURCHASE_ORDER", "SALES_ORDER", "INVOICE"})
W5_FIXTURE_ENTITIES = frozenset({"STOCK_MOVEMENT", "STOCK_MOVEMENT_LINE"})
P25_FIXTURE_ENTITIES = frozenset(
    {
        "PURCHASE_ORDER_LINE",
        "SALES_ORDER_LINE",
        "VENDOR_PAYMENT",
        "CUSTOMER_PAYMENT",
        "JOURNAL_ENTRY_LINE",
    }
)

_SAMPLE_VALUES: dict[str, object] = {
    "text": "sample",
    "email": "sample@example.com",
    "number": 1,
    "checkbox": True,
    "date": "2026-01-01",
    "datetime": "2026-01-01T00:00:00+00:00",
    "select": "new",
    "lookup": "00000000-0000-0000-0000-000000000001",
    "currency": 1.0,
    "textarea": "sample notes",
}


def _registry_entity_codes() -> list[str]:
    registry = EntityRegistry()
    load_modules(registry, ROOT / "modules")
    registry.validate()
    return registry.list_codes()


def pytest_generate_tests(metafunc: pytest.Metafunc) -> None:
    if "entity_code" in metafunc.fixturenames:
        metafunc.parametrize("entity_code", _registry_entity_codes())


def _main_form_fields(form: dict) -> list[dict]:
    return form["sections"][0]["fields"]


def _minimal_create_payload(client: TestClient, entity_code: str) -> dict[str, object]:
    form = client.get(f"/api/v1/metadata/forms/{entity_code}").json()
    payload: dict[str, object] = {}
    for field in _main_form_fields(form):
        if not field.get("required"):
            continue
        field_type = field["field_type"]
        if field_type == "select":
            options = field.get("options") or []
            payload[field["name"]] = options[0] if options else "sample"
            continue
        payload[field["name"]] = _SAMPLE_VALUES.get(field_type, "sample")
    return payload


def test_form_has_main_and_system_sections(client: TestClient, entity_code: str) -> None:
    form = client.get(f"/api/v1/metadata/forms/{entity_code}").json()
    section_codes = [section["code"] for section in form["sections"]]
    assert section_codes == ["main", "system"], entity_code

    system_fields = form["sections"][1]["fields"]
    system_names = [field["name"] for field in system_fields]
    assert system_names == SYSTEM_FORM_FIELD_NAMES, entity_code
    assert all(field["read_only"] for field in system_fields), entity_code


def test_grid_includes_system_columns(client: TestClient, entity_code: str) -> None:
    grid = client.get(f"/api/v1/metadata/grids/{entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    for system_column in GRID_SYSTEM_COLUMNS:
        assert system_column in column_fields, entity_code
    assert column_fields[-len(GRID_SYSTEM_COLUMNS) :] == list(GRID_SYSTEM_COLUMNS), entity_code


def test_reject_system_fields_in_create_payload(client: TestClient, entity_code: str) -> None:
    payload = _minimal_create_payload(client, entity_code)
    payload["created_at"] = "2099-01-01T00:00:00+00:00"
    response = client.post(f"/api/v1/entities/{entity_code}/records", json=payload)
    assert response.status_code == 400, entity_code
    assert "Cannot set system fields" in response.json()["detail"], entity_code
    injected = set(payload.keys()) & SYSTEM_FIELD_NAMES
    assert injected == {"created_at"}, entity_code


@pytest.mark.parametrize("w1_entity_code", sorted(W1_FIXTURE_ENTITIES))
def test_w1_form_keys_match_fixture(client: TestClient, w1_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w1_entity_code.lower()}.form.keys.json"
    assert fixture_path.is_file(), w1_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    form = client.get(f"/api/v1/metadata/forms/{w1_entity_code}").json()
    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == fixture["field_names"], w1_entity_code


@pytest.mark.parametrize("w1_entity_code", sorted(W1_FIXTURE_ENTITIES))
def test_w1_grid_keys_match_fixture(client: TestClient, w1_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w1_entity_code.lower()}.grid.keys.json"
    assert fixture_path.is_file(), w1_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    grid = client.get(f"/api/v1/metadata/grids/{w1_entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"], w1_entity_code


@pytest.mark.parametrize("w3_entity_code", sorted(W3_FIXTURE_ENTITIES))
def test_w3_form_keys_match_fixture(client: TestClient, w3_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w3_entity_code.lower()}.form.keys.json"
    assert fixture_path.is_file(), w3_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    form = client.get(f"/api/v1/metadata/forms/{w3_entity_code}").json()
    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == fixture["field_names"], w3_entity_code


@pytest.mark.parametrize("w3_entity_code", sorted(W3_FIXTURE_ENTITIES))
def test_w3_grid_keys_match_fixture(client: TestClient, w3_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w3_entity_code.lower()}.grid.keys.json"
    assert fixture_path.is_file(), w3_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    grid = client.get(f"/api/v1/metadata/grids/{w3_entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"], w3_entity_code


@pytest.mark.parametrize("w4_entity_code", sorted(W4_FIXTURE_ENTITIES))
def test_w4_form_keys_match_fixture(client: TestClient, w4_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w4_entity_code.lower()}.form.keys.json"
    assert fixture_path.is_file(), w4_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    form = client.get(f"/api/v1/metadata/forms/{w4_entity_code}").json()
    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == fixture["field_names"], w4_entity_code


@pytest.mark.parametrize("w4_entity_code", sorted(W4_FIXTURE_ENTITIES))
def test_w4_grid_keys_match_fixture(client: TestClient, w4_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w4_entity_code.lower()}.grid.keys.json"
    assert fixture_path.is_file(), w4_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    grid = client.get(f"/api/v1/metadata/grids/{w4_entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"], w4_entity_code


@pytest.mark.parametrize("w5_entity_code", sorted(W5_FIXTURE_ENTITIES))
def test_w5_form_keys_match_fixture(client: TestClient, w5_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w5_entity_code.lower()}.form.keys.json"
    assert fixture_path.is_file(), w5_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    form = client.get(f"/api/v1/metadata/forms/{w5_entity_code}").json()
    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == fixture["field_names"], w5_entity_code


@pytest.mark.parametrize("w5_entity_code", sorted(W5_FIXTURE_ENTITIES))
def test_w5_grid_keys_match_fixture(client: TestClient, w5_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{w5_entity_code.lower()}.grid.keys.json"
    assert fixture_path.is_file(), w5_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    grid = client.get(f"/api/v1/metadata/grids/{w5_entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"], w5_entity_code


@pytest.mark.parametrize("p25_entity_code", sorted(P25_FIXTURE_ENTITIES))
def test_p25_form_keys_match_fixture(client: TestClient, p25_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{p25_entity_code.lower()}.form.keys.json"
    assert fixture_path.is_file(), p25_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    form = client.get(f"/api/v1/metadata/forms/{p25_entity_code}").json()
    field_names = [field["name"] for field in _main_form_fields(form)]
    assert field_names == fixture["field_names"], p25_entity_code


@pytest.mark.parametrize("p25_entity_code", sorted(P25_FIXTURE_ENTITIES))
def test_p25_grid_keys_match_fixture(client: TestClient, p25_entity_code: str) -> None:
    fixture_path = FIXTURES / f"{p25_entity_code.lower()}.grid.keys.json"
    assert fixture_path.is_file(), p25_entity_code
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    grid = client.get(f"/api/v1/metadata/grids/{p25_entity_code}").json()
    column_fields = [column["field"] for column in grid["columns"]]
    assert column_fields == fixture["column_fields"], p25_entity_code
