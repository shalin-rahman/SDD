from typing import Any

from sqlalchemy.orm import Session

from emcap.entity.models import EntityDefinition
from emcap.persistence.database import AuditLogRow, EntityRecordRow


class EntityRepositoryError(Exception):
    pass


class EntityRepository:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id

    def list_records(self, entity: EntityDefinition) -> list[dict[str, Any]]:
        rows = (
            self._session.query(EntityRecordRow)
            .filter_by(entity_code=entity.code, tenant_id=self._tenant_id)
            .order_by(EntityRecordRow.created_at.desc())
            .all()
        )
        return [self._to_dict(row) for row in rows]

    def get_record(self, entity: EntityDefinition, record_id: str) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id)
        return self._to_dict(row)

    def create_record(self, entity: EntityDefinition, payload: dict[str, Any]) -> dict[str, Any]:
        data = self._validate_payload(entity, payload)
        row = EntityRecordRow(
            id=str(__import__("uuid").uuid4()),
            entity_code=entity.code,
            tenant_id=self._tenant_id,
            data=data,
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
    ) -> dict[str, Any]:
        row = self._get_row(entity.code, record_id)
        merged = {**row.data, **self._validate_payload(entity, payload, partial=True)}
        row.data = merged
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def delete_record(self, entity: EntityDefinition, record_id: str) -> None:
        row = self._get_row(entity.code, record_id)
        self._session.delete(row)
        self._session.commit()

    def search_records(self, entity: EntityDefinition, query: str) -> list[dict[str, Any]]:
        query_lower = query.lower()
        results: list[dict[str, Any]] = []
        for item in self.list_records(entity):
            if self._matches_query(entity, item, query_lower):
                results.append(item)
        return results

    def _get_row(self, entity_code: str, record_id: str) -> EntityRecordRow:
        row = (
            self._session.query(EntityRecordRow)
            .filter_by(id=record_id, entity_code=entity_code, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None:
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
        allowed = {field.name for field in entity.fields}
        unknown = set(payload.keys()) - allowed
        if unknown:
            msg = f"Unknown fields: {', '.join(sorted(unknown))}"
            raise EntityRepositoryError(msg)

        validated: dict[str, Any] = {}
        for field in entity.fields:
            if field.name not in payload:
                if field.required and not partial:
                    msg = f"Missing required field: {field.name}"
                    raise EntityRepositoryError(msg)
                continue
            validated[field.name] = payload[field.name]
        return validated

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
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
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
