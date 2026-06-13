from emcap.config.models import PlatformConfig
from emcap.entity.models import EntityDefinition, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.entity.system_fields import GRID_SYSTEM_COLUMNS, SYSTEM_FIELD_I18N
from emcap.metadata.display_schema import DisplayMetadata, StatusFieldMetadata
from emcap.metadata.form_schema import (
    ConditionalRule,
    FormFieldMetadata,
    FormMetadata,
    FormSectionMetadata,
    LayoutFieldType,
    ValidationRule,
)
from emcap.metadata.grid_schema import GridColumnMetadata, GridExportOptions, GridMetadata
from emcap.metadata.validation import validate_entity_for_metadata

FIELD_TYPE_MAP: dict[FieldType, LayoutFieldType] = {
    FieldType.STRING: LayoutFieldType.TEXT,
    FieldType.INTEGER: LayoutFieldType.NUMBER,
    FieldType.DECIMAL: LayoutFieldType.NUMBER,
    FieldType.BOOLEAN: LayoutFieldType.CHECKBOX,
    FieldType.DATE: LayoutFieldType.DATE,
    FieldType.DATETIME: LayoutFieldType.DATETIME,
    FieldType.ENUM: LayoutFieldType.SELECT,
    FieldType.LOOKUP: LayoutFieldType.LOOKUP,
    FieldType.CURRENCY: LayoutFieldType.CURRENCY,
    FieldType.TEXTAREA: LayoutFieldType.TEXTAREA,
}


def _label(field: FieldDefinition) -> str:
    return field.name.replace("_", " ").title()


FIELD_BN_LABELS: dict[str, str] = {
    "sku": "এসকেইউ",
    "name": "নাম",
    "unit_price": "একক মূল্য",
    "quantity_on_hand": "হাতে পরিমাণ",
    "reorder_level": "পুনঃঅর্ডার স্তর",
    "active": "সক্রিয়",
    "primary_warehouse": "প্রাথমিক গুদাম",
    "description": "বিবরণ",
    "stock_category": "স্টক বিভাগ",
    "code": "কোড",
    "location": "অবস্থান",
    "email": "ইমেইল",
    "phone": "ফোন",
    "company": "কোম্পানি",
    "contact_name": "যোগাযোগকারী",
    "status": "অবস্থা",
    "lead_id": "লিড",
    "po_number": "পিও নম্বর",
    "supplier_id": "সরবরাহকারী",
    "warehouse_id": "গুদাম",
    "total_amount": "মোট পরিমাণ",
    "order_date": "অর্ডার তারিখ",
    "notes": "নোট",
    "order_number": "অর্ডার নম্বর",
    "customer_id": "গ্রাহক",
    "invoice_number": "ইনভয়েস নম্বর",
    "sales_order_id": "বিক্রয় অর্ডার",
    "amount": "পরিমাণ",
    "due_date": "নির্ধারিত তারিখ",
    "movement_number": "মুভমেন্ট নম্বর",
    "movement_type": "মুভমেন্ট ধরন",
    "movement_date": "মুভমেন্ট তারিখ",
    "source_warehouse_id": "উৎস গুদাম",
    "reference_type": "রেফারেন্স ধরন",
    "reference_id": "রেফারেন্স আইডি",
    "movement_id": "স্টক মুভমেন্ট",
    "product_id": "পণ্য",
    "quantity": "পরিমাণ",
    "unit_cost": "একক খরচ",
}


def _field_i18n(field: FieldDefinition) -> dict[str, str]:
    label = _label(field)
    return {"en": label, "bn": FIELD_BN_LABELS.get(field.name, label)}


def _system_grid_i18n() -> dict[str, dict[str, str]]:
    en: dict[str, str] = {}
    bn: dict[str, str] = {}
    for name in GRID_SYSTEM_COLUMNS:
        en[name] = SYSTEM_FIELD_I18N[name]["en"]
        bn[name] = SYSTEM_FIELD_I18N[name]["bn"]
    return {"en": en, "bn": bn}


def _system_form_fields(start_row: int) -> list[FormFieldMetadata]:
    specs: list[tuple[str, LayoutFieldType]] = [
        ("id", LayoutFieldType.TEXT),
        ("created_at", LayoutFieldType.DATETIME),
        ("updated_at", LayoutFieldType.DATETIME),
        ("created_by", LayoutFieldType.TEXT),
        ("updated_by", LayoutFieldType.TEXT),
        ("record_version", LayoutFieldType.NUMBER),
        ("deleted_at", LayoutFieldType.DATETIME),
    ]
    fields: list[FormFieldMetadata] = []
    for index, (name, field_type) in enumerate(specs):
        fields.append(
            FormFieldMetadata(
                name=name,
                label=SYSTEM_FIELD_I18N[name]["en"],
                field_type=field_type,
                required=False,
                read_only=True,
                row=start_row + index // 2,
                col=(index % 2) * 6,
                span=6,
                i18n=dict(SYSTEM_FIELD_I18N[name]),
            )
        )
    return fields


def _grid_i18n(entity: EntityDefinition) -> dict[str, dict[str, str]]:
    en: dict[str, str] = {}
    bn: dict[str, str] = {}
    for field in entity.fields:
        en[field.name] = _label(field)
        bn[field.name] = FIELD_BN_LABELS.get(field.name, _label(field))
    return {"en": en, "bn": bn}


def _validation(field: FieldDefinition) -> list[ValidationRule]:
    rules: list[ValidationRule] = []
    if field.required:
        rules.append(ValidationRule(rule="required", message=f"{_label(field)} is required"))
    if field.field_type == FieldType.STRING and field.name == "email":
        rules.append(ValidationRule(rule="email", message="Invalid email address"))
    return rules


def _build_display(status_field: StatusFieldDisplay | None) -> DisplayMetadata:
    if status_field is None:
        return DisplayMetadata()
    return DisplayMetadata(
        status_field=StatusFieldMetadata(
            field=status_field.field,
            active_values=list(status_field.active_values),
            labels=dict(status_field.labels),
        )
    )


def _layout_field_type(field: FieldDefinition) -> LayoutFieldType:
    if field.name == "email":
        return LayoutFieldType.EMAIL
    return FIELD_TYPE_MAP.get(field.field_type, LayoutFieldType.TEXT)


def build_form_metadata(entity: EntityDefinition) -> FormMetadata:
    validate_entity_for_metadata(entity)
    fields: list[FormFieldMetadata] = []
    for index, field in enumerate(entity.fields):
        is_textarea = field.field_type == FieldType.TEXTAREA
        fields.append(
            FormFieldMetadata(
                name=field.name,
                label=_label(field),
                field_type=_layout_field_type(field),
                required=field.required,
                row=index // 2,
                col=0 if is_textarea else (index % 2) * 6,
                span=12 if is_textarea else 6,
                validation=_validation(field),
                i18n=_field_i18n(field),
                options=list(field.options),
                lookup_entity=field.lookup_entity if field.field_type == FieldType.LOOKUP else None,
                currency_code=field.currency_code if field.field_type == FieldType.CURRENCY else None,
            )
        )

    conditions = [
        ConditionalRule(
            field="active",
            operator="equals",
            value=True,
            action="show",
            targets=["email"],
        )
    ]

    main_row_count = max((field.row for field in fields), default=-1) + 1
    system_fields = _system_form_fields(main_row_count)
    system_i18n = _system_grid_i18n()
    return FormMetadata(
        entity_code=entity.code,
        sections=[
            FormSectionMetadata(
                code="main",
                label=entity.code.title(),
                fields=fields,
            ),
            FormSectionMetadata(
                code="system",
                label="System",
                fields=system_fields,
            ),
        ],
        conditions=conditions,
        i18n={
            "en": {
                "title": entity.code.title(),
                "section.main": entity.code.title(),
                "section.system": "System",
                **system_i18n["en"],
            },
            "bn": {
                "title": FIELD_BN_LABELS.get(entity.code.lower(), entity.code.title()),
                "section.main": FIELD_BN_LABELS.get(entity.code.lower(), entity.code.title()),
                "section.system": "সিস্টেম",
                **system_i18n["bn"],
            },
        },
        display=_build_display(entity.options.status_field),
    )


def build_grid_metadata(entity: EntityDefinition, config: PlatformConfig) -> GridMetadata:
    validate_entity_for_metadata(entity)
    columns = [
        GridColumnMetadata(
            field=field.name,
            label=_label(field),
            sortable=True,
            filterable=True,
            field_type=_layout_field_type(field).value,
            lookup_entity=field.lookup_entity if field.field_type == FieldType.LOOKUP else None,
            currency_code=field.currency_code if field.field_type == FieldType.CURRENCY else None,
        )
        for field in entity.fields
    ]
    system_i18n = _system_grid_i18n()
    for name in GRID_SYSTEM_COLUMNS:
        columns.append(
            GridColumnMetadata(
                field=name,
                label=system_i18n["en"][name],
                sortable=True,
                filterable=False,
            )
        )
    entity_i18n = _grid_i18n(entity)
    grid = config.grid
    return GridMetadata(
        entity_code=entity.code,
        columns=columns,
        export=GridExportOptions(excel=grid.export_excel, pdf=grid.export_pdf, csv=grid.export_csv),
        grouping=grid.grouping,
        realtime=grid.realtime,
        offline=grid.offline,
        i18n={
            "en": {**entity_i18n["en"], **system_i18n["en"]},
            "bn": {**entity_i18n["bn"], **system_i18n["bn"]},
        },
        display=_build_display(entity.options.status_field),
    )
