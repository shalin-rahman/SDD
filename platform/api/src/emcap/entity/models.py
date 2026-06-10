from enum import StrEnum

from pydantic import BaseModel, Field, field_validator


class FieldType(StrEnum):
    STRING = "string"
    INTEGER = "integer"
    DECIMAL = "decimal"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"


class FieldDefinition(BaseModel):
    name: str
    field_type: FieldType = FieldType.STRING
    required: bool = False
    searchable: bool = True
    read_roles: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.isidentifier():
            msg = f"Invalid field name: {value}"
            raise ValueError(msg)
        return normalized


class EntityOptions(BaseModel):
    audit_enabled: bool = True
    workflow_enabled: bool = False
    notes_enabled: bool = False
    document_enabled: bool = False


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
