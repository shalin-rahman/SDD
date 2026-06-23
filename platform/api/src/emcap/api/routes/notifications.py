from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.admin.organization_profile_service import get_organization_profile
from emcap.admin.templates_service import AdminValidationError as TemplateValidationError
from emcap.admin.templates_service import get_template_by_code
from emcap.auth.dependencies import get_tenant_id
from emcap.notifications.hub import NotificationHub
from emcap.notifications.template_render import render_notification_template

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SendNotificationRequest(BaseModel):
    channel: str
    recipient: str
    subject: str
    body: str


class SendTemplateNotificationRequest(BaseModel):
    template_code: str
    recipient: str
    context: dict[str, str] = {}


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


def _channel_enabled(request: Request, channel: str) -> bool:
    channels = request.app.state.platform_config.notifications
    mapping = {
        "email": channels.email,
        "sms": channels.sms,
        "push": channels.push,
        "whatsapp": channels.whatsapp,
    }
    return bool(mapping.get(channel, False))


@router.post("/send")
def send_notification(
    payload: SendNotificationRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    if not request.app.state.platform_config.modules.notifications.enabled:
        raise HTTPException(status_code=403, detail="Notifications disabled")
    if not _channel_enabled(request, payload.channel):
        raise HTTPException(status_code=403, detail=f"Channel disabled: {payload.channel}")

    session = _session(request)
    try:
        return NotificationHub(session, tenant_id=tenant_id).send(
            payload.channel, payload.recipient, payload.subject, payload.body
        )
    finally:
        session.close()


@router.post("/send-template")
def send_template_notification(
    payload: SendTemplateNotificationRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    if not request.app.state.platform_config.modules.notifications.enabled:
        raise HTTPException(status_code=403, detail="Notifications disabled")

    session = _session(request)
    try:
        template = get_template_by_code(session, payload.template_code, tenant_id=tenant_id)
        channel = str(template["channel"])
        if not _channel_enabled(request, channel):
            raise HTTPException(status_code=403, detail=f"Channel disabled: {channel}")

        config = request.app.state.platform_config
        profile = get_organization_profile(session, config)["profile"]
        subject, body = render_notification_template(
            subject=str(template["subject"]),
            body=str(template["body"]),
            channel=channel,
            profile=profile,
            context=payload.context,
        )
        return NotificationHub(session, tenant_id=tenant_id).send(
            channel, payload.recipient, subject, body
        )
    except TemplateValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("")
def list_notifications(
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        return {"notifications": NotificationHub(session, tenant_id=tenant_id).list_sent()}
    finally:
        session.close()
