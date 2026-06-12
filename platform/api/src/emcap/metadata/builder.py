from emcap.config.models import PlatformConfig
from emcap.entity.models import EntityDefinition, FieldDefinition, FieldType
from emcap.metadata.form_schema import (
    ConditionalRule,
    FormFieldMetadata,
    FormMetadata,
    FormSectionMetadata,
    LayoutFieldType,
    ValidationRule,
)
from emcap.metadata.grid_schema import GridColumnMetadata, GridExportOptions, GridMetadata

FIELD_TYPE_MAP: dict[FieldType, LayoutFieldType] = {
    FieldType.STRING: LayoutFieldType.TEXT,
    FieldType.INTEGER: LayoutFieldType.NUMBER,
    FieldType.DECIMAL: LayoutFieldType.NUMBER,
    FieldType.BOOLEAN: LayoutFieldType.CHECKBOX,
    FieldType.DATE: LayoutFieldType.DATE,
    FieldType.DATETIME: LayoutFieldType.DATETIME,
}


def _label(field: FieldDefinition) -> str:
    return field.name.replace("_", " ").title()


def _validation(field: FieldDefinition) -> list[ValidationRule]:
    rules: list[ValidationRule] = []
    if field.required:
        rules.append(ValidationRule(rule="required", message=f"{_label(field)} is required"))
    if field.field_type == FieldType.STRING and field.name == "email":
        rules.append(ValidationRule(rule="email", message="Invalid email address"))
    return rules


def build_form_metadata(entity: EntityDefinition) -> FormMetadata:
    fields: list[FormFieldMetadata] = []
    for index, field in enumerate(entity.fields):
        fields.append(
            FormFieldMetadata(
                name=field.name,
                label=_label(field),
                field_type=(
                    LayoutFieldType.EMAIL
                    if field.name == "email"
                    else FIELD_TYPE_MAP.get(field.field_type, LayoutFieldType.TEXT)
                ),
                required=field.required,
                row=index // 2,
                col=(index % 2) * 6,
                span=6,
                validation=_validation(field),
                i18n={"en": _label(field), "bn": _label(field)},
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

    return FormMetadata(
        entity_code=entity.code,
        sections=[
            FormSectionMetadata(
                code="main",
                label=entity.code.title(),
                fields=fields,
            )
        ],
        conditions=conditions,
        i18n={"en": {"title": entity.code.title()}, "bn": {"title": entity.code.title()}},
    )


def build_grid_metadata(entity: EntityDefinition, config: PlatformConfig) -> GridMetadata:
    columns = [
        GridColumnMetadata(field=field.name, label=_label(field), sortable=True, filterable=True)
        for field in entity.fields
    ]
    grid = config.grid
    return GridMetadata(
        entity_code=entity.code,
        columns=columns,
        export=GridExportOptions(excel=grid.export_excel, pdf=grid.export_pdf, csv=grid.export_csv),
        grouping=grid.grouping,
        realtime=grid.realtime,
        offline=grid.offline,
        i18n={"en": {"title": entity.code.title()}, "bn": {"title": entity.code.title()}},
    )
