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
    code="ACCOUNTING",
    name="Accounting Module",
    entities=[
        EntityDefinition(
            code="ACCOUNT",
            fields=[
                FieldDefinition(name="code", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="balance",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=True,
                status_field=_ACTIVE_STATUS,
            ),
        ),
        EntityDefinition(
            code="JOURNAL_ENTRY",
            fields=[
                FieldDefinition(name="reference", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="account_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="ACCOUNT",
                    required=True,
                ),
                FieldDefinition(
                    name="amount",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=True,
                ),
                FieldDefinition(name="posted_at", field_type=FieldType.DATE, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=False,
                status_field=_ACTIVE_STATUS,
            ),
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
        MenuDefinition(
            code="account_balances",
            label="Account Balances",
            entity_code="ACCOUNT",
            report_code="ACCOUNT_BALANCES",
        ),
    ],
    permissions=["accounting.access"],
)
