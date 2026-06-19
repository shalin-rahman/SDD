import importlib.util
from pathlib import Path
from typing import Any, Callable

from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

SO_OPEN_STATUSES = ["draft", "confirmed", "shipped"]
INVOICE_OPEN_STATUSES = ["draft", "sent", "partial"]
PAYMENT_OPEN_STATUSES = ["draft"]
_FINANCE_READ = ["accounting.view"]


def _load_validators() -> dict[str, Callable[..., Any]]:
    validators: dict[str, Callable[..., Any]] = {}
    for name in ("sales_order", "customer_payment"):
        path = Path(__file__).resolve().parent / f"{name}.py"
        spec = importlib.util.spec_from_file_location(f"sales_{name}", path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        if name == "sales_order":
            validators["SALES_ORDER"] = module.validate_sales_order_payload
        else:
            validators["CUSTOMER_PAYMENT"] = module.validate_customer_payment_payload
    return validators


ENTITY_VALIDATORS = _load_validators()

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
                    read_roles=_FINANCE_READ,
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
            code="SALES_ORDER_LINE",
            fields=[
                FieldDefinition(
                    name="sales_order_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="SALES_ORDER",
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
                    name="unit_price",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=True,
                    read_roles=_FINANCE_READ,
                ),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=False,
                document_enabled=False,
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
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(
                    name="amount_paid",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(
                    name="balance_due",
                    field_type=FieldType.CURRENCY,
                    currency_code="USD",
                    required=False,
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(name="due_date", field_type=FieldType.DATE, required=False),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "sent", "partial", "paid", "void"],
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
        EntityDefinition(
            code="CUSTOMER_PAYMENT",
            fields=[
                FieldDefinition(name="payment_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="invoice_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="INVOICE",
                    required=True,
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
                    read_roles=_FINANCE_READ,
                ),
                FieldDefinition(name="payment_date", field_type=FieldType.DATE, required=False),
                FieldDefinition(
                    name="payment_method",
                    field_type=FieldType.ENUM,
                    options=["check", "wire", "ach", "cash", "card", "other"],
                    required=False,
                ),
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["draft", "posted", "void"],
                    required=True,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=False,
                status_field=StatusFieldDisplay(
                    field="status",
                    active_values=PAYMENT_OPEN_STATUSES,
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
        MenuDefinition(code="sales_orders", label="Sales Orders", entity_code="SALES_ORDER", icon="receipt_long"),
        MenuDefinition(code="invoices", label="Invoices", entity_code="INVOICE", icon="request_quote"),
        MenuDefinition(
            code="customer_payments",
            label="Customer Payments",
            entity_code="CUSTOMER_PAYMENT",
            icon="point_of_sale",
        ),
        MenuDefinition(
            code="open_sales_orders",
            label="Open Orders Report",
            entity_code="SALES_ORDER",
            report_code="OPEN_SALES_ORDERS",
            icon="pending_actions",
        ),
        MenuDefinition(
            code="outstanding_invoices",
            label="Outstanding Invoices",
            entity_code="INVOICE",
            report_code="OUTSTANDING_INVOICES",
            icon="account_balance_wallet",
        ),
    ],
    permissions=["sales.access", "sales.collect"],
)
