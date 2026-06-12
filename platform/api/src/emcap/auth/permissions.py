from emcap.entity.models import EntityDefinition
from emcap.module.models import ModuleDefinition

PLATFORM_ADMIN_PERMISSIONS: list[str] = [
    "admin.*",
    "admin.users.read",
    "admin.users.write",
    "admin.roles.read",
    "admin.roles.write",
    "admin.settings.read",
    "admin.settings.write",
    "admin.templates.read",
    "admin.templates.write",
    "admin.security.read",
    "admin.security.write",
    "*.*",
]


def entity_permissions(entity: EntityDefinition) -> list[str]:
    code = entity.code.lower()
    return [
        f"{code}.read",
        f"{code}.create",
        f"{code}.update",
        f"{code}.delete",
    ]


def module_permissions(modules: list[ModuleDefinition]) -> list[str]:
    permissions: list[str] = list(PLATFORM_ADMIN_PERMISSIONS)
    for module in modules:
        permissions.extend(module.permissions)
        for entity in module.entities:
            permissions.extend(entity_permissions(entity))
    return sorted(set(permissions))
