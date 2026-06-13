import importlib.util
import os
from collections.abc import Callable
from pathlib import Path
from typing import Any

from emcap.entity.registry import EntityRegistry
from emcap.module.models import ModuleDefinition

DEFAULT_MODULES_ROOT = Path(__file__).resolve().parents[5] / "modules"


def get_modules_root() -> Path:
    override = os.environ.get("EMCAP_MODULES_PATH")
    if override:
        return Path(override)
    return DEFAULT_MODULES_ROOT


class ModuleLoaderError(Exception):
    pass


def discover_module_files(root: Path | None = None) -> list[Path]:
    base = root or get_modules_root()
    if not base.is_dir():
        return []
    return sorted(base.glob("*/module.py"))


def load_module_definition(path: Path) -> ModuleDefinition:
    spec = importlib.util.spec_from_file_location(path.parent.name, path)
    if spec is None or spec.loader is None:
        msg = f"Cannot load module file: {path}"
        raise ModuleLoaderError(msg)

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    definition = getattr(module, "MODULE", None)
    if not isinstance(definition, ModuleDefinition):
        msg = f"Module file must export MODULE: ModuleDefinition — {path}"
        raise ModuleLoaderError(msg)
    return definition


def load_modules(
    registry: EntityRegistry,
    root: Path | None = None,
) -> list[ModuleDefinition]:
    loaded: list[ModuleDefinition] = []
    for path in discover_module_files(root):
        definition = load_module_definition(path)
        registry.register_many(definition.entities)
        loaded.append(definition)
    return loaded


EntityValidator = Callable[..., Any]


def load_entity_validators(root: Path | None = None) -> dict[str, EntityValidator]:
    """Collect optional ``ENTITY_VALIDATORS`` exports from business module files."""
    validators: dict[str, EntityValidator] = {}
    for path in discover_module_files(root):
        spec = importlib.util.spec_from_file_location(path.parent.name, path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        exported = getattr(module, "ENTITY_VALIDATORS", None)
        if isinstance(exported, dict):
            validators.update(exported)
    return validators
