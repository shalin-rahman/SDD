from collections.abc import Callable
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from emcap.auth.dependencies import get_tenant_id
from emcap.entity.registry import EntityRegistry
from emcap.reporting.models import DashboardDefinition, ReportDefinition
from emcap.reporting.service import ReportingService

router = APIRouter(tags=["reports"])


def _session(request: Request) -> Session:
    factory = cast(Callable[[], Session], request.app.state.session_factory)
    session = factory()
    strategy = request.app.state.tenant_strategy
    tenant_id = getattr(request.state, "tenant_id", "default")
    strategy.bind_session(session, tenant_id)
    return session


@router.get("/reports")
def list_reports(request: Request) -> dict[str, Any]:
    reports = request.app.state.report_definitions
    return {"reports": [code for code in reports.keys()]}


@router.post("/reports/{report_code}/run")
def run_report(
    report_code: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    definitions: dict[str, ReportDefinition] = request.app.state.report_definitions
    if report_code not in definitions:
        raise HTTPException(status_code=404, detail=f"Unknown report: {report_code}")

    registry = cast(EntityRegistry, request.app.state.entity_registry)
    session = _session(request)
    try:
        service = ReportingService(session, registry, tenant_id=tenant_id)
        return service.execute(definitions[report_code])
    finally:
        session.close()


@router.get("/reports/{report_code}/runs")
def list_report_runs(
    report_code: str,
    request: Request,
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "default",
) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    session = _session(request)
    try:
        service = ReportingService(session, registry, tenant_id=tenant_id)
        return {"runs": service.list_runs(report_code)}
    finally:
        session.close()


@router.get("/dashboards")
def list_dashboards(request: Request) -> dict[str, Any]:
    dashboards: dict[str, DashboardDefinition] = request.app.state.dashboard_definitions
    return {
        "dashboards": [
            {"code": d.code, "name": d.name, "widgets": [w.model_dump() for w in d.widgets]}
            for d in dashboards.values()
        ]
    }
