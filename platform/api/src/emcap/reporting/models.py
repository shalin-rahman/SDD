from pydantic import BaseModel, Field


class ReportColumn(BaseModel):
    field: str
    label: str


class ReportDefinition(BaseModel):
    code: str
    name: str
    entity_code: str
    columns: list[ReportColumn] = Field(default_factory=list)
    schedule_cron: str | None = None


class DashboardWidget(BaseModel):
    code: str
    label: str
    metric: str
    widget_type: str = "kpi"


class DashboardDefinition(BaseModel):
    code: str
    name: str
    widgets: list[DashboardWidget] = Field(default_factory=list)
