from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.entity.models import EntityDefinition
from emcap.entity.registry import EntityRegistry, EntityRegistryError
from emcap.entity.system_fields import SYSTEM_FIELD_NAMES
from emcap.persistence.database import AuditLogRow, EntityRecordRow


class EntityRepositoryError(Exception):
    pass


class EntityVersionConflictError(EntityRepositoryError):
    pass


class EntityRepository:
    def __init__(
        self,
        session: Session,
        tenant_id: str = "default",
        registry: EntityRegistry | None = None,
    ) -> None:
        self._session = session
        self._tenant_id = tenant_id
        self._registry = registry

    def list_records(
        self,
        entity: EntityDefinition,
        *,
        include_deleted: bool = False,
    ) -> list[dict[str, Any]]:
        query = self._session.query(EntityRecordRow).filter_by(
            entity_code=entity.code,
            tenant_id=self._tenant_id,
        )
        if not include_deleted:
            query = query.filter(EntityRecordRow.deleted_at.is_(None))
        rows = query.order_by(EntityRecordRow.created_at.desc()).all()
        return [self._to_dict(row) for row in rows]

    def get_record(self, entity: EntityDefinition, record_id: str) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id)
        return self._to_dict(row)

    def create_record(
        self,
        entity: EntityDefinition,
        payload: dict[str, Any],
        *,
        created_by: str | None = None,
    ) -> dict[str, Any]:
        data = self._validate_payload(entity, payload)
        row = EntityRecordRow(
            id=str(__import__("uuid").uuid4()),
            entity_code=entity.code,
            tenant_id=self._tenant_id,
            data=data,
            created_by=created_by,
            record_version=1,
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def update_record(
        self,
        entity: EntityDefinition,
        record_id: str,
        payload: dict[str, Any],
        *,
        updated_by: str | None = None,
        expected_version: int | None = None,
    ) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id)
        if expected_version is not None and row.record_version != expected_version:
            msg = f"Version conflict: expected {expected_version}, current {row.record_version}"
            raise EntityVersionConflictError(msg)
        merged = {**row.data, **self._validate_payload(entity, payload, partial=True)}
        row.data = merged
        row.record_version = row.record_version + 1
        row.updated_by = updated_by
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def delete_record(self, entity: EntityDefinition, record_id: str) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id)
        row.deleted_at = datetime.now(UTC)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def restore_record(self, entity: EntityDefinition, record_id: str) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id, allow_deleted=True)
        row.deleted_at = None
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def search_records(
        self,
        entity: EntityDefinition,
        query: str,
        *,
        include_deleted: bool = False,
    ) -> list[dict[str, Any]]:
        query_lower = query.lower()
        results: list[dict[str, Any]] = []
        for item in self.list_records(entity, include_deleted=include_deleted):
            if self._matches_query(entity, item, query_lower):
                results.append(item)
        return results

    def _get_row(
        self,
        entity_code: str,
        record_id: str,
        *,
        allow_deleted: bool = False,
    ) -> EntityRecordRow:
        row = (
            self._session.query(EntityRecordRow)
            .filter_by(id=record_id, entity_code=entity_code, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None:
            msg = f"Record not found: {record_id}"
            raise EntityRepositoryError(msg)
        if not allow_deleted and row.deleted_at is not None:
            msg = f"Record not found: {record_id}"
            raise EntityRepositoryError(msg)
        return row

    def _validate_payload(
        self,
        entity: EntityDefinition,
        payload: dict[str, Any],
        *,
        partial: bool = False,
    ) -> dict[str, Any]:
        injected = set(payload.keys()) & SYSTEM_FIELD_NAMES
        if injected:
            msg = f"Cannot set system fields: {', '.join(sorted(injected))}"
            raise EntityRepositoryError(msg)

        allowed = {field.name for field in entity.fields}
        unknown = set(payload.keys()) - allowed
        if unknown:
            msg = f"Unknown fields: {', '.join(sorted(unknown))}"
            raise EntityRepositoryError(msg)

        validated: dict[str, Any] = {}
        from emcap.entity.models import FieldType

        for field in entity.fields:
            if field.name not in payload:
                if field.required and not partial:
                    msg = f"Missing required field: {field.name}"
                    raise EntityRepositoryError(msg)
                continue
            validated[field.name] = self._coerce_field_value(field, payload[field.name])
            if field.field_type == FieldType.LOOKUP and validated[field.name] is not None:
                self._validate_lookup_reference(field, str(validated[field.name]))
        return validated

    def _validate_lookup_reference(self, field: object, record_id: str) -> None:
        from emcap.entity.models import FieldDefinition, FieldType

        if not isinstance(field, FieldDefinition) or field.field_type != FieldType.LOOKUP:
            return
        if not field.lookup_entity:
            return
        if self._registry is None:
            return
        target_code = field.lookup_entity
        try:
            self._registry.get(target_code)
        except EntityRegistryError as exc:
            raise EntityRepositoryError(str(exc)) from exc
        row = (
            self._session.query(EntityRecordRow)
            .filter_by(id=record_id, entity_code=target_code, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None or row.deleted_at is not None:
            msg = (
                f"Invalid lookup for {field.name}: "
                f"{target_code} record '{record_id}' not found"
            )
            raise EntityRepositoryError(msg)

    def _coerce_field_value(self, field: object, value: Any) -> Any:
        from emcap.entity.models import FieldDefinition, FieldType

        if not isinstance(field, FieldDefinition):
            return value
        if field.field_type == FieldType.ENUM and field.options:
            str_value = str(value)
            if str_value not in field.options:
                msg = f"Invalid enum value for {field.name}: {value}"
                raise EntityRepositoryError(msg)
            return str_value
        if field.field_type == FieldType.LOOKUP:
            if value is None or value == "":
                return None
            return str(value)
        if field.field_type == FieldType.CURRENCY:
            try:
                return float(value)
            except (TypeError, ValueError) as exc:
                msg = f"Invalid currency value for {field.name}: {value}"
                raise EntityRepositoryError(msg) from exc
        if field.field_type == FieldType.TEXTAREA:
            return str(value)
        return value

    def _matches_query(
        self,
        entity: EntityDefinition,
        record: dict[str, Any],
        query_lower: str,
    ) -> bool:
        for field in entity.fields:
            if not field.searchable:
                continue
            value = record.get(field.name)
            if value is not None and query_lower in str(value).lower():
                return True
        return False

    @staticmethod
    def _to_dict(row: EntityRecordRow) -> dict[str, Any]:
        return {
            "id": row.id,
            **row.data,
            "created_by": row.created_by,
            "updated_by": row.updated_by,
            "record_version": row.record_version,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
            "deleted_at": row.deleted_at.isoformat() if row.deleted_at else None,
        }


class AuditRepository:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def log(
        self,
        *,
        entity_code: str,
        record_id: str,
        action: str,
        payload: dict[str, Any],
    ) -> None:
        row = AuditLogRow(
            entity_code=entity_code,
            record_id=record_id,
            action=action,
            tenant_id=self._tenant_id,
            payload=payload,
        )
        self._session.add(row)
        self._session.commit()

    def list_for_entity(self, entity_code: str) -> list[dict[str, Any]]:
        rows = (
            self._session.query(AuditLogRow)
            .filter_by(entity_code=entity_code, tenant_id=self._tenant_id)
            .order_by(AuditLogRow.created_at.desc())
            .all()
        )
        return [
            {
                "id": row.id,
                "entity_code": row.entity_code,
                "record_id": row.record_id,
                "action": row.action,
                "payload": row.payload,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
