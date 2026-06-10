from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request

from emcap.auth.jwt import decode_access_token
from emcap.auth.models import CurrentUser


def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    return CurrentUser(
        user_id=str(payload["sub"]),
        tenant_id=str(payload["tenant_id"]),
        permissions=list(payload.get("permissions", [])),
        attributes=dict(payload.get("attributes", {})),
        mfa_verified=bool(payload.get("mfa_verified", False)),
    )


def require_user(user: Annotated[CurrentUser | None, Depends(get_optional_user)]) -> CurrentUser:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def get_tenant_id(request: Request) -> str:
    return str(getattr(request.state, "tenant_id", "default"))
