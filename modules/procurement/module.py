import importlib.util
from pathlib import Path
from typing import Any, Callable

from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

PO_OPEN_STATUSES = ["draft", "submitted", "received"]
PAYMENT_OPEN_STATUSES = ["draft"]
_FINANCE_READ = ["accounting.view"]


def _load_validators() -> dict[str, Callable[..., Any]]:
    validators: dict[str, Callable[..., Any]] = {}
    for name in ("purchase_order", "vendor_payment"):
        path = Path(__file__).resolve().parent / f"{name}.py"
        spec = importlib.util.spec_from_file_location(f"procurement_{name}", path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        if name == "purchase_order":
            validators["PURCHASE_ORDER"] = module.validate_purchase_order_payload
        else:
            validators["VENDOR_PAYMENT"] = module.validate_vendor_payment_payload
    return validators


ENTITY_VALIDATORS = _load_validators()

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
                FieldDefinition(name="payment_terms", field_type=FieldType.STRING, required=False),
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
        EntityDefinition(
            code="PURCHASE_ORDER_LINE",
            fields=[
                FieldDefinition(
                    name="po_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="PURCHASE_ORDER",
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
            code="VENDOR_PAYMENT",
            fields=[
                FieldDefinition(name="payment_number", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="po_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="PURCHASE_ORDER",
                    required=True,
                ),
                FieldDefinition(
                    name="supplier_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="SUPPLIER",
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
                    options=["check", "wire", "ach", "cash", "other"],
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
        MenuDefinition(code="suppliers", label="Suppliers", entity_code="SUPPLIER", icon="local_shipping"),
        MenuDefinition(
            code="purchase_orders", label="Purchase Orders", entity_code="PURCHASE_ORDER", icon="shopping_cart"
        ),
        MenuDefinition(
            code="vendor_payments",
            label="Vendor Payments",
            entity_code="VENDOR_PAYMENT",
            icon="payments",
        ),
        MenuDefinition(
            code="open_purchase_orders",
            label="Open POs Report",
            entity_code="PURCHASE_ORDER",
            report_code="OPEN_PURCHASE_ORDERS",
            icon="assignment",
        ),
    ],
    permissions=["procurement.access", "procurement.pay"],
)
