from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.payments.gateway import PaymentGateway

router = APIRouter(prefix="/payments", tags=["payments"])


class PaymentIntentRequest(BaseModel):
    amount: str
    currency: str = "USD"


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.post("/intents")
def create_payment_intent(
    payload: PaymentIntentRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    config = request.app.state.platform_config
    if not config.modules.payments.enabled or not config.payments.enabled:
        raise HTTPException(status_code=403, detail="Payments disabled")

    session = _session(request)
    try:
        return PaymentGateway(session, tenant_id=tenant_id).create_intent(
            payload.amount, payload.currency
        )
    finally:
        session.close()
