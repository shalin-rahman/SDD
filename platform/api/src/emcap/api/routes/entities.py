from collections.abc import Generator
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_optional_user, get_tenant_id
from emcap.auth.models import CurrentUser
from emcap.auth.security import apply_field_security
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.persistence.repository import AuditRepository, EntityRepository, EntityRepositoryError

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


def _secure_records(
    entity: object,
    records: list[dict[str, Any]],
    user: CurrentUser | None,
) -> list[dict[str, Any]]:
    from emcap.entity.models import EntityDefinition

    if not isinstance(entity, EntityDefinition):
        return records
    return [apply_field_security(entity, record, user) for record in records]


@router.get("")
def list_entity_codes(registry: EntityRegistry = Depends(_registry)) -> dict[str, list[str]]:
    return {"entities": registry.list_codes()}


@router.get("/{entity_code}/records")
def list_records(
    entity_code: str,
    q: str | None = Query(default=None),
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id)
        records = repo.search_records(entity, q) if q else repo.list_records(entity)
        return {"entity": entity.code, "records": _secure_records(entity, records, user)}
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{entity_code}/records/{record_id}")
def get_record(
    entity_code: str,
    record_id: str,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
    user: Annotated[CurrentUser | None, Depends(get_optional_user)] = None,
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id)
        record = repo.get_record(entity, record_id)
        return apply_field_security(entity, record, user)
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
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id)
        record = repo.create_record(entity, payload)
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
) -> dict[str, Any]:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id)
        record = repo.update_record(entity, record_id, payload)
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
    except EntityRepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{entity_code}/records/{record_id}", status_code=204)
def delete_record(
    entity_code: str,
    record_id: str,
    request: Request,
    registry: EntityRegistry = Depends(_registry),
    session: Session = Depends(_session),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> None:
    try:
        entity = registry.get(entity_code)
        repo = EntityRepository(session, tenant_id=tenant_id)
        existing = repo.get_record(entity, record_id)
        repo.delete_record(entity, record_id)
        if entity.options.audit_enabled and request.app.state.platform_config.audit.enabled:
            AuditRepository(session, tenant_id=tenant_id).log(
                entity_code=entity.code,
                record_id=record_id,
                action="delete",
                payload=existing,
            )
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
