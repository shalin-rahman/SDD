"""Module report menus reachable from GET /api/v1/menus (P18-T05)."""

from fastapi.testclient import TestClient

from emcap.main import app

client = TestClient(app)


def _menu_codes(module: str) -> set[str]:
    menus = client.get("/api/v1/menus").json()["menus"]
    return {m["code"] for m in menus if m["module"] == module}


def _report_menu(module: str, report_code: str) -> dict | None:
    menus = client.get("/api/v1/menus").json()["menus"]
    for menu in menus:
        if menu["module"] == module and menu.get("report_code") == report_code:
            return menu
    return None


def test_inventory_report_menus_include_low_stock_and_valuation():
    assert "low_stock" in _menu_codes("INVENTORY")
    assert "inventory_valuation" in _menu_codes("INVENTORY")
    assert "stock_movement_history" in _menu_codes("INVENTORY")


def test_inventory_low_stock_menu_has_report_code():
    menu = _report_menu("INVENTORY", "LOW_STOCK")
    assert menu is not None
    assert menu["entity_code"] == "PRODUCT"
    assert menu["label"] == "Low Stock Report"


def test_crm_open_leads_report_menu():
    menu = _report_menu("CRM", "OPEN_LEADS")
    assert menu is not None
    assert menu["entity_code"] == "LEAD"


def test_procurement_sales_accounting_pos_hrm_report_menus():
    assert _report_menu("PROCUREMENT", "OPEN_PURCHASE_ORDERS") is not None
    assert _report_menu("SALES", "OPEN_SALES_ORDERS") is not None
    assert _report_menu("SALES", "OUTSTANDING_INVOICES") is not None
    assert _report_menu("ACCOUNTING", "ACCOUNT_BALANCES") is not None
    assert _report_menu("POS", "DAILY_SALES") is not None
    assert _report_menu("HRM", "ACTIVE_EMPLOYEES") is not None
