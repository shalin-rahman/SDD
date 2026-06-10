from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request

from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.metadata.builder import build_form_metadata, build_grid_metadata

router = APIRouter(prefix="/metadata", tags=["metadata"])


def _registry(request: Request) -> EntityRegistry:
    return cast(EntityRegistry, request.app.state.entity_registry)


@router.get("/forms/{entity_code}")
def get_form_metadata(
    entity_code: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        metadata = build_form_metadata(entity)
        return metadata.model_dump(mode="json")
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/grids/{entity_code}")
def get_grid_metadata(
    entity_code: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        config = request.app.state.platform_config
        metadata = build_grid_metadata(entity, config)
        return metadata.model_dump(mode="json")
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
