from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request

from emcap.auth.dependencies import get_optional_user
from emcap.auth.models import CurrentUser
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.metadata.builder import build_form_metadata, build_grid_metadata
from emcap.metadata.security import filter_form_metadata_dict, filter_grid_metadata_dict

router = APIRouter(prefix="/metadata", tags=["metadata"])


def _registry(request: Request) -> EntityRegistry:
    return cast(EntityRegistry, request.app.state.entity_registry)


def _field_overrides(request: Request) -> dict[str, list[str]]:
    return cast(dict[str, list[str]], getattr(request.app.state, "field_overrides", {}))


@router.get("/forms/{entity_code}")
def get_form_metadata(
    entity_code: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        metadata = build_form_metadata(entity)
        payload = metadata.model_dump(mode="json")
        return filter_form_metadata_dict(payload, entity, user, _field_overrides(request))
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/grids/{entity_code}")
def get_grid_metadata(
    entity_code: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        config = request.app.state.platform_config
        metadata = build_grid_metadata(entity, config)
        payload = metadata.model_dump(mode="json")
        return filter_grid_metadata_dict(payload, entity, user, _field_overrides(request))
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
