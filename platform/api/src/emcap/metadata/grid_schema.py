from pydantic import BaseModel, Field

from emcap.metadata.display_schema import DisplayMetadata


class GridColumnMetadata(BaseModel):
    field: str
    label: str
    sortable: bool = True
    filterable: bool = True
    width: int | None = None
    field_type: str | None = None
    lookup_entity: str | None = None
    currency_code: str | None = None


class GridExportOptions(BaseModel):
    excel: bool = True
    pdf: bool = True
    csv: bool = True


class GridMetadata(BaseModel):
    schema_version: str = "1.0"
    entity_code: str
    columns: list[GridColumnMetadata] = Field(default_factory=list)
    export: GridExportOptions = Field(default_factory=GridExportOptions)
    grouping: bool = True
    realtime: bool = True
    offline: bool = True
    bulk_actions: bool = False
    i18n: dict[str, dict[str, str]] = Field(default_factory=dict)
    display: DisplayMetadata = Field(default_factory=DisplayMetadata)
