import pytest
from pydantic import ValidationError

from emcap.config.loader import load_platform_config
from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.metadata.builder import build_form_metadata, build_grid_metadata
from emcap.metadata.validation import MetadataValidationError, validate_entity_for_metadata


def test_registry_rejects_self_lookup_entity() -> None:
    registry = EntityRegistry()
    registry.register(
        EntityDefinition(
            code="ITEM",
            fields=[
                FieldDefinition(
                    name="parent",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="ITEM",
                )
            ],
        )
    )
    with pytest.raises(EntityRegistryError, match="cannot reference the same entity"):
        registry.validate()


def test_registry_rejects_enum_without_options() -> None:
    registry = EntityRegistry()
    with pytest.raises(ValidationError, match="options are required"):
        EntityDefinition(
            code="ITEM",
            fields=[FieldDefinition(name="status", field_type=FieldType.ENUM)],
        )


def test_field_definition_rejects_options_on_non_enum() -> None:
    with pytest.raises(ValidationError, match="options are only valid"):
        FieldDefinition(name="note", field_type=FieldType.STRING, options=["a"])


def test_field_definition_rejects_lookup_without_entity() -> None:
    with pytest.raises(ValidationError, match="lookup_entity is required"):
        FieldDefinition(name="parent", field_type=FieldType.LOOKUP)


def test_field_definition_rejects_invalid_currency_code() -> None:
    with pytest.raises(ValidationError, match="Invalid currency_code"):
        FieldDefinition(name="amount", field_type=FieldType.CURRENCY, currency_code="US")


def test_validate_entity_rejects_self_lookup_with_entity_codes() -> None:
    entity = EntityDefinition(
        code="ITEM",
        fields=[
            FieldDefinition(
                name="parent",
                field_type=FieldType.LOOKUP,
                lookup_entity="ITEM",
            )
        ],
    )
    with pytest.raises(MetadataValidationError, match="cannot reference the same entity"):
        validate_entity_for_metadata(entity, {"ITEM"})


def test_build_form_metadata_rejects_incomplete_lookup_config() -> None:
    field = FieldDefinition.model_construct(
        name="parent",
        field_type=FieldType.LOOKUP,
        lookup_entity=None,
        required=False,
        searchable=True,
        read_roles=[],
        options=[],
        currency_code=None,
    )
    entity = EntityDefinition.model_construct(
        code="ITEM",
        fields=[field],
        options=EntityOptions(),
    )
    with pytest.raises(MetadataValidationError, match="requires lookup_entity"):
        build_form_metadata(entity)


def test_build_grid_metadata_rejects_incomplete_currency_config() -> None:
    field = FieldDefinition.model_construct(
        name="amount",
        field_type=FieldType.CURRENCY,
        currency_code=None,
        required=False,
        searchable=True,
        read_roles=[],
        options=[],
        lookup_entity=None,
    )
    entity = EntityDefinition.model_construct(
        code="ITEM",
        fields=[field],
        options=EntityOptions(),
    )
    config = load_platform_config()
    with pytest.raises(MetadataValidationError, match="requires currency_code"):
        build_grid_metadata(entity, config)
