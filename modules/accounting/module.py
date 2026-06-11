from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

MODULE = ModuleDefinition(
    code="ACCOUNTING",
    name="Accounting Module",
    entities=[
        EntityDefinition(
            code="ACCOUNT",
            fields=[
                FieldDefinition(name="code", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="balance", field_type=FieldType.DECIMAL, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True, notes_enabled=True),
        ),
        EntityDefinition(
            code="JOURNAL_ENTRY",
            fields=[
                FieldDefinition(name="reference", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="amount", field_type=FieldType.DECIMAL, required=True),
                FieldDefinition(name="posted_at", field_type=FieldType.DATE, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True, notes_enabled=False),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="ACCOUNT_BALANCES",
            name="Account Balances",
            entity_code="ACCOUNT",
            columns=[
                ReportColumn(field="code", label="Code"),
                ReportColumn(field="name", label="Name"),
                ReportColumn(field="balance", label="Balance"),
            ],
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="accounts", label="Accounts", entity_code="ACCOUNT"),
        MenuDefinition(code="journal", label="Journal Entries", entity_code="JOURNAL_ENTRY"),
    ],
    permissions=["accounting.access"],
)
