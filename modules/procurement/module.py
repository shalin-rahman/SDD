from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

PO_OPEN_STATUSES = ["draft", "submitted", "received"]

MODULE = ModuleDefinition(
    code="PROCUREMENT",
    name="Procurement Module",
    entities=[
        EntityDefinition(
            code="SUPPLIER",
            fields=[
                FieldDefinition(name="code", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="email", field_type=FieldType.STRING, required=False),
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
            code="PURCHASE_ORDER",
            fields=[
                FieldDefinition(name="po_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="supplier_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="SUPPLIER",
                    required=True,
                ),
                FieldDefinition(
                    name="warehouse_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="WAREHOUSE",
                    required=False,
                ),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "submitted", "received", "cancelled"],
                    required=True,
                ),
                FieldDefinition(
                    name="total_amount",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                ),
                FieldDefinition(name="order_date", field_type=FieldType.DATE, required=False),
                FieldDefinition(
                    name="notes",
                    field_type=FieldType.TEXTAREA,
                    required=False,
                    searchable=True,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                document_enabled=True,
                status_field=StatusFieldDisplay(
                    field="status",
                    active_values=PO_OPEN_STATUSES,
                    labels={
                        "active": {"en": "Open", "bn": "খোলা"},
                        "inactive": {"en": "Closed", "bn": "বন্ধ"},
                    },
                ),
            ),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="OPEN_PURCHASE_ORDERS",
            name="Open Purchase Orders",
            entity_code="PURCHASE_ORDER",
            columns=[
                ReportColumn(field="po_number", label="PO Number"),
                ReportColumn(field="supplier_id", label="Supplier"),
                ReportColumn(field="status", label="Status"),
                ReportColumn(field="total_amount", label="Total"),
            ],
            schedule_cron="0 7 * * *",
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="suppliers", label="Suppliers", entity_code="SUPPLIER"),
        MenuDefinition(code="purchase_orders", label="Purchase Orders", entity_code="PURCHASE_ORDER"),
        MenuDefinition(
            code="open_purchase_orders",
            label="Open POs Report",
            entity_code="PURCHASE_ORDER",
            report_code="OPEN_PURCHASE_ORDERS",
        ),
    ],
    permissions=["procurement.access"],
)
