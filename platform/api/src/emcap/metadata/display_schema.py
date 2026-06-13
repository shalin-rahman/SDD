from pydantic import BaseModel, Field


class StatusFieldMetadata(BaseModel):
    field: str
    active_values: list[str | bool | int | float] = Field(default_factory=list)
    labels: dict[str, dict[str, str]] = Field(default_factory=dict)


class DisplayMetadata(BaseModel):
    status_field: StatusFieldMetadata | None = None
