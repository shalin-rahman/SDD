from collections.abc import Callable
from typing import Annotated, Any, cast
import base64

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from emcap.admin.access import require_permission
from emcap.admin.layout_service import (
    LayoutValidationError,
    build_effective_metadata,
    delete_layout_override,
    get_layout_override,
    put_layout_override,
)
from emcap.admin.ops_service import OpsValidationError, get_tenant_isolation_state, update_tenant_isolation_mode
from emcap.entity.registry import EntityRegistryError
from emcap.admin.integrations_service import AdminValidationError as IntegrationsValidationError
from emcap.admin.integrations_service import (
    get_integrations,
    test_rest_integration,
    update_integrations,
)
from emcap.admin.roles_service import AdminValidationError as RoleValidationError
from emcap.admin.roles_service import create_role, get_role, list_roles, update_role
from emcap.admin.security_service import (
    SecurityValidationError,
    get_abac_policies,
    list_security_policies,
    load_abac_policies,
    load_field_overrides,
    update_abac_policies,
    update_field_access,
)
from emcap.admin.report_schedule_service import (
    ReportScheduleValidationError,
    list_report_schedules,
    put_report_schedule,
)
from emcap.admin.settings_service import AdminValidationError as SettingsValidationError
from emcap.admin.settings_service import get_settings, list_admin_audit, update_settings
from emcap.admin.organization_profile_service import (
    AdminValidationError as OrgProfileValidationError,
    get_organization_profile,
    update_organization_profile,
    upload_organization_logo,
)
from emcap.admin.templates_service import AdminValidationError as TemplateValidationError
from emcap.admin.templates_service import (
    create_template,
    delete_template,
    list_templates,
    update_template,
)
from emcap.admin.users_service import AdminValidationError as UserValidationError
from emcap.admin.users_service import (
    create_user,
    deactivate_user,
    get_user,
    list_users,
    update_user,
)
from emcap.auth.dependencies import require_user
from emcap.auth.models import CurrentUser
from emcap.config.models import TenantStrategyMode
from emcap.persistence.database import AdminAuditRow
from emcap.tenancy.strategies import get_tenant_strategy

router = APIRouter(prefix="/admin", tags=["admin"])


def _open_session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


def _actor(user: CurrentUser) -> str:
    return str(user.attributes.get("username") or user.user_id)


class UserCreateRequest(BaseModel):
    username: str
    password: str
    tenant_id: str = "default"
    role_codes: list[str] = Field(default_factory=list)
    attributes: dict[str, Any] = Field(default_factory=dict)


class UserUpdateRequest(BaseModel):
    tenant_id: str | None = None
    active: bool | None = None
    attributes: dict[str, Any] | None = None
    role_codes: list[str] | None = None
    password: str | None = None


class RoleCreateRequest(BaseModel):
    code: str
    name: str
    permissions: list[str]


class RoleUpdateRequest(BaseModel):
    name: str | None = None
    permissions: list[str] | None = None


class SettingsUpdateRequest(BaseModel):
    settings: dict[str, Any]


class OrganizationProfileUpdateRequest(BaseModel):
    profile: dict[str, Any]


class OrganizationLogoUploadRequest(BaseModel):
    filename: str
    content_base64: str


class IntegrationsUpdateRequest(BaseModel):
    integrations: dict[str, Any]


class TemplateCreateRequest(BaseModel):
    code: str
    channel: str = "email"
    subject: str = ""
    body: str = ""


class TemplateUpdateRequest(BaseModel):
    channel: str | None = None
    subject: str | None = None
    body: str | None = None


@router.get("/users")
def admin_list_users(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.users.read")
    session = _open_session(request)
    try:
        return {"users": list_users(session)}
    finally:
        session.close()


@router.get("/users/{user_id}")
def admin_get_user(
    user_id: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.users.read")
    session = _open_session(request)
    try:
        return get_user(session, user_id)
    except UserValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/users", status_code=201)
def admin_create_user(
    payload: UserCreateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.users.write")
    session = _open_session(request)
    try:
        created = create_user(
            session,
            username=payload.username,
            password=payload.password,
            tenant_id=payload.tenant_id,
            role_codes=payload.role_codes,
            attributes=payload.attributes,
        )
        session.add(
            AdminAuditRow(
                actor=_actor(user),
                action="user.create",
                target=created["id"],
                payload={"username": created["username"]},
            )
        )
        session.commit()
        return created
    except UserValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.put("/users/{user_id}")
def admin_update_user(
    user_id: str,
    payload: UserUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.users.write")
    session = _open_session(request)
    try:
        updated = update_user(
            session,
            user_id,
            tenant_id=payload.tenant_id,
            active=payload.active,
            attributes=payload.attributes,
            role_codes=payload.role_codes,
            password=payload.password,
        )
        session.add(
            AdminAuditRow(
                actor=_actor(user),
                action="user.update",
                target=user_id,
                payload={"active": updated["active"]},
            )
        )
        session.commit()
        return updated
    except UserValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.patch("/users/{user_id}/deactivate")
def admin_deactivate_user(
    user_id: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.users.write")
    session = _open_session(request)
    try:
        updated = deactivate_user(session, user_id)
        session.add(
            AdminAuditRow(
                actor=_actor(user),
                action="user.deactivate",
                target=user_id,
                payload={},
            )
        )
        session.commit()
        return updated
    except UserValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/roles")
def admin_list_roles(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.roles.read")
    session = _open_session(request)
    try:
        return {"roles": list_roles(session)}
    finally:
        session.close()


@router.get("/roles/{role_id}")
def admin_get_role(
    role_id: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.roles.read")
    session = _open_session(request)
    try:
        return get_role(session, role_id)
    except RoleValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/roles", status_code=201)
def admin_create_role(
    payload: RoleCreateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.roles.write")
    session = _open_session(request)
    try:
        created = create_role(
            session,
            code=payload.code,
            name=payload.name,
            permissions=payload.permissions,
        )
        session.add(
            AdminAuditRow(
                actor=_actor(user),
                action="role.create",
                target=created["id"],
                payload={"code": created["code"]},
            )
        )
        session.commit()
        return created
    except RoleValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.put("/roles/{role_id}")
def admin_update_role(
    role_id: str,
    payload: RoleUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.roles.write")
    session = _open_session(request)
    try:
        updated = update_role(
            session,
            role_id,
            name=payload.name,
            permissions=payload.permissions,
        )
        session.add(
            AdminAuditRow(
                actor=_actor(user),
                action="role.update",
                target=role_id,
                payload={"code": updated["code"]},
            )
        )
        session.commit()
        return updated
    except RoleValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/settings")
def admin_get_settings(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.read")
    session = _open_session(request)
    try:
        return get_settings(session, request.app.state.platform_config)
    finally:
        session.close()


@router.put("/settings")
def admin_update_settings(
    payload: SettingsUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    try:
        return update_settings(
            session,
            request.app.state.platform_config,
            payload.settings,
            actor=_actor(user),
        )
    except SettingsValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/organization-profile")
def admin_get_organization_profile(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.read")
    session = _open_session(request)
    try:
        return get_organization_profile(session, request.app.state.platform_config)
    finally:
        session.close()


@router.put("/organization-profile")
def admin_update_organization_profile(
    payload: OrganizationProfileUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    try:
        return update_organization_profile(
            session,
            request.app.state.platform_config,
            payload.profile,
            actor=_actor(user),
        )
    except OrgProfileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/organization-profile/logo")
def admin_upload_organization_logo(
    payload: OrganizationLogoUploadRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        try:
            content = base64.b64decode(payload.content_base64, validate=True)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid base64 logo content") from exc
        return upload_organization_logo(
            session,
            request.app.state.platform_config,
            filename=payload.filename.strip(),
            content=content,
            actor=_actor(user),
            tenant_id=tenant_id,
        )
    except OrgProfileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/integrations")
def admin_get_integrations(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.read")
    session = _open_session(request)
    try:
        return get_integrations(session, request.app.state.platform_config)
    finally:
        session.close()


@router.put("/integrations")
def admin_update_integrations(
    payload: IntegrationsUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    try:
        return update_integrations(
            session,
            request.app.state.platform_config,
            payload.integrations,
            actor=_actor(user),
        )
    except IntegrationsValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/integrations/test-rest")
def admin_test_rest_integration(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return test_rest_integration(
            session,
            request.app.state.platform_config,
            tenant_id=tenant_id,
        )
    except IntegrationsValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/security/policies")
def admin_list_security_policies(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.security.read")
    registry = request.app.state.entity_registry
    field_overrides = getattr(request.app.state, "field_overrides", {})
    return list_security_policies(registry, field_overrides)


class AbacPoliciesRequest(BaseModel):
    policies: list[dict[str, Any]] = Field(default_factory=list)


@router.get("/security/abac")
def admin_get_abac_policies(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.security.read")
    session = _open_session(request)
    try:
        return get_abac_policies(session, request.app.state.platform_config)
    finally:
        session.close()


@router.put("/security/abac")
def admin_put_abac_policies(
    payload: AbacPoliciesRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.security.write")
    session = _open_session(request)
    try:
        result = update_abac_policies(
            session,
            request.app.state.platform_config,
            payload.policies,
            actor=user.user_id,
        )
        request.app.state.abac_policies = load_abac_policies(
            session,
            request.app.state.platform_config,
        )
        return result
    except SecurityValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


class FieldAccessRequest(BaseModel):
    entity_code: str
    field_name: str
    read_roles: list[str] = Field(default_factory=list)


class LayoutOverrideRequest(BaseModel):
    form: dict[str, Any] | None = None
    grid: dict[str, Any] | None = None


class TenantIsolationRequest(BaseModel):
    mode: TenantStrategyMode
    confirmation_token: str


@router.get("/metadata/layouts/{entity_code}")
def admin_get_layout_metadata(
    entity_code: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.metadata.read")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return build_effective_metadata(
            request.app.state.entity_registry,
            request.app.state.platform_config,
            session=session,
            tenant_id=tenant_id,
            entity_code=entity_code,
        )
    except (LayoutValidationError, EntityRegistryError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/metadata/layouts/{entity_code}/override")
def admin_get_layout_override(
    entity_code: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.metadata.read")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return get_layout_override(session, tenant_id=tenant_id, entity_code=entity_code)
    except LayoutValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.put("/metadata/layouts/{entity_code}/override")
def admin_put_layout_override(
    entity_code: str,
    payload: LayoutOverrideRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.metadata.write")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        body = payload.model_dump(exclude_none=True)
        return put_layout_override(
            session,
            request.app.state.entity_registry,
            tenant_id=tenant_id,
            entity_code=entity_code,
            payload=body,
            actor=_actor(user),
        )
    except LayoutValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.delete("/metadata/layouts/{entity_code}/override", status_code=200)
def admin_delete_layout_override(
    entity_code: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.metadata.write")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return delete_layout_override(
            session,
            tenant_id=tenant_id,
            entity_code=entity_code,
            actor=_actor(user),
        )
    except LayoutValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/ops/tenant-isolation")
def admin_get_tenant_isolation(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.ops")
    session = _open_session(request)
    try:
        return get_tenant_isolation_state(
            session,
            configured_mode=request.app.state.platform_config.tenant_strategy.mode,
        )
    finally:
        session.close()


@router.put("/ops/tenant-isolation")
def admin_put_tenant_isolation(
    payload: TenantIsolationRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.ops")
    session = _open_session(request)
    try:
        result = update_tenant_isolation_mode(
            session,
            mode=payload.mode,
            confirmation_token_value=payload.confirmation_token,
            actor=_actor(user),
        )
        request.app.state.tenant_strategy = get_tenant_strategy(payload.mode)
        return result
    except OpsValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.put("/security/field-access")
def admin_put_field_access(
    payload: FieldAccessRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.security.write")
    session = _open_session(request)
    try:
        result = update_field_access(
            session,
            request.app.state.entity_registry,
            entity_code=payload.entity_code,
            field_name=payload.field_name,
            read_roles=payload.read_roles,
            actor=user.user_id,
        )
        request.app.state.field_overrides = load_field_overrides(session)
        return result
    except SecurityValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/templates")
def admin_list_templates(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.templates.read")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return {"templates": list_templates(session, tenant_id=tenant_id)}
    finally:
        session.close()


@router.post("/templates", status_code=201)
def admin_create_template(
    payload: TemplateCreateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.templates.write")
    session = _open_session(request)
    tenant_id = getattr(request.state, "tenant_id", "default")
    try:
        return create_template(
            session,
            code=payload.code,
            channel=payload.channel,
            subject=payload.subject,
            body=payload.body,
            tenant_id=tenant_id,
            actor=_actor(user),
        )
    except TemplateValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.put("/templates/{template_id}")
def admin_update_template(
    template_id: str,
    payload: TemplateUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.templates.write")
    session = _open_session(request)
    try:
        return update_template(
            session,
            template_id,
            subject=payload.subject,
            body=payload.body,
            channel=payload.channel,
            actor=_actor(user),
        )
    except TemplateValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.delete("/templates/{template_id}", status_code=204)
def admin_delete_template(
    template_id: str,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> None:
    require_permission(user, "admin.templates.write")
    session = _open_session(request)
    try:
        delete_template(session, template_id, actor=_actor(user))
    except TemplateValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()


@router.get("/audit")
def admin_list_audit(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.read")
    session = _open_session(request)
    try:
        return {"audit": list_admin_audit(session)}
    finally:
        session.close()


class ReportScheduleUpdateRequest(BaseModel):
    schedule_cron: str


@router.get("/reports/schedules")
def admin_list_report_schedules(
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.read")
    session = _open_session(request)
    try:
        definitions = request.app.state.report_definitions
        return {"schedules": list_report_schedules(session, definitions)}
    finally:
        session.close()


@router.put("/reports/schedules/{report_code}")
def admin_update_report_schedule(
    report_code: str,
    payload: ReportScheduleUpdateRequest,
    request: Request,
    user: Annotated[CurrentUser, Depends(require_user)],
) -> dict[str, Any]:
    require_permission(user, "admin.settings.write")
    session = _open_session(request)
    try:
        definitions = request.app.state.report_definitions
        return put_report_schedule(
            session,
            report_code=report_code,
            schedule_cron=payload.schedule_cron,
            actor=_actor(user),
            definitions=definitions,
        )
    except ReportScheduleValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()
