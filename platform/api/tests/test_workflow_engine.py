"""Unit tests for workflow engine transitions and escalation."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from emcap.persistence.database import WorkflowInstanceRow, get_session_factory, init_db
from emcap.workflow.engine import WorkflowEngine, WorkflowEngineError
from emcap.workflow.models import WorkflowDefinition, WorkflowState, WorkflowTransition

_STOCK_ADJUSTMENT = WorkflowDefinition(
    code="TEST_WF",
    entity_code="PRODUCT",
    states=[
        WorkflowState(code="draft", label="Draft", initial=True),
        WorkflowState(code="submitted", label="Submitted"),
        WorkflowState(code="escalated", label="Escalated"),
    ],
    transitions=[
        WorkflowTransition(code="submit", from_state="draft", to_state="submitted"),
    ],
    escalation_hours=24,
    delegation_allowed=True,
    sla_hours=48,
)


@pytest.fixture
def wf_session(client: TestClient):
    init_db()
    session = get_session_factory()()
    engine = WorkflowEngine(session, tenant_id="default")
    engine.register(_STOCK_ADJUSTMENT)
    yield session, engine
    session.close()


def test_workflow_start_and_transition(wf_session) -> None:
    session, engine = wf_session
    started = engine.start(_STOCK_ADJUSTMENT, record_id="rec-1", assignee="admin")
    assert started["current_state"] == "draft"

    moved = engine.transition(started["id"], "submit", "admin")
    assert moved["current_state"] == "submitted"


def test_workflow_transition_invalid_action_raises(wf_session) -> None:
    session, engine = wf_session
    started = engine.start(_STOCK_ADJUSTMENT, record_id="rec-2")
    with pytest.raises(WorkflowEngineError, match="Invalid transition"):
        engine.transition(started["id"], "approve", "admin")


def test_workflow_delegate_when_allowed(wf_session) -> None:
    session, engine = wf_session
    started = engine.start(_STOCK_ADJUSTMENT, record_id="rec-3", assignee="admin")
    delegated = engine.delegate(started["id"], "reviewer")
    assert delegated["delegated_to"] == "reviewer"
    assert delegated["assignee"] == "reviewer"


def test_workflow_escalate_overdue(wf_session) -> None:
    session, engine = wf_session
    started = engine.start(_STOCK_ADJUSTMENT, record_id="rec-4")
    row = session.query(WorkflowInstanceRow).filter_by(id=started["id"]).one()
    row.due_at = datetime.now(UTC) - timedelta(hours=1)
    session.commit()

    escalated = engine.escalate_overdue()
    assert len(escalated) == 1
    assert escalated[0]["current_state"] == "escalated"


def test_workflow_get_instance_not_found(wf_session) -> None:
    _session, engine = wf_session
    with pytest.raises(WorkflowEngineError, match="not found"):
        engine.get_instance("00000000-0000-0000-0000-000000000099")
