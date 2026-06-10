from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from emcap.entity.registry import EntityRegistry
from emcap.persistence.database import ReportRunRow
from emcap.persistence.repository import EntityRepository
from emcap.reporting.models import ReportColumn, ReportDefinition


class ReportingService:
    def __init__(
        self,
        session: Session,
        registry: EntityRegistry,
        tenant_id: str = "default",
    ) -> None:
        self._session = session
        self._registry = registry
        self._tenant_id = tenant_id

    def execute(self, definition: ReportDefinition) -> dict[str, Any]:
        entity = self._registry.get(definition.entity_code)
        repo = EntityRepository(self._session, tenant_id=self._tenant_id)
        records = repo.list_records(entity)
        columns = definition.columns or [
            ReportColumn(field=field.name, label=field.name.replace("_", " ").title())
            for field in entity.fields
        ]
        rows = [{col.field: record.get(col.field) for col in columns} for record in records]
        run_id = str(uuid4())
        row = ReportRunRow(
            id=run_id,
            report_code=definition.code,
            tenant_id=self._tenant_id,
            result={"columns": [c.model_dump() for c in columns], "rows": rows},
        )
        self._session.add(row)
        self._session.commit()
        return {
            "run_id": run_id,
            "report_code": definition.code,
            "rows": rows,
            "row_count": len(rows),
        }

    def list_runs(self, report_code: str) -> list[dict[str, Any]]:
        rows = (
            self._session.query(ReportRunRow)
            .filter_by(report_code=report_code, tenant_id=self._tenant_id)
            .order_by(ReportRunRow.created_at.desc())
            .all()
        )
        return [
            {
                "run_id": row.id,
                "report_code": row.report_code,
                "row_count": len(row.result.get("rows", [])),
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
