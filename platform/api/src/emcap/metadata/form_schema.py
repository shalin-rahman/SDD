from enum import StrEnum

from pydantic import BaseModel, Field


class LayoutFieldType(StrEnum):
    TEXT = "text"
    EMAIL = "email"
    NUMBER = "number"
    CHECKBOX = "checkbox"
    DATE = "date"
    DATETIME = "datetime"


class ValidationRule(BaseModel):
    rule: str
    message: str
    value: str | int | float | bool | None = None


class ConditionalRule(BaseModel):
    field: str
    operator: str
    value: str | bool | int | float | None = None
    action: str = "show"
    targets: list[str] = Field(default_factory=list)


class FormFieldMetadata(BaseModel):
    name: str
    label: str
    field_type: LayoutFieldType
    required: bool = False
    row: int = 0
    col: int = 0
    span: int = 12
    validation: list[ValidationRule] = Field(default_factory=list)
    i18n: dict[str, str] = Field(default_factory=dict)


class FormSectionMetadata(BaseModel):
    code: str
    label: str
    fields: list[FormFieldMetadata] = Field(default_factory=list)


class FormMetadata(BaseModel):
    schema_version: str = "1.0"
    entity_code: str
    sections: list[FormSectionMetadata] = Field(default_factory=list)
    conditions: list[ConditionalRule] = Field(default_factory=list)
    i18n: dict[str, dict[str, str]] = Field(default_factory=dict)
