from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import DashboardDefinition, DashboardWidget, ReportColumn, ReportDefinition
from emcap.workflow.models import WorkflowDefinition, WorkflowState, WorkflowTransition

CUSTOMER_APPROVAL = WorkflowDefinition(
    code="CUSTOMER_APPROVAL",
    entity_code="CUSTOMER",
    states=[
        WorkflowState(code="draft", label="Draft", initial=True),
        WorkflowState(code="submitted", label="Submitted"),
        WorkflowState(code="approved", label="Approved", terminal=True),
        WorkflowState(code="rejected", label="Rejected", terminal=True),
        WorkflowState(code="escalated", label="Escalated"),
    ],
    transitions=[
        WorkflowTransition(code="submit", from_state="draft", to_state="submitted"),
        WorkflowTransition(code="approve", from_state="submitted", to_state="approved"),
        WorkflowTransition(code="reject", from_state="submitted", to_state="rejected"),
    ],
    escalation_hours=24,
    delegation_allowed=True,
    sla_hours=48,
)

MODULE = ModuleDefinition(
    code="DEMO",
    name="Demo Module",
    entities=[
        EntityDefinition(
            code="CUSTOMER",
            fields=[
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="email", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                document_enabled=False,
            ),
        )
    ],
    workflows=[CUSTOMER_APPROVAL],
    reports=[
        ReportDefinition(
            code="CUSTOMER_LIST",
            name="Customer List",
            entity_code="CUSTOMER",
            columns=[
                ReportColumn(field="name", label="Name"),
                ReportColumn(field="email", label="Email"),
                ReportColumn(field="active", label="Active"),
            ],
            schedule_cron="0 6 * * *",
        )
    ],
    dashboards=[
        DashboardDefinition(
            code="CUSTOMER_OVERVIEW",
            name="Customer Overview",
            widgets=[
                DashboardWidget(code="total_customers", label="Total Customers", metric="count"),
                DashboardWidget(code="active_customers", label="Active Customers", metric="active_count"),
            ],
        )
    ],
    menus=[
        MenuDefinition(code="customers", label="Customers", entity_code="CUSTOMER"),
    ],
    permissions=["demo.access"],
)
