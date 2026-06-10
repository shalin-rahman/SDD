from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import DashboardDefinition, DashboardWidget, ReportColumn, ReportDefinition
from emcap.workflow.models import WorkflowDefinition, WorkflowState, WorkflowTransition

STOCK_ADJUSTMENT = WorkflowDefinition(
    code="STOCK_ADJUSTMENT",
    entity_code="PRODUCT",
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
    code="INVENTORY",
    name="Inventory Module",
    entities=[
        EntityDefinition(
            code="PRODUCT",
            fields=[
                FieldDefinition(name="sku", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="unit_price", field_type=FieldType.DECIMAL, required=False),
                FieldDefinition(name="quantity_on_hand", field_type=FieldType.INTEGER, required=False),
                FieldDefinition(name="reorder_level", field_type=FieldType.INTEGER, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                document_enabled=False,
            ),
        ),
        EntityDefinition(
            code="WAREHOUSE",
            fields=[
                FieldDefinition(name="code", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="location", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=False,
            ),
        ),
    ],
    workflows=[STOCK_ADJUSTMENT],
    reports=[
        ReportDefinition(
            code="INVENTORY_VALUATION",
            name="Inventory Valuation",
            entity_code="PRODUCT",
            columns=[
                ReportColumn(field="sku", label="SKU"),
                ReportColumn(field="name", label="Product Name"),
                ReportColumn(field="unit_price", label="Unit Price"),
                ReportColumn(field="quantity_on_hand", label="Quantity On Hand"),
            ],
            schedule_cron="0 6 * * *",
        ),
        ReportDefinition(
            code="LOW_STOCK",
            name="Low Stock",
            entity_code="PRODUCT",
            columns=[
                ReportColumn(field="sku", label="SKU"),
                ReportColumn(field="name", label="Product Name"),
                ReportColumn(field="quantity_on_hand", label="Quantity On Hand"),
                ReportColumn(field="reorder_level", label="Reorder Level"),
            ],
            schedule_cron="0 7 * * *",
        ),
    ],
    dashboards=[
        DashboardDefinition(
            code="INVENTORY_OVERVIEW",
            name="Inventory Overview",
            widgets=[
                DashboardWidget(code="total_products", label="Total Products", metric="count"),
                DashboardWidget(code="low_stock_items", label="Low Stock Items", metric="low_stock_count"),
                DashboardWidget(code="active_products", label="Active Products", metric="active_count"),
                DashboardWidget(code="total_warehouses", label="Total Warehouses", metric="warehouse_count"),
            ],
        )
    ],
    menus=[
        MenuDefinition(code="products", label="Products", entity_code="PRODUCT"),
        MenuDefinition(code="warehouses", label="Warehouses", entity_code="WAREHOUSE"),
    ],
    permissions=["inventory.access"],
)
