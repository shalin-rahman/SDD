from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.integrations.adapters import KafkaAdapter, RestAdapter, SftpAdapter, SoapAdapter

router = APIRouter(prefix="/integrations", tags=["integrations"])


class RestDispatchRequest(BaseModel):
    url: str
    payload: dict[str, Any] = {}


class KafkaPublishRequest(BaseModel):
    topic: str
    payload: dict[str, Any] = {}


class SoapInvokeRequest(BaseModel):
    endpoint: str
    action: str
    payload: dict[str, Any] = {}


class SftpUploadRequest(BaseModel):
    host: str
    path: str
    payload: dict[str, Any] = {}


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.post("/rest/dispatch")
def dispatch_rest(
    payload: RestDispatchRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return RestAdapter(session, tenant_id=tenant_id).dispatch(payload.url, payload.payload)
    finally:
        session.close()


@router.post("/kafka/publish")
def publish_kafka(
    payload: KafkaPublishRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return KafkaAdapter(session, tenant_id=tenant_id).publish(payload.topic, payload.payload)
    finally:
        session.close()


@router.post("/soap/invoke")
def invoke_soap(
    payload: SoapInvokeRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return SoapAdapter(session, tenant_id=tenant_id).invoke(
            payload.endpoint, payload.action, payload.payload
        )
    finally:
        session.close()


@router.post("/sftp/upload")
def upload_sftp(
    payload: SftpUploadRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return SftpAdapter(session, tenant_id=tenant_id).upload(
            payload.host, payload.path, payload.payload
        )
    finally:
        session.close()
