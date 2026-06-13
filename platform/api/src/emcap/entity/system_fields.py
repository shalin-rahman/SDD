"""Platform-injected record fields — not declared on EntityDefinition."""

SYSTEM_FIELD_NAMES: frozenset[str] = frozenset(
    {
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "record_version",
        "deleted_at",
    }
)

SYSTEM_FIELD_I18N: dict[str, dict[str, str]] = {
    "id": {"en": "Record ID", "bn": "রেকর্ড আইডি"},
    "created_at": {"en": "Created", "bn": "তৈরি"},
    "updated_at": {"en": "Last updated", "bn": "আপডেট"},
    "created_by": {"en": "Created by", "bn": "তৈরি করেছেন"},
    "updated_by": {"en": "Updated by", "bn": "আপডেট করেছেন"},
    "record_version": {"en": "Version", "bn": "সংস্করণ"},
    "deleted_at": {"en": "Deleted", "bn": "মুছে ফেলা"},
}

GRID_SYSTEM_COLUMNS: tuple[str, ...] = (
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "record_version",
)
