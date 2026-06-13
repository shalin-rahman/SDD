from emcap.entity.models import EntityDefinition
from emcap.metadata.validation import MetadataValidationError, validate_entity_for_metadata


class EntityRegistryError(Exception):
    pass


class EntityRegistry:
    def __init__(self) -> None:
        self._entities: dict[str, EntityDefinition] = {}

    def register(self, definition: EntityDefinition) -> None:
        code = definition.code
        if code in self._entities:
            msg = f"Entity already registered: {code}"
            raise EntityRegistryError(msg)
        self._entities[code] = definition

    def register_many(self, definitions: list[EntityDefinition]) -> None:
        for definition in definitions:
            self.register(definition)

    def get(self, code: str) -> EntityDefinition:
        normalized = code.strip().upper()
        if normalized not in self._entities:
            msg = f"Unknown entity: {code}"
            raise EntityRegistryError(msg)
        return self._entities[normalized]

    def list_codes(self) -> list[str]:
        return sorted(self._entities.keys())

    def all(self) -> list[EntityDefinition]:
        return [self._entities[code] for code in self.list_codes()]

    def validate(self) -> None:
        if not self._entities:
            msg = "No entities registered"
            raise EntityRegistryError(msg)

        entity_codes = set(self._entities.keys())
        field_names: set[str] = set()
        for definition in self._entities.values():
            field_names.clear()
            for field in definition.fields:
                if field.name in field_names:
                    msg = f"Duplicate field '{field.name}' on entity {definition.code}"
                    raise EntityRegistryError(msg)
                field_names.add(field.name)
            try:
                validate_entity_for_metadata(definition, entity_codes)
            except MetadataValidationError as exc:
                raise EntityRegistryError(str(exc)) from exc
