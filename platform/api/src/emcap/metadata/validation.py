"""Field-type contract validation for metadata builder and registry startup."""

from emcap.entity.models import EntityDefinition, FieldDefinition, FieldType


class MetadataValidationError(Exception):
    pass


def validate_field_for_metadata(
    field: FieldDefinition,
    *,
    entity_code: str,
    entity_codes: set[str] | None = None,
) -> None:
    """Validate a field definition can be emitted as form/grid metadata."""
    if field.field_type == FieldType.LOOKUP:
        if not field.lookup_entity:
            msg = f"Lookup field '{field.name}' on {entity_code} requires lookup_entity"
            raise MetadataValidationError(msg)
        if entity_codes is not None:
            if field.lookup_entity == entity_code:
                msg = (
                    f"Lookup field '{field.name}' on {entity_code} "
                    f"cannot reference the same entity"
                )
                raise MetadataValidationError(msg)
            if field.lookup_entity not in entity_codes:
                msg = (
                    f"Lookup field '{field.name}' on {entity_code} "
                    f"references unknown entity: {field.lookup_entity}"
                )
                raise MetadataValidationError(msg)

    if field.field_type == FieldType.CURRENCY:
        if not field.currency_code:
            msg = f"Currency field '{field.name}' on {entity_code} requires currency_code"
            raise MetadataValidationError(msg)

    if field.field_type == FieldType.ENUM and not field.options:
        msg = f"Enum field '{field.name}' on {entity_code} requires non-empty options"
        raise MetadataValidationError(msg)


def validate_entity_for_metadata(
    entity: EntityDefinition,
    entity_codes: set[str] | None = None,
) -> None:
    """Validate all business fields on an entity for metadata emission."""
    for field in entity.fields:
        validate_field_for_metadata(
            field,
            entity_code=entity.code,
            entity_codes=entity_codes,
        )
