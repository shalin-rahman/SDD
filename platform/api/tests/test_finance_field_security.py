"""P25 finance field security — read_roles on procurement/sales/accounting amounts."""

from fastapi.testclient import TestClient


def _admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _viewer_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "viewer", "password": "viewer123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "accounting.view" not in body["permissions"]
    return body["access_token"]


def test_po_finance_fields_hidden_from_viewer_metadata(client: TestClient) -> None:
    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER", headers=viewer_headers).json()
    field_names = [field["name"] for field in form["sections"][0]["fields"]]
    assert "total_amount" not in field_names
    assert "amount_paid" not in field_names
    assert "balance_due" not in field_names


def test_po_line_unit_price_hidden_from_viewer_metadata(client: TestClient) -> None:
    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER_LINE", headers=viewer_headers).json()
    field_names = [field["name"] for field in form["sections"][0]["fields"]]
    assert "unit_price" not in field_names


def test_admin_sees_po_finance_fields_in_metadata(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {_admin_token(client)}"}
    form = client.get("/api/v1/metadata/forms/PURCHASE_ORDER", headers=admin_headers).json()
    field_names = [field["name"] for field in form["sections"][0]["fields"]]
    assert "total_amount" in field_names
    assert "balance_due" in field_names


def test_account_balance_hidden_from_viewer_metadata(client: TestClient) -> None:
    viewer_headers = {"Authorization": f"Bearer {_viewer_token(client)}"}
    form = client.get("/api/v1/metadata/forms/ACCOUNT", headers=viewer_headers).json()
    field_names = [field["name"] for field in form["sections"][0]["fields"]]
    assert "balance" not in field_names


def test_procurement_module_exports_finance_permissions() -> None:
    from pathlib import Path

    import importlib.util

    path = Path(__file__).resolve().parents[3] / "modules" / "procurement" / "module.py"
    spec = importlib.util.spec_from_file_location("procurement_module", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    perms = module.MODULE.permissions
    assert "procurement.pay" in perms
    assert "procurement.access" in perms


def test_sales_and_accounting_finance_permissions() -> None:
    from pathlib import Path

    import importlib.util

    for mod_name, expected in (
        ("sales", {"sales.collect", "sales.access"}),
        ("accounting", {"accounting.post", "accounting.view", "accounting.access"}),
    ):
        path = Path(__file__).resolve().parents[3] / "modules" / mod_name / "module.py"
        spec = importlib.util.spec_from_file_location(f"{mod_name}_module", path)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for perm in expected:
            assert perm in module.MODULE.permissions
