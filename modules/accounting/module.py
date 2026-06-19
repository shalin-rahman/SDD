import importlib.util
from pathlib import Path
from typing import Any, Callable

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

JE_OPEN_STATUSES = ["draft"]
_FINANCE_READ = ["accounting.view"]
ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"]


def _load_journal_validators() -> dict[str, Callable[..., Any]]:
    path = Path(__file__).resolve().parent / "journal.py"
    spec = importlib.util.spec_from_file_location("accounting_journal", path)
    if spec is None or spec.loader is None:
        return {}
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return {"JOURNAL_ENTRY": module.validate_journal_entry_payload}


ENTITY_VALIDATORS = _load_journal_validators()

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
                    name="account_type",
                    field_type=FieldType.ENUM,
                    options=ACCOUNT_TYPES,
                    required=False,
                ),
                FieldDefinition(
                    name="balance",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
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
                    required=False,
                ),
                FieldDefinition(
                    name="amount",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(name="posted_at", field_type=FieldType.DATE, required=False),
                FieldDefinition(
                    name="source_type",
                    field_type=FieldType.ENUM,
                    options=["manual", "vendor_payment", "customer_payment", "purchase_order", "invoice"],
                    required=False,
                ),
                FieldDefinition(name="source_id", field_type=FieldType.STRING, required=False),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "posted", "void"],
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=False,
                status_field=StatusFieldDisplay(
                    field="status",
                    active_values=JE_OPEN_STATUSES,
                    labels={
                        "active": {"en": "Open", "bn": "খোলা"},
                        "inactive": {"en": "Closed", "bn": "বন্ধ"},
                    },
                ),
            ),
        ),
        EntityDefinition(
            code="JOURNAL_ENTRY_LINE",
            fields=[
                FieldDefinition(
                    name="journal_entry_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="JOURNAL_ENTRY",
                    required=True,
                ),
                FieldDefinition(
                    name="account_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="ACCOUNT",
                    required=True,
                ),
                FieldDefinition(
                    name="debit",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(
                    name="credit",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(name="memo", field_type=FieldType.STRING, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=False,
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
        MenuDefinition(code="accounts", label="Accounts", entity_code="ACCOUNT", icon="account_balance"),
        MenuDefinition(code="journal", label="Journal Entries", entity_code="JOURNAL_ENTRY", icon="menu_book"),
        MenuDefinition(
            code="account_balances",
            label="Account Balances",
            entity_code="ACCOUNT",
            report_code="ACCOUNT_BALANCES",
            icon="pie_chart",
        ),
    ],
    permissions=["accounting.access", "accounting.view", "accounting.post"],
)
