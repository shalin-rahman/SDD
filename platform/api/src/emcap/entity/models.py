from enum import StrEnum
from typing import Self

from pydantic import BaseModel, Field, field_validator, model_validator


class FieldType(StrEnum):
    STRING = "string"
    INTEGER = "integer"
    DECIMAL = "decimal"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    ENUM = "enum"
    LOOKUP = "lookup"
    CURRENCY = "currency"
    TEXTAREA = "textarea"


class FieldDefinition(BaseModel):
    name: str
    field_type: FieldType = FieldType.STRING
    required: bool = False
    searchable: bool = True
    read_roles: list[str] = Field(default_factory=list)
    options: list[str] = Field(default_factory=list)
    lookup_entity: str | None = None
    currency_code: str | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.isidentifier():
            msg = f"Invalid field name: {value}"
            raise ValueError(msg)
        return normalized

    @field_validator("lookup_entity")
    @classmethod
    def normalize_lookup_entity(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if not normalized.isidentifier():
            msg = f"Invalid lookup_entity: {value}"
            raise ValueError(msg)
        return normalized

    @field_validator("currency_code")
    @classmethod
    def normalize_currency_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if len(normalized) != 3 or not normalized.isalpha():
            msg = f"Invalid currency_code: {value}"
            raise ValueError(msg)
        return normalized

    @model_validator(mode="after")
    def validate_field_type_contract(self) -> Self:
        if self.field_type == FieldType.ENUM:
            if not self.options:
                msg = "options are required when field_type is ENUM"
                raise ValueError(msg)
        elif self.options:
            msg = "options are only valid for ENUM fields"
            raise ValueError(msg)

        if self.field_type == FieldType.LOOKUP:
            if not self.lookup_entity:
                msg = "lookup_entity is required when field_type is LOOKUP"
                raise ValueError(msg)
        elif self.lookup_entity is not None:
            msg = "lookup_entity is only valid for LOOKUP fields"
            raise ValueError(msg)

        if self.field_type == FieldType.CURRENCY:
            if self.currency_code is None:
                self.currency_code = "USD"
        elif self.currency_code is not None:
            msg = "currency_code is only valid for CURRENCY fields"
            raise ValueError(msg)
        return self


class StatusFieldDisplay(BaseModel):
    """Maps a business field to the record-detail status chip."""

    field: str
    active_values: list[str | bool | int | float] = Field(default_factory=lambda: [True])
    labels: dict[str, dict[str, str]] = Field(default_factory=dict)


class EntityOptions(BaseModel):
    audit_enabled: bool = True
    workflow_enabled: bool = False
    notes_enabled: bool = False
    document_enabled: bool = False
    bulk_actions: bool = False
    status_field: StatusFieldDisplay | None = None


class EntityDefinition(BaseModel):
    code: str
    fields: list[FieldDefinition] = Field(min_length=1)
    options: EntityOptions = Field(default_factory=EntityOptions)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized.isidentifier():
            msg = f"Invalid entity code: {value}"
            raise ValueError(msg)
        return normalized
