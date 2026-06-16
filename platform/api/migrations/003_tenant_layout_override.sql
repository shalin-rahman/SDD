-- P13-T31: Tenant-scoped form/grid layout overrides (ADR-007).
-- SQLite local dev uses SQLAlchemy create_all(); apply on PostgreSQL dev/CI.

CREATE TABLE IF NOT EXISTS tenant_layout_overrides (
    tenant_id VARCHAR(64) NOT NULL,
    entity_code VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, entity_code)
);

CREATE INDEX IF NOT EXISTS ix_tenant_layout_overrides_entity
    ON tenant_layout_overrides (entity_code);
