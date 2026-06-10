import json
from collections.abc import Callable, Iterator
from typing import Annotated, cast

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

from emcap.auth.dependencies import get_tenant_id
from emcap.entity.registry import EntityRegistry
from emcap.persistence.repository import EntityRepository

router = APIRouter(tags=["realtime"])


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


def _entity_event_stream(
    request: Request,
    entity_code: str,
    tenant_id: str,
) -> Iterator[str]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    entity = registry.get(entity_code)
    session = _session(request)
    try:
        repo = EntityRepository(session, tenant_id=tenant_id)
        count = len(repo.list_records(entity))
        payload = {"entity_code": entity_code, "record_count": count, "event": "heartbeat"}
        yield f"data: {json.dumps(payload)}\n\n"
    finally:
        session.close()


@router.get("/entities/{entity_code}/records/stream")
def stream_entity_records(
    entity_code: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> StreamingResponse:
    generator = _entity_event_stream(request, entity_code, tenant_id)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
