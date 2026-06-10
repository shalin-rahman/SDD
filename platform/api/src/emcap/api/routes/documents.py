from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


class UploadDocumentRequest(BaseModel):
    entity_code: str
    record_id: str
    filename: str
    content: str


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.post("/upload")
def upload_document(
    payload: UploadDocumentRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        service = DocumentService(session, tenant_id=tenant_id)
        return service.upload(
            entity_code=payload.entity_code,
            record_id=payload.record_id,
            filename=payload.filename,
            content=payload.content.encode("utf-8"),
        )
    finally:
        session.close()


@router.get("")
def list_documents(
    entity_code: Annotated[str, Query()],
    record_id: Annotated[str, Query()],
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        documents = DocumentService(session, tenant_id=tenant_id).list_for_record(
            entity_code, record_id
        )
        return {"entity_code": entity_code, "record_id": record_id, "documents": documents}
    finally:
        session.close()


@router.get("/{document_id}")
def get_document(
    document_id: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return DocumentService(session, tenant_id=tenant_id).get(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()
