from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

MODULE = ModuleDefinition(
    code="POS",
    name="POS Module",
    entities=[
        EntityDefinition(
            code="SALE",
            fields=[
                FieldDefinition(name="receipt_no", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="total", field_type=FieldType.DECIMAL, required=True),
                FieldDefinition(name="payment_method", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True, notes_enabled=False),
        ),
        EntityDefinition(
            code="TERMINAL",
            fields=[
                FieldDefinition(name="terminal_id", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="location", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True),
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
        MenuDefinition(code="sales", label="Sales", entity_code="SALE"),
        MenuDefinition(code="terminals", label="Terminals", entity_code="TERMINAL"),
    ],
    permissions=["pos.access"],
)
