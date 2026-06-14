from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from emcap import __version__
from emcap.admin.security_service import load_abac_policies, load_field_overrides
from emcap.api.routes import (
    admin,
    ai,
    auth,
    config,
    documents,
    entities,
    graphql,
    health,
    integrations,
    menus,
    metadata,
    notes,
    notifications,
    observability,
    payments,
    permissions,
    realtime,
    reports,
    sync,
    tenants,
    workflows,
)
from emcap.auth.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from emcap.auth.providers.oauth import OAuthAuthProvider
from emcap.auth.providers.password import PasswordAuthProvider
from emcap.auth.providers.registry import AuthProviderRegistry
from emcap.auth.service import seed_default_auth
from emcap.config.loader import load_platform_config
from emcap.entity.registry import EntityRegistry
from emcap.module.loader import load_entity_validators, load_modules
from emcap.module.models import ModuleDefinition
from emcap.observability.logging_middleware import JsonLoggingMiddleware
from emcap.observability.metrics import MetricsMiddleware
from emcap.observability.tracing_middleware import TracingMiddleware
from emcap.persistence.database import get_session_factory, init_db
from emcap.reporting.models import DashboardDefinition, ReportDefinition
from emcap.seed.loader import apply_configured_seeds
from emcap.tenancy.middleware import TenantMiddleware
from emcap.tenancy.strategies import get_tenant_strategy
from emcap.workflow.models import WorkflowDefinition


def _collect_reports(modules: list[ModuleDefinition]) -> dict[str, ReportDefinition]:
    definitions: dict[str, ReportDefinition] = {}
    for module in modules:
        for report in module.reports:
            if isinstance(report, ReportDefinition):
                definitions[report.code] = report
    return definitions


def _collect_dashboards(modules: list[ModuleDefinition]) -> dict[str, DashboardDefinition]:
    definitions: dict[str, DashboardDefinition] = {}
    for module in modules:
        for dashboard in module.dashboards:
            if isinstance(dashboard, DashboardDefinition):
                definitions[dashboard.code] = dashboard
    return definitions


def _collect_workflows(modules: list[ModuleDefinition]) -> dict[str, WorkflowDefinition]:
    definitions: dict[str, WorkflowDefinition] = {}
    for module in modules:
        for workflow in module.workflows:
            if isinstance(workflow, WorkflowDefinition):
                definitions[workflow.code] = workflow
    return definitions


def create_app() -> FastAPI:
    platform_config = load_platform_config()

    registry = EntityRegistry()
    modules = load_modules(registry)
    registry.validate()
    entity_validators = load_entity_validators()
    workflow_definitions = _collect_workflows(modules)
    report_definitions = _collect_reports(modules)
    dashboard_definitions = _collect_dashboards(modules)

    init_db()
    session_factory = get_session_factory()
    seed_session = session_factory()
    try:
        apply_configured_seeds(seed_session, platform_config)
        seed_default_auth(seed_session)
        abac_policies = load_abac_policies(seed_session, platform_config)
        field_overrides = load_field_overrides(seed_session)
    finally:
        seed_session.close()

    auth_registry = AuthProviderRegistry()
    auth_registry.register(PasswordAuthProvider(session_factory))
    auth_registry.register(OAuthAuthProvider())

    app = FastAPI(
        title="EMCAP Platform API",
        version=__version__,
        description="Enterprise Multi-Tenant Core Application Platform",
    )
    app.state.platform_config = platform_config
    app.state.entity_registry = registry
    app.state.entity_validators = entity_validators
    app.state.modules = modules
    app.state.session_factory = session_factory
    app.state.auth_registry = auth_registry
    app.state.tenant_strategy = get_tenant_strategy(platform_config.tenant_strategy.mode)
    app.state.workflow_definitions = workflow_definitions
    app.state.report_definitions = report_definitions
    app.state.dashboard_definitions = dashboard_definitions
    app.state.abac_policies = abac_policies
    app.state.field_overrides = field_overrides

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TracingMiddleware)
    app.add_middleware(MetricsMiddleware)
    app.add_middleware(JsonLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(TenantMiddleware, config=platform_config)

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(config.router, prefix="/api/v1")
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(tenants.router, prefix="/api/v1")
    app.include_router(metadata.router, prefix="/api/v1")
    # Register stream routes before /entities/{code}/records/{record_id} (record_id="stream").
    app.include_router(realtime.router, prefix="/api/v1")
    app.include_router(workflows.router, prefix="/api/v1")
    app.include_router(entities.router, prefix="/api/v1")
    app.include_router(menus.router, prefix="/api/v1")
    app.include_router(permissions.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
    app.include_router(notifications.router, prefix="/api/v1")
    app.include_router(documents.router, prefix="/api/v1")
    app.include_router(integrations.router, prefix="/api/v1")
    app.include_router(graphql.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(ai.router, prefix="/api/v1")
    app.include_router(observability.router, prefix="/api/v1")
    app.include_router(notes.router, prefix="/api/v1")
    app.include_router(sync.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")

    return app


app = create_app()
