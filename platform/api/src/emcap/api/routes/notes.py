from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_optional_user, get_tenant_id
from emcap.auth.models import CurrentUser
from emcap.entity.registry import EntityRegistry
from emcap.notes.service import NotesService

router = APIRouter(tags=["notes"])


class CreateNoteRequest(BaseModel):
    body: str


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.get("/entities/{entity_code}/records/{record_id}/notes")
def list_notes(
    entity_code: str,
    record_id: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    session = _session(request)
    try:
        notes = NotesService(session, registry, tenant_id=tenant_id).list_notes(
            entity_code, record_id
        )
        return {"entity_code": entity_code, "record_id": record_id, "notes": notes}
    finally:
        session.close()


@router.post("/entities/{entity_code}/records/{record_id}/notes", status_code=201)
def create_note(
    entity_code: str,
    record_id: str,
    payload: CreateNoteRequest,
    request: Request,
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    author = user.attributes.get("username", "anonymous") if user else "anonymous"
    session = _session(request)
    try:
        note = NotesService(session, registry, tenant_id=tenant_id).add_note(
            entity_code,
            record_id,
            payload.body,
            author=author,
        )
        return note
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    finally:
        session.close()
