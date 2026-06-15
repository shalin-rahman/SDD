from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

_ACTIVE_STATUS = StatusFieldDisplay(
    field="active",
    active_values=[True],
    labels={
        "active": {"en": "Active", "bn": "সক্রিয়"},
        "inactive": {"en": "Inactive", "bn": "নিষ্ক্রিয়"},
    },
)

MODULE = ModuleDefinition(
    code="POS",
    name="POS Module",
    entities=[
        EntityDefinition(
            code="SALE",
            fields=[
                FieldDefinition(name="receipt_no", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="total",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=True,
                ),
                FieldDefinition(
                    name="terminal_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="TERMINAL",
                    required=False,
                ),
                FieldDefinition(name="payment_method", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=False,
                status_field=_ACTIVE_STATUS,
            ),
        ),
        EntityDefinition(
            code="TERMINAL",
            fields=[
                FieldDefinition(name="terminal_id", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="location", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                status_field=_ACTIVE_STATUS,
            ),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="DAILY_SALES",
            name="Daily Sales",
            entity_code="SALE",
            columns=[
                ReportColumn(field="receipt_no", label="Receipt"),
                ReportColumn(field="total", label="Total"),
                ReportColumn(field="payment_method", label="Payment"),
            ],
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="sales", label="Sales", entity_code="SALE", icon="point_of_sale"),
        MenuDefinition(code="terminals", label="Terminals", entity_code="TERMINAL", icon="devices"),
        MenuDefinition(
            code="daily_sales", label="Daily Sales Report", entity_code="SALE", report_code="DAILY_SALES", icon="today"
        ),
    ],
    permissions=["pos.access"],
)
