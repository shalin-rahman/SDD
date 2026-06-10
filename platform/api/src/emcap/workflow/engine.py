from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import WorkflowInstanceRow
from emcap.workflow.models import WorkflowDefinition, WorkflowTransition


class WorkflowEngineError(Exception):
    pass


class WorkflowEngine:
    def __init__(self, session: Session, tenant_id: str = "default") -> None:
        self._session = session
        self._tenant_id = tenant_id
        self._definitions: dict[str, WorkflowDefinition] = {}

    def register(self, definition: WorkflowDefinition) -> None:
        self._definitions[definition.code] = definition

    def start(
        self,
        definition: WorkflowDefinition,
        *,
        record_id: str,
        assignee: str | None = None,
    ) -> dict[str, Any]:
        initial = next(state for state in definition.states if state.initial)
        due_at = datetime.now(UTC) + timedelta(hours=definition.sla_hours)
        row = WorkflowInstanceRow(
            workflow_code=definition.code,
            entity_code=definition.entity_code,
            record_id=record_id,
            tenant_id=self._tenant_id,
            current_state=initial.code,
            assignee=assignee,
            due_at=due_at,
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def transition(self, instance_id: str, action: str, actor: str) -> dict[str, Any]:
        row = self._get(instance_id)
        definition = self._definitions.get(row.workflow_code)
        if definition is None:
            msg = f"Unknown workflow: {row.workflow_code}"
            raise WorkflowEngineError(msg)

        transition = self._find_transition(definition, row.current_state, action)
        row.current_state = transition.to_state
        row.assignee = actor
        row.updated_at = datetime.now(UTC)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def delegate(self, instance_id: str, delegate_to: str) -> dict[str, Any]:
        row = self._get(instance_id)
        definition = self._definitions.get(row.workflow_code)
        if definition is None or not definition.delegation_allowed:
            msg = "Delegation not allowed"
            raise WorkflowEngineError(msg)
        row.delegated_to = delegate_to
        row.assignee = delegate_to
        row.updated_at = datetime.now(UTC)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dict(row)

    def escalate_overdue(self) -> list[dict[str, Any]]:
        now = datetime.now(UTC)
        rows = (
            self._session.query(WorkflowInstanceRow)
            .filter(
                WorkflowInstanceRow.tenant_id == self._tenant_id,
                WorkflowInstanceRow.due_at.isnot(None),
                WorkflowInstanceRow.due_at < now,
                WorkflowInstanceRow.escalated_at.is_(None),
            )
            .all()
        )
        escalated: list[dict[str, Any]] = []
        for row in rows:
            row.escalated_at = now
            row.current_state = "escalated"
            escalated.append(self._to_dict(row))
        if escalated:
            self._session.commit()
        return escalated

    def _get(self, instance_id: str) -> WorkflowInstanceRow:
        row = (
            self._session.query(WorkflowInstanceRow)
            .filter_by(id=instance_id, tenant_id=self._tenant_id)
            .one_or_none()
        )
        if row is None:
            msg = f"Workflow instance not found: {instance_id}"
            raise WorkflowEngineError(msg)
        return row

    @staticmethod
    def _find_transition(
        definition: WorkflowDefinition,
        current_state: str,
        action: str,
    ) -> WorkflowTransition:
        for transition in definition.transitions:
            if transition.from_state == current_state and transition.code == action:
                return transition
        msg = f"Invalid transition '{action}' from state '{current_state}'"
        raise WorkflowEngineError(msg)

    @staticmethod
    def _to_dict(row: WorkflowInstanceRow) -> dict[str, Any]:
        return {
            "id": row.id,
            "workflow_code": row.workflow_code,
            "entity_code": row.entity_code,
            "record_id": row.record_id,
            "current_state": row.current_state,
            "assignee": row.assignee,
            "delegated_to": row.delegated_to,
            "due_at": row.due_at.isoformat() if row.due_at else None,
            "escalated_at": row.escalated_at.isoformat() if row.escalated_at else None,
        }
