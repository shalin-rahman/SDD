from pathlib import Path

import pytest

from emcap.entity.models import EntityDefinition, FieldDefinition, FieldType
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.module.loader import discover_module_files, load_modules

ROOT = Path(__file__).resolve().parents[3]


def test_registry_rejects_duplicate_entity() -> None:
    registry = EntityRegistry()
    entity = EntityDefinition(
        code="ITEM",
        fields=[FieldDefinition(name="name", field_type=FieldType.STRING, required=True)],
    )
    registry.register(entity)
    with pytest.raises(EntityRegistryError):
        registry.register(entity)


def test_module_discovery_finds_demo_module() -> None:
    paths = discover_module_files(ROOT / "modules")
    assert any(path.parent.name == "demo" for path in paths)


def test_load_demo_module_registers_customer() -> None:
    registry = EntityRegistry()
    modules = load_modules(registry, ROOT / "modules")
    registry.validate()
    module_codes = {module.code for module in modules}
    assert "DEMO" in module_codes
    assert "INVENTORY" in module_codes
    assert registry.get("CUSTOMER").code == "CUSTOMER"
    assert registry.get("PRODUCT").code == "PRODUCT"
