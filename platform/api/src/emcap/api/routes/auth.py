from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.abac import DEFAULT_POLICIES, evaluate_abac
from emcap.auth.dependencies import get_optional_user, require_user
from emcap.auth.jwt import create_access_token
from emcap.auth.models import CurrentUser
from emcap.auth.providers.base import AuthCredentials
from emcap.auth.providers.registry import AuthProviderRegistry
from emcap.auth.rbac import assign_role, list_roles
from emcap.auth.service import (
    AuthServiceError,
    generate_mfa_secret,
    list_user_permissions,
    user_to_attributes,
    verify_totp,
)
from emcap.persistence.database import UserRow

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class OAuthRequest(BaseModel):
    grant_type: str = "client_credentials"
    client_id: str
    client_secret: str


class MfaVerifyRequest(BaseModel):
    code: str


class AssignRoleRequest(BaseModel):
    user_id: str
    role_code: str


def _open_session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


def _registry(request: Request) -> AuthProviderRegistry:
    return cast(AuthProviderRegistry, request.app.state.auth_registry)


@router.get("/providers")
def list_providers(request: Request) -> dict[str, list[str]]:
    auth = request.app.state.platform_config.authentication
    enabled = {
        "username_password": auth.username_password,
        "oauth": auth.oauth,
        "ldap": auth.ldap,
        "sso": auth.sso,
    }
    registry: AuthProviderRegistry = request.app.state.auth_registry
    return {"providers": registry.list_enabled(enabled)}


@router.post("/login")
def login(payload: LoginRequest, request: Request) -> dict[str, Any]:
    if not request.app.state.platform_config.authentication.username_password:
        raise HTTPException(status_code=403, detail="Password auth disabled")

    registry: AuthProviderRegistry = request.app.state.auth_registry
    try:
        result = registry.get("username_password").authenticate(
            AuthCredentials(username=payload.username, password=payload.password)
        )
    except (AuthServiceError, KeyError) as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return result.model_dump()


@router.post("/oauth/token")
def oauth_token(payload: OAuthRequest, request: Request) -> dict[str, Any]:
    if not request.app.state.platform_config.authentication.oauth:
        raise HTTPException(status_code=403, detail="OAuth disabled")

    registry: AuthProviderRegistry = request.app.state.auth_registry
    try:
        result = registry.get("oauth").authenticate(
            AuthCredentials(
                grant_type=payload.grant_type,
                client_id=payload.client_id,
                client_secret=payload.client_secret,
            )
        )
    except (AuthServiceError, KeyError) as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return result.model_dump()


@router.get("/roles")
def get_roles(request: Request) -> dict[str, Any]:
    session = _open_session(request)
    try:
        return {"roles": list_roles(session)}
    finally:
        session.close()


@router.post("/roles/assign")
def post_assign_role(payload: AssignRoleRequest, request: Request) -> dict[str, str]:
    session = _open_session(request)
    try:
        assign_role(session, payload.user_id, payload.role_code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()
    return {"status": "assigned"}


@router.post("/mfa/enroll")
def mfa_enroll(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, str]:
    session = _open_session(request)
    try:
        row = session.query(UserRow).filter_by(id=user.user_id).one_or_none()
        if row is None:
            raise HTTPException(status_code=404, detail="User not found")
        secret = generate_mfa_secret()
        row.mfa_secret = secret
        row.mfa_enabled = True
        session.commit()
        return {"secret": secret}
    finally:
        session.close()


@router.post("/mfa/verify")
def mfa_verify(
    payload: MfaVerifyRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, str]:
    session = _open_session(request)
    try:
        row = session.query(UserRow).filter_by(id=user.user_id).one_or_none()
        if row is None or not row.mfa_secret:
            raise HTTPException(status_code=400, detail="MFA not enrolled")
        if not verify_totp(row.mfa_secret, payload.code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

        permissions = list_user_permissions(session, row)
        token = create_access_token(
            user_id=row.id,
            tenant_id=row.tenant_id,
            permissions=permissions,
            attributes={**user_to_attributes(row), "mfa_verified": True},
        )
        return {"access_token": token, "token_type": "bearer"}
    finally:
        session.close()


@router.get("/me")
def auth_me(user: Annotated[CurrentUser | None, Depends(get_optional_user)]) -> dict[str, Any]:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()


@router.post("/check")
def auth_check(
    payload: dict[str, str],
    user: Annotated[CurrentUser | None, Depends(get_optional_user)],
) -> dict[str, bool]:
    permission = payload.get("permission", "")
    resource = {"tenant_id": payload.get("tenant_id", "default")}
    user_attrs = {"tenant_id": user.tenant_id if user else ""}
    allowed = evaluate_abac(
        DEFAULT_POLICIES,
        permission=permission,
        user_attrs=user_attrs,
        resource_attrs=resource,
    )
    return {"allowed": allowed}
