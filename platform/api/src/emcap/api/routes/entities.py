from collections.abc import Generator
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_optional_user, get_tenant_id
from emcap.auth.models import CurrentUser
from emcap.auth.security import apply_field_security
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.persistence.repository import (
    AuditRepository,
    EntityRepository,
    EntityRepositoryError,
    EntityVersionConflictError,
)

router = APIRouter(prefix="/entities", tags=["entities"])


def _session(request: Request) -> Generator[Session, None, None]:
    factory = request.app.state.session_factory
    session = factory()
    try:
        strategy = request.app.state.tenant_strategy
        tenant_id = getattr(request.state, "tenant_id", "default")
        strategy.bind_session(session, tenant_id)
        yield session
    finally:
        session.close()


def _registry(request: Request) -> EntityRegistry:
    return cast(EntityRegistry, request.app.state.entity_registry)


def _entity_validators(request: Request) -> dict[str, object]:
    return cast(dict[str, object], getattr(request.app.state, "entity_validators", {}))


def _run_entity_validator(
    request: Request,
    entity_code: str,
    payload: dict[str, Any],
    *,
    partial: bool = False,
    existing: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> None:
    validators = _entity_validators(request)
    validator = validators.get(entity_code)
    if validator is None:
        return
    try:
        validator(payload, partial=partial, existing=existing, context=context)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _field_overrides(request: Request) -> dict[str, list[str]]:
    return cast(dict[str, list[str]], getattr(request.app.state, "field_overrides", {}))


def _secure_records(
    entity: object,
    records: list[dict[str, Any]],
    user: CurrentUser | None,
    field_overrides: dict[str, list[str]] | None = None,
) -> list[dict[str, Any]]:
    from emcap.entity.models import EntityDefinition

    if not isinstance(entity, EntityDefinition):
        return records
    return [
        apply_field_security(entity, record, user, field_overrides)
        for record in records
    ]


@router.get("")
def list_entity_codes(registry: EntityRegistry = Depends(_registry)) -> dict[str, list[str]]:
    return {"entities": registry.list_codes()}


@router.get("/{entity_code}/records")
def list_records(
    entity_code: str,
    request: Request,
    q: str | None = Query(default=None),
    include_deleted: bool = Query(default=False),
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        if q:
            records = repo.search_records(entity, q, include_deleted=include_deleted)
        else:
            records = repo.list_records(entity, include_deleted=include_deleted)
        overrides = _field_overrides(request)
        return {
            "entity": entity.code,
            "records": _secure_records(entity, records, user, overrides),
        }
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{entity_code}/records/{record_id}")
def get_record(
    entity_code: str,
    record_id: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        record = repo.get_record(entity, record_id)
        return apply_field_security(entity, record, user, _field_overrides(request))
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{entity_code}/records", status_code=201)
def create_record(
    entity_code: str,
    payload: dict[str, Any],
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        _run_entity_validator(request, entity.code, payload)
        created_by = user.user_id if user is not None else None
        record = repo.create_record(entity, payload, created_by=created_by)
        if entity.options.audit_enabled and request.app.state.platform_config.audit.enabled:
            AuditRepository(session, tenant_id=tenant_id).log(
                entity_code=entity.code,
                record_id=record["id"],
                action="create",
                payload=record,
            )
        return record
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{entity_code}/records/{record_id}")
def update_record(
    entity_code: str,
    record_id: str,
    payload: dict[str, Any],
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
    if_match: Annotated[int | None, Header()] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        existing = repo.get_record(entity, record_id)
        _run_entity_validator(
            request,
            entity.code,
            payload,
            partial=True,
            existing=existing,
            context={
                "repo": repo,
                "registry": registry,
                "record_id": record_id,
                "commit": False,
            },
        )
        updated_by = user.user_id if user is not None else None
        record = repo.update_record(
            entity,
            record_id,
            payload,
            updated_by=updated_by,
            expected_version=if_match,
        )
        if entity.options.audit_enabled and request.app.state.platform_config.audit.enabled:
            AuditRepository(session, tenant_id=tenant_id).log(
                entity_code=entity.code,
                record_id=record_id,
                action="update",
                payload=record,
            )
        return record
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except EntityVersionConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{entity_code}/records/{record_id}")
def delete_record(
    entity_code: str,
    record_id: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        record = repo.delete_record(entity, record_id)
        if entity.options.audit_enabled and request.app.state.platform_config.audit.enabled:
            AuditRepository(session, tenant_id=tenant_id).log(
                entity_code=entity.code,
                record_id=record_id,
                action="soft_delete",
                payload=record,
            )
        return record
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{entity_code}/records/{record_id}/restore")
def restore_record(
    entity_code: str,
    record_id: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id, registry=registry)
        record = repo.restore_record(entity, record_id)
        if entity.options.audit_enabled and request.app.state.platform_config.audit.enabled:
            AuditRepository(session, tenant_id=tenant_id).log(
                entity_code=entity.code,
                record_id=record_id,
                action="restore",
                payload=record,
            )
        return record
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{entity_code}/audit")
def list_audit(
    entity_code: str,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        logs = AuditRepository(session, tenant_id=tenant_id).list_for_entity(entity.code)
        return {"entity": entity.code, "audit": logs}
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
