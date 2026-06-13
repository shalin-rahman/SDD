from pathlib import Path

import pytest
from pydantic import ValidationError

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


def test_registry_rejects_unknown_lookup_entity() -> None:
    registry = EntityRegistry()
    registry.register(
        EntityDefinition(
            code="ITEM",
            fields=[
                FieldDefinition(
                    name="parent",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="MISSING",
                )
            ],
        )
    )
    with pytest.raises(EntityRegistryError, match="references unknown entity"):
        registry.validate()


def test_field_definition_rejects_currency_code_on_non_currency() -> None:
    with pytest.raises(ValidationError, match="currency_code is only valid"):
        FieldDefinition(name="note", field_type=FieldType.STRING, currency_code="USD")


def test_field_definition_currency_defaults_to_usd() -> None:
    field = FieldDefinition(name="amount", field_type=FieldType.CURRENCY)
    assert field.currency_code == "USD"
