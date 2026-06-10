from emcap.entity.models import EntityDefinition
from emcap.module.models import ModuleDefinition


def entity_permissions(entity: EntityDefinition) -> list[str]:
    code = entity.code.lower()
    return [
        f"{code}.read",
        f"{code}.create",
        f"{code}.update",
        f"{code}.delete",
    ]


def module_permissions(modules: list[ModuleDefinition]) -> list[str]:
    permissions: list[str] = []
    for module in modules:
        permissions.extend(module.permissions)
        for entity in module.entities:
            permissions.extend(entity_permissions(entity))
    return sorted(set(permissions))
