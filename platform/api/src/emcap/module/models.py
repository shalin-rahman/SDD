from pydantic import BaseModel, Field, field_validator

from emcap.entity.models import EntityDefinition
from emcap.reporting.models import DashboardDefinition, ReportDefinition
from emcap.workflow.models import WorkflowDefinition


class MenuDefinition(BaseModel):
    code: str
    label: str
    entity_code: str
    report_code: str | None = None
    permission: str = "read"

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().lower()


class ModuleDefinition(BaseModel):
    code: str
    name: str
    entities: list[EntityDefinition] = Field(default_factory=list)
    workflows: list[WorkflowDefinition] = Field(default_factory=list)
    reports: list[ReportDefinition] = Field(default_factory=list)
    dashboards: list[DashboardDefinition] = Field(default_factory=list)
    menus: list[MenuDefinition] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized.isidentifier():
            msg = f"Invalid module code: {value}"
            raise ValueError(msg)
        return normalized
