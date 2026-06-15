-- P21-T01: Platform system columns on entity_records (PostgreSQL).
-- Fresh installs use init_db() create_all; apply this on DBs created before P14-T12.
-- SQLite local dev uses _apply_sqlite_schema_patches() instead.

ALTER TABLE entity_records ADD COLUMN IF NOT EXISTS created_by VARCHAR(128);
ALTER TABLE entity_records ADD COLUMN IF NOT EXISTS updated_by VARCHAR(128);
ALTER TABLE entity_records ADD COLUMN IF NOT EXISTS record_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE entity_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
