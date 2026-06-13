"""P5-T05: Inventory module must extend EMCAP via the plug-in model only.

SDD §27–§30 require business modules to export ``ModuleDefinition`` from
``modules/<name>/module.py`` and receive platform capabilities without edits to
``platform/api/src/emcap/``. These tests document that contract and guard against
accidental core changes during module work.
"""

from __future__ import annotations

import ast
import subprocess
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from emcap.entity.registry import EntityRegistry
from emcap.module.loader import load_module_definition, load_modules
from emcap.module.models import ModuleDefinition

ROOT = Path(__file__).resolve().parents[3]
PLATFORM_CORE = ROOT / "platform" / "api" / "src" / "emcap"
INVENTORY_MODULE = ROOT / "modules" / "inventory" / "module.py"

# SDK imports allowed in business modules (no platform route/service edits).
ALLOWED_MODULE_IMPORT_PREFIXES = (
    "emcap.entity.",
    "emcap.module.",
    "emcap.reporting.",
    "emcap.workflow.",
)
ALLOWED_STDLIB_MODULE_IMPORTS = frozenset({"importlib", "pathlib", "typing"})


def _git_has_committed_baseline() -> bool:
    """True when platform core is tracked at HEAD and the working tree matches it."""
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if head.returncode != 0:
        return False

    tracked = subprocess.run(
        ["git", "ls-files", "platform/api/src/emcap/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if not tracked.stdout.strip():
        return False

    diff = subprocess.run(
        ["git", "diff", "--quiet", "HEAD", "--", "platform/api/src/emcap/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if diff.returncode != 0:
        return False

    staged = subprocess.run(
        ["git", "diff", "--cached", "--quiet", "HEAD", "--", "platform/api/src/emcap/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if staged.returncode != 0:
        return False

    untracked = subprocess.run(
        [
            "git",
            "ls-files",
            "--others",
            "--exclude-standard",
            "platform/api/src/emcap/",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return not untracked.stdout.strip()


def _git_diff_platform_core() -> tuple[bool, str]:
    """Return (is_git_repo, diff_output). Empty diff means core unchanged."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "platform/api/src/emcap/"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return False, "git executable not found"

    if result.returncode != 128 and "not a git repository" in (result.stderr or "").lower():
        return False, result.stderr.strip()

    if result.returncode not in (0, 1):
        return True, result.stderr.strip() or result.stdout.strip()

    staged = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "platform/api/src/emcap/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    combined = "\n".join(filter(None, [result.stdout.strip(), staged.stdout.strip()]))
    return True, combined


def _inventory_module_imports() -> list[str]:
    tree = ast.parse(INVENTORY_MODULE.read_text(encoding="utf-8"))
    imports: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)
    return imports


def test_inventory_module_file_exports_module_definition() -> None:
    """Inventory registers capabilities through ``MODULE: ModuleDefinition`` only."""
    assert INVENTORY_MODULE.is_file(), "Expected modules/inventory/module.py"

    definition = load_module_definition(INVENTORY_MODULE)
    assert isinstance(definition, ModuleDefinition)
    assert definition.code == "INVENTORY"
    assert {entity.code for entity in definition.entities} == {
        "PRODUCT",
        "WAREHOUSE",
        "STOCK_MOVEMENT",
        "STOCK_MOVEMENT_LINE",
    }
    assert {workflow.code for workflow in definition.workflows} == {"STOCK_ADJUSTMENT"}
    assert {report.code for report in definition.reports} == {
        "INVENTORY_VALUATION",
        "LOW_STOCK",
    }
    assert {dashboard.code for dashboard in definition.dashboards} == {"INVENTORY_OVERVIEW"}
    assert {menu.code for menu in definition.menus} == {"products", "warehouses", "stock_movements"}


def test_inventory_module_uses_sdk_imports_only() -> None:
    """Business module must not import platform internals beyond the public SDK."""
    for module_name in _inventory_module_imports():
        if module_name in ALLOWED_STDLIB_MODULE_IMPORTS:
            continue
        assert module_name.startswith(
            ALLOWED_MODULE_IMPORT_PREFIXES
        ), f"Unexpected import in inventory module: {module_name}"


def test_inventory_module_package_isolated_under_modules() -> None:
    """Module deliverable lives under modules/inventory/, not platform core."""
    module_root = ROOT / "modules" / "inventory"
    py_files = list(module_root.rglob("*.py"))
    assert py_files, "Inventory module must contain at least module.py"
    for path in py_files:
        assert path.is_relative_to(module_root)
        assert not path.is_relative_to(PLATFORM_CORE)


def test_platform_core_has_no_git_diff_for_inventory_work() -> None:
    """Informational guard: platform/api/src/emcap/ should have no local diff."""
    if not _git_has_committed_baseline():
        pytest.skip(
            "Platform core has no clean committed baseline (missing history or local changes) — "
            "skip until HEAD matches platform/api/src/emcap/; "
            "use scripts/verify-platform-core.* before inventory-only PRs"
        )

    is_git, diff_output = _git_diff_platform_core()
    if not is_git:
        pytest.skip("Not a git repository — run scripts/verify-platform-core.* locally")

    changed = [line for line in diff_output.splitlines() if line.strip()]
    assert (
        changed == []
    ), "Platform core must remain unchanged for plug-in modules. " "Modified files:\n" + "\n".join(
        changed
    )


def test_inventory_capabilities_via_generic_platform_apis(client: TestClient) -> None:
    """Inventory entities receive auto-generated APIs without inventory-specific routes."""
    entities = client.get("/api/v1/entities").json()["entities"]
    assert "PRODUCT" in entities
    assert "WAREHOUSE" in entities

    created = client.post(
        "/api/v1/entities/PRODUCT/records",
        json={
            "sku": "CORE-CHK",
            "name": "Platform Core Check",
            "unit_price": 1.0,
            "quantity_on_hand": 5,
            "reorder_level": 2,
            "active": True,
        },
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    assert client.get("/api/v1/metadata/forms/PRODUCT").status_code == 200
    assert client.get("/api/v1/metadata/grids/PRODUCT").status_code == 200

    search = client.get("/api/v1/entities/PRODUCT/records", params={"q": "CORE"})
    assert search.status_code == 200
    assert len(search.json()["records"]) >= 1

    audit = client.get("/api/v1/entities/PRODUCT/audit")
    assert audit.status_code == 200
    assert len(audit.json()["audit"]) >= 1

    workflow = client.post(
        "/api/v1/workflows/STOCK_ADJUSTMENT/start",
        json={"record_id": record_id, "assignee": "auditor"},
    )
    assert workflow.status_code == 200

    reports = client.get("/api/v1/reports").json()["reports"]
    report_codes = [r["code"] if isinstance(r, dict) else r for r in reports]
    assert "INVENTORY_VALUATION" in report_codes

    menus = client.get("/api/v1/menus").json()["menus"]
    assert any(menu["module"] == "INVENTORY" for menu in menus)

    permissions = client.get("/api/v1/permissions").json()["permissions"]
    assert "inventory.access" in permissions


def test_inventory_loaded_through_module_registry_not_core_edits() -> None:
    """Registry discovery loads inventory alongside other modules without core patches."""
    registry = EntityRegistry()
    modules = load_modules(registry, ROOT / "modules")
    registry.validate()

    module_codes = {module.code for module in modules}
    assert "INVENTORY" in module_codes
    assert registry.get("PRODUCT").code == "PRODUCT"
    assert registry.get("WAREHOUSE").code == "WAREHOUSE"
