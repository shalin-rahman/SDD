from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.rules.engine import RuleEngineError, evaluate_formula
from emcap.workflow.engine import WorkflowEngine, WorkflowEngineError
from emcap.workflow.models import WorkflowDefinition

router = APIRouter(prefix="/workflows", tags=["workflows"])


class StartWorkflowRequest(BaseModel):
    record_id: str
    assignee: str | None = None


class TransitionRequest(BaseModel):
    action: str
    actor: str


class DelegateRequest(BaseModel):
    delegate_to: str


class EvaluateRuleRequest(BaseModel):
    expression: str
    context: dict[str, Any] = {}


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.post("/{workflow_code}/start")
def start_workflow(
    workflow_code: str,
    payload: StartWorkflowRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    definitions: dict[str, WorkflowDefinition] = request.app.state.workflow_definitions
    if workflow_code not in definitions:
        raise HTTPException(status_code=404, detail=f"Unknown workflow: {workflow_code}")

    session = _session(request)
    try:
        engine = _build_engine(request, session, tenant_id)
        definition = definitions[workflow_code]
        return engine.start(
            definition,
            record_id=payload.record_id,
            assignee=payload.assignee,
        )
    except WorkflowEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/instances/{instance_id}/transition")
def transition_workflow(
    instance_id: str,
    payload: TransitionRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        engine = _build_engine(request, session, tenant_id)
        return engine.transition(instance_id, payload.action, payload.actor)
    except WorkflowEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/instances/{instance_id}/delegate")
def delegate_workflow(
    instance_id: str,
    payload: DelegateRequest,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        engine = _build_engine(request, session, tenant_id)
        return engine.delegate(instance_id, payload.delegate_to)
    except WorkflowEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        session.close()


@router.post("/escalate")
def escalate_workflows(
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    session = _session(request)
    try:
        engine = _build_engine(request, session, tenant_id)
        return {"escalated": engine.escalate_overdue()}
    finally:
        session.close()


@router.post("/rules/evaluate")
def evaluate_rule(payload: EvaluateRuleRequest, request: Request) -> dict[str, Any]:
    if not request.app.state.platform_config.rules.formula_enabled:
        raise HTTPException(status_code=403, detail="Rule engine disabled")
    try:
        result = evaluate_formula(payload.expression, payload.context)
    except RuleEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"result": result}


def _build_engine(request: Request, session: Session, tenant_id: str) -> WorkflowEngine:
    engine = WorkflowEngine(session, tenant_id=tenant_id)
    for definition in request.app.state.workflow_definitions.values():
        engine.register(definition)
    return engine
