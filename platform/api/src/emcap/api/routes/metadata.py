from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_optional_user
from emcap.auth.models import CurrentUser
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.metadata.builder import build_form_metadata, build_grid_metadata
from emcap.metadata.layout_merge import merge_form_metadata_dict, merge_grid_metadata_dict
from emcap.metadata.security import filter_form_metadata_dict, filter_grid_metadata_dict
from emcap.admin.layout_service import load_layout_override

router = APIRouter(prefix="/metadata", tags=["metadata"])


def _registry(request: Request) -> EntityRegistry:
    return cast(EntityRegistry, request.app.state.entity_registry)


def _field_overrides(request: Request) -> dict[str, list[str]]:
    return cast(dict[str, list[str]], getattr(request.app.state, "field_overrides", {}))


def _open_session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


def _merged_form_payload(request: Request, entity_code: str) -> dict[str, Any]:
    registry = _registry(request)
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        entity = registry.get(entity_code)
        payload = build_form_metadata(entity).model_dump(mode="json")
        override = load_layout_override(session, tenant_id=tenant_id, entity_code=entity_code)
        if override and override.get("form"):
            payload = merge_form_metadata_dict(payload, override["form"])
        return payload
    finally:
        session.close()


def _merged_grid_payload(request: Request, entity_code: str) -> dict[str, Any]:
    registry = _registry(request)
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        entity = registry.get(entity_code)
        config = request.app.state.platform_config
        payload = build_grid_metadata(entity, config).model_dump(mode="json")
        override = load_layout_override(session, tenant_id=tenant_id, entity_code=entity_code)
        if override and override.get("grid"):
            payload = merge_grid_metadata_dict(payload, override["grid"])
        return payload
    finally:
        session.close()


@router.get("/forms/{entity_code}")
def get_form_metadata(
    entity_code: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        payload = _merged_form_payload(request, entity_code)
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
        payload = _merged_grid_payload(request, entity_code)
        return filter_grid_metadata_dict(payload, entity, user, _field_overrides(request))
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
