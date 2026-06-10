from collections.abc import Callable
from datetime import UTC, datetime
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.sync.service import SyncService

router = APIRouter(prefix="/sync", tags=["sync"])


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.get("/{entity_code}/snapshot")
def sync_snapshot(
    entity_code: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    session = _session(request)
    try:
        return SyncService(session, registry, tenant_id=tenant_id).snapshot(
            entity_code,
            request.app.state.platform_config,
        )
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/{entity_code}/changes")
def sync_changes(
    entity_code: str,
    request: Request,
    since: Annotated[str, Query(description="ISO-8601 timestamp")],
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    try:
        since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid since timestamp") from exc
    if since_dt.tzinfo is None:
        since_dt = since_dt.replace(tzinfo=UTC)

    session = _session(request)
    try:
        return SyncService(session, registry, tenant_id=tenant_id).changes(entity_code, since_dt)
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()
