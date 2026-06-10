from enum import StrEnum

from pydantic import BaseModel, Field


class WorkflowState(BaseModel):
    code: str
    label: str
    initial: bool = False
    terminal: bool = False


class WorkflowTransition(BaseModel):
    code: str
    from_state: str
    to_state: str
    permission: str | None = None


class WorkflowDefinition(BaseModel):
    code: str
    entity_code: str
    states: list[WorkflowState] = Field(min_length=1)
    transitions: list[WorkflowTransition] = Field(default_factory=list)
    escalation_hours: int = 24
    delegation_allowed: bool = True
    sla_hours: int = 48


class TransitionAction(StrEnum):
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    DELEGATE = "delegate"
    ESCALATE = "escalate"
