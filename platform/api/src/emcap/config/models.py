from enum import StrEnum

from pydantic import BaseModel, Field


class TenantStrategyMode(StrEnum):
    SHARED_DATABASE = "shared_database"
    SCHEMA_PER_TENANT = "schema_per_tenant"
    DATABASE_PER_TENANT = "database_per_tenant"
    HYBRID = "hybrid"


class PlatformSettings(BaseModel):
    multi_tenant: bool = False
    white_label: bool = False


class TenantStrategySettings(BaseModel):
    mode: TenantStrategyMode = TenantStrategyMode.SHARED_DATABASE


class ModuleToggle(BaseModel):
    enabled: bool = False


class ModulesSettings(BaseModel):
    workflow: ModuleToggle = Field(default_factory=lambda: ModuleToggle(enabled=True))
    payments: ModuleToggle = Field(default_factory=ModuleToggle)
    notifications: ModuleToggle = Field(default_factory=lambda: ModuleToggle(enabled=True))
    ai: ModuleToggle = Field(default_factory=ModuleToggle)


class AuthenticationSettings(BaseModel):
    username_password: bool = True
    ldap: bool = False
    oauth: bool = True
    sso: bool = False


class AuditSettings(BaseModel):
    enabled: bool = True
    immutable: bool = True


class NotificationChannels(BaseModel):
    email: bool = True
    sms: bool = False
    push: bool = True
    whatsapp: bool = False


class GridSettings(BaseModel):
    export_excel: bool = True
    export_pdf: bool = True
    export_csv: bool = True
    grouping: bool = True
    realtime: bool = True
    offline: bool = True


class WorkflowSettings(BaseModel):
    enabled: bool = True
    escalation: bool = True
    delegation: bool = True
    sla_tracking: bool = True


class RulesSettings(BaseModel):
    scripting_enabled: bool = False
    formula_enabled: bool = True


class PaymentsSettings(BaseModel):
    enabled: bool = False


class AISettings(BaseModel):
    enabled: bool = False


class TenantBrandingSettings(BaseModel):
    domain: str = "localhost"
    theme: str = "default"


class SeedCoreSettings(BaseModel):
    enabled: bool = True
    path: str = "data/seed/core"


class SeedDemoSettings(BaseModel):
    enabled: bool = True
    path: str = "data/seed/demo"
    remove_when_disabled: bool = True


class SeedSettings(BaseModel):
    core: SeedCoreSettings = Field(default_factory=SeedCoreSettings)
    demo: SeedDemoSettings = Field(default_factory=SeedDemoSettings)


class PlatformConfig(BaseModel):
    platform: PlatformSettings = Field(default_factory=PlatformSettings)
    tenant_strategy: TenantStrategySettings = Field(default_factory=TenantStrategySettings)
    modules: ModulesSettings = Field(default_factory=ModulesSettings)
    authentication: AuthenticationSettings = Field(default_factory=AuthenticationSettings)
    audit: AuditSettings = Field(default_factory=AuditSettings)
    notifications: NotificationChannels = Field(default_factory=NotificationChannels)
    grid: GridSettings = Field(default_factory=GridSettings)
    workflow: WorkflowSettings = Field(default_factory=WorkflowSettings)
    rules: RulesSettings = Field(default_factory=RulesSettings)
    payments: PaymentsSettings = Field(default_factory=PaymentsSettings)
    ai: AISettings = Field(default_factory=AISettings)
    tenants: dict[str, TenantBrandingSettings] = Field(
        default_factory=lambda: {"default": TenantBrandingSettings()}
    )
    seed: SeedSettings = Field(default_factory=SeedSettings)
