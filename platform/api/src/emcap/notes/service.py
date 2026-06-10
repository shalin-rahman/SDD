from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from emcap.entity.registry import EntityRegistry
from emcap.persistence.database import NoteRow


class NotesService:
    def __init__(self, session: Session, registry: EntityRegistry, tenant_id: str = "default") -> None:
        self._session = session
        self._registry = registry
        self._tenant_id = tenant_id

    def list_notes(self, entity_code: str, record_id: str) -> list[dict[str, Any]]:
        entity = self._registry.get(entity_code)
        if not entity.options.notes_enabled:
            return []
        rows = (
            self._session.query(NoteRow)
            .filter_by(
                entity_code=entity_code,
                record_id=record_id,
                tenant_id=self._tenant_id,
            )
            .order_by(NoteRow.created_at.desc())
            .all()
        )
        return [self._to_dict(row) for row in rows]

    def add_note(
        self,
        entity_code: str,
        record_id: str,
        body: str,
        author: str = "system",
    ) -> dict[str, Any]:
        entity = self._registry.get(entity_code)
        if not entity.options.notes_enabled:
            msg = f"Notes disabled for entity: {entity_code}"
            raise ValueError(msg)

        row = NoteRow(
            id=str(uuid4()),
            entity_code=entity_code,
            record_id=record_id,
            tenant_id=self._tenant_id,
            body=body,
            author=author,
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    @staticmethod
    def _to_dict(row: NoteRow) -> dict[str, Any]:
        return {
            "id": row.id,
            "entity_code": row.entity_code,
            "record_id": row.record_id,
            "body": row.body,
            "author": row.author,
            "created_at": row.created_at.isoformat(),
        }
