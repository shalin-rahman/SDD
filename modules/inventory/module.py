import importlib.util
from pathlib import Path
from typing import Any, Callable

from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import DashboardDefinition, DashboardWidget, ReportColumn, ReportDefinition
from emcap.workflow.models import WorkflowDefinition, WorkflowState, WorkflowTransition

MOVEMENT_TYPES = [
    "receive",
    "return",
    "bonus",
    "gift",
    "damage",
    "lost",
    "transfer",
    "adjustment",
    "issue",
]
REFERENCE_TYPES = ["manual", "purchase_order", "sales_order", "stock_adjustment"]
MOVEMENT_OPEN_STATUSES = ["draft"]


def _load_stock_movement_validators() -> dict[str, Callable[..., Any]]:
    path = Path(__file__).resolve().parent / "stock_movement.py"
    spec = importlib.util.spec_from_file_location("inventory_stock_movement", path)
    if spec is None or spec.loader is None:
        return {}
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return {"STOCK_MOVEMENT": module.validate_stock_movement_payload}


ENTITY_VALIDATORS = _load_stock_movement_validators()

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
                FieldDefinition(
                    name="unit_price",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=["inventory.access"],
                ),
                FieldDefinition(name="quantity_on_hand", field_type=FieldType.INTEGER, required=False),
                FieldDefinition(name="reorder_level", field_type=FieldType.INTEGER, required=False),
                FieldDefinition(
                    name="primary_warehouse",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="WAREHOUSE",
                    required=False,
                ),
                FieldDefinition(
                    name="description",
                    field_type=FieldType.TEXTAREA,
                    required=False,
                    searchable=True,
                ),
                FieldDefinition(
                    name="stock_category",
                    field_type=FieldType.ENUM,
                    options=["standard", "premium"],
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                document_enabled=False,
                status_field=StatusFieldDisplay(
                    field="active",
                    active_values=[True],
                    labels={
                        "active": {"en": "Active", "bn": "সক্রিয়"},
                        "inactive": {"en": "Inactive", "bn": "নিষ্ক্রিয়"},
                    },
                ),
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
                status_field=StatusFieldDisplay(
                    field="active",
                    active_values=[True],
                    labels={
                        "active": {"en": "Active", "bn": "সক্রিয়"},
                        "inactive": {"en": "Inactive", "bn": "নিষ্ক্রিয়"},
                    },
                ),
            ),
        ),
        EntityDefinition(
            code="STOCK_MOVEMENT",
            fields=[
                FieldDefinition(name="movement_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="movement_type",
                    field_type=FieldType.ENUM,
                    options=list(MOVEMENT_TYPES),
                    required=True,
                ),
                FieldDefinition(name="movement_date", field_type=FieldType.DATE, required=True),
                FieldDefinition(
                    name="warehouse_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="WAREHOUSE",
                    required=True,
                ),
                FieldDefinition(
                    name="source_warehouse_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="WAREHOUSE",
                    required=False,
                ),
                FieldDefinition(
                    name="reference_type",
                    field_type=FieldType.ENUM,
                    options=list(REFERENCE_TYPES),
                    required=False,
                ),
                FieldDefinition(name="reference_id", field_type=FieldType.STRING, required=False),
                FieldDefinition(
                    name="notes",
                    field_type=FieldType.TEXTAREA,
                    required=False,
                    searchable=True,
                ),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "posted", "cancelled"],
                    required=True,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=True,
                status_field=StatusFieldDisplay(
                    field="status",
                    active_values=MOVEMENT_OPEN_STATUSES,
                    labels={
                        "active": {"en": "Open", "bn": "খোলা"},
                        "inactive": {"en": "Closed", "bn": "বন্ধ"},
                    },
                ),
            ),
        ),
        EntityDefinition(
            code="STOCK_MOVEMENT_LINE",
            fields=[
                FieldDefinition(
                    name="movement_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="STOCK_MOVEMENT",
                    required=True,
                ),
                FieldDefinition(
                    name="product_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="PRODUCT",
                    required=True,
                ),
                FieldDefinition(name="quantity", field_type=FieldType.DECIMAL, required=True),
                FieldDefinition(
                    name="unit_cost",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                ),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=False,
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
        ReportDefinition(
            code="STOCK_MOVEMENT_HISTORY",
            name="Stock Movement History",
            entity_code="STOCK_MOVEMENT",
            columns=[
                ReportColumn(field="movement_number", label="Movement"),
                ReportColumn(field="movement_type", label="Type"),
                ReportColumn(field="warehouse_id", label="Warehouse"),
                ReportColumn(field="status", label="Status"),
                ReportColumn(field="movement_date", label="Date"),
            ],
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
        MenuDefinition(code="stock_movements", label="Stock Movements", entity_code="STOCK_MOVEMENT"),
        MenuDefinition(code="low_stock", label="Low Stock Report", entity_code="PRODUCT", report_code="LOW_STOCK"),
        MenuDefinition(
            code="inventory_valuation",
            label="Inventory Valuation",
            entity_code="PRODUCT",
            report_code="INVENTORY_VALUATION",
        ),
        MenuDefinition(
            code="stock_movement_history",
            label="Movement History",
            entity_code="STOCK_MOVEMENT",
            report_code="STOCK_MOVEMENT_HISTORY",
        ),
    ],
    permissions=["inventory.access"],
)
