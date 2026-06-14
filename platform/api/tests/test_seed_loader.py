"""Seed loader — JSON core/demo packs and demo purge when disabled."""

from pathlib import Path

import pytest

from emcap.config.loader import load_platform_config
from emcap.persistence.database import (
    EntityRecordRow,
    UserRow,
    configure_database,
    get_session_factory,
    init_db,
)
from emcap.seed.loader import apply_configured_seeds, remove_demo_seed, resolve_seed_directory

ROOT = Path(__file__).resolve().parents[3]
DEMO_DIR = ROOT / "data" / "seed" / "demo"
DEMO_PRODUCT_ID = "11111111-1111-4111-8111-111111111101"
DEMO_STOCK_MOVEMENT_ID = "11111111-1111-4111-8111-111111111801"
DEMO_STOCK_MOVEMENT_LINE_ID = "11111111-1111-4111-8111-111111111901"


@pytest.fixture
def seed_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("EMCAP_CONFIG_PATH", str(ROOT / "config" / "platform.yaml"))
    monkeypatch.setenv("EMCAP_MODULES_PATH", str(ROOT / "modules"))
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    configure_database()
    init_db()


def test_core_seed_creates_admin_user(client) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200


def test_demo_seed_products_exist(seed_db: None) -> None:
    config = load_platform_config(ROOT / "config" / "platform.yaml")
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)
        row = session.query(EntityRecordRow).filter_by(id=DEMO_PRODUCT_ID).one()
        assert row.entity_code == "PRODUCT"
        assert row.data["sku"] == "SKU-DEMO-001"
    finally:
        session.close()


def test_demo_seed_stock_movements_exist(seed_db: None) -> None:
    config = load_platform_config(ROOT / "config" / "platform.yaml")
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)
        movement = session.query(EntityRecordRow).filter_by(id=DEMO_STOCK_MOVEMENT_ID).one()
        assert movement.entity_code == "STOCK_MOVEMENT"
        assert movement.data["movement_number"] == "SM-DEMO-DRF-R01"
        assert movement.data["movement_type"] == "receive"
        assert movement.data["status"] == "draft"

        line = session.query(EntityRecordRow).filter_by(id=DEMO_STOCK_MOVEMENT_LINE_ID).one()
        assert line.entity_code == "STOCK_MOVEMENT_LINE"
        assert line.data["movement_id"] == DEMO_STOCK_MOVEMENT_ID
        assert line.data["quantity"] == 25
    finally:
        session.close()


def test_remove_demo_seed_when_disabled(seed_db: None) -> None:
    config = load_platform_config()
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)
        assert session.query(EntityRecordRow).filter_by(id=DEMO_PRODUCT_ID).count() == 1

        config.seed.demo.enabled = False
        apply_configured_seeds(session, config)
        assert session.query(EntityRecordRow).filter_by(id=DEMO_PRODUCT_ID).count() == 0
        assert session.query(UserRow).filter_by(username="admin").count() == 1
    finally:
        session.close()


def test_remove_demo_seed_direct(seed_db: None) -> None:
    session = get_session_factory()()
    try:
        session.add(
            EntityRecordRow(
                id=DEMO_PRODUCT_ID,
                entity_code="PRODUCT",
                tenant_id="default",
                data={"sku": "x", "name": "y"},
            )
        )
        session.commit()
        removed = remove_demo_seed(session, DEMO_DIR)
        assert removed == 1
    finally:
        session.close()


def test_resolve_seed_directory_relative() -> None:
    config = load_platform_config()
    path = resolve_seed_directory(config, "data/seed/core")
    assert path.name == "core"
    assert path.parent.name == "seed"
