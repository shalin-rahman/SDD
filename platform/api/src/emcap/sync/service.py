from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from emcap.config.models import PlatformConfig
from emcap.entity.registry import EntityRegistry
from emcap.metadata.builder import build_form_metadata, build_grid_metadata
from emcap.persistence.repository import EntityRepository


class SyncService:
    def __init__(
        self,
        session: Session,
        registry: EntityRegistry,
        tenant_id: str = "default",
    ) -> None:
        self._session = session
        self._registry = registry
        self._tenant_id = tenant_id

    def snapshot(self, entity_code: str, platform_config: PlatformConfig) -> dict[str, Any]:
        entity = self._registry.get(entity_code)
        repo = EntityRepository(self._session, tenant_id=self._tenant_id)
        records = repo.list_records(entity)
        now = datetime.now(UTC).isoformat()
        return {
            "entity_code": entity_code,
            "sync_version": now,
            "records": records,
            "form_metadata": build_form_metadata(entity).model_dump(),
            "grid_metadata": build_grid_metadata(entity, platform_config).model_dump(),
        }

    def changes(self, entity_code: str, since: datetime) -> dict[str, Any]:
        entity = self._registry.get(entity_code)
        repo = EntityRepository(self._session, tenant_id=self._tenant_id)
        records = [
            record
            for record in repo.list_records(entity)
            if self._record_updated_after(record, since)
        ]
        return {
            "entity_code": entity_code,
            "since": since.isoformat(),
            "records": records,
            "count": len(records),
        }

    @staticmethod
    def _record_updated_after(record: dict[str, Any], since: datetime) -> bool:
        updated = record.get("updated_at") or record.get("created_at")
        if not updated:
            return True
        if isinstance(updated, str):
            parsed = datetime.fromisoformat(updated.replace("Z", "+00:00"))
        else:
            parsed = updated
        return parsed >= since
