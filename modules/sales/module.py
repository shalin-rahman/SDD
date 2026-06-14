from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

SO_OPEN_STATUSES = ["draft", "confirmed", "shipped"]
INVOICE_OPEN_STATUSES = ["draft", "sent"]

MODULE = ModuleDefinition(
    code="SALES",
    name="Sales Module",
    entities=[
        EntityDefinition(
            code="SALES_ORDER",
            fields=[
                FieldDefinition(name="order_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="customer_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="CUSTOMER",
                    required=True,
                ),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "confirmed", "shipped", "invoiced", "cancelled"],
                    required=True,
                ),
                FieldDefinition(
                    name="total_amount",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                ),
                FieldDefinition(name="order_date", field_type=FieldType.DATE, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                document_enabled=False,
                status_field=StatusFieldDisplay(
                    field="status",
                    active_values=SO_OPEN_STATUSES,
                    labels={
                        "active": {"en": "Open", "bn": "খোলা"},
                        "inactive": {"en": "Closed", "bn": "বন্ধ"},
                    },
                ),
            ),
        ),
        EntityDefinition(
            code="INVOICE",
            fields=[
                FieldDefinition(name="invoice_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="sales_order_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="SALES_ORDER",
                    required=False,
                ),
                FieldDefinition(
                    name="customer_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="CUSTOMER",
                    required=True,
                ),
                FieldDefinition(
                    name="amount",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=True,
                ),
                FieldDefinition(name="due_date", field_type=FieldType.DATE, required=False),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "sent", "paid", "void"],
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
                    active_values=INVOICE_OPEN_STATUSES,
                    labels={
                        "active": {"en": "Outstanding", "bn": "বকেয়া"},
                        "inactive": {"en": "Settled", "bn": "নিষ্পত্তি"},
                    },
                ),
            ),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="OPEN_SALES_ORDERS",
            name="Open Sales Orders",
            entity_code="SALES_ORDER",
            columns=[
                ReportColumn(field="order_number", label="Order"),
                ReportColumn(field="customer_id", label="Customer"),
                ReportColumn(field="status", label="Status"),
                ReportColumn(field="total_amount", label="Total"),
            ],
            schedule_cron="0 8 * * *",
        ),
        ReportDefinition(
            code="OUTSTANDING_INVOICES",
            name="Outstanding Invoices",
            entity_code="INVOICE",
            columns=[
                ReportColumn(field="invoice_number", label="Invoice"),
                ReportColumn(field="customer_id", label="Customer"),
                ReportColumn(field="amount", label="Amount"),
                ReportColumn(field="status", label="Status"),
            ],
            schedule_cron="0 9 * * *",
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="sales_orders", label="Sales Orders", entity_code="SALES_ORDER"),
        MenuDefinition(code="invoices", label="Invoices", entity_code="INVOICE"),
        MenuDefinition(
            code="open_sales_orders",
            label="Open Orders Report",
            entity_code="SALES_ORDER",
            report_code="OPEN_SALES_ORDERS",
        ),
        MenuDefinition(
            code="outstanding_invoices",
            label="Outstanding Invoices",
            entity_code="INVOICE",
            report_code="OUTSTANDING_INVOICES",
        ),
    ],
    permissions=["sales.access"],
)
