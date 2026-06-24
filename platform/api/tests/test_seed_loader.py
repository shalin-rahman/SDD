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
DEMO_SUPPLIER_ID = "11111111-1111-4111-8111-111111111b01"
DEMO_PO_DRAFT_ID = "11111111-1111-4111-8111-111111111b02"
DEMO_PO_LINE_ID = "11111111-1111-4111-8111-111111111b03"
DEMO_PO_RECEIVED_ID = "11111111-1111-4111-8111-111111111b04"
DEMO_VENDOR_PAYMENT_POSTED_ID = "11111111-1111-4111-8111-111111111b07"
DEMO_SALES_ORDER_ID = "11111111-1111-4111-8111-111111111c01"
DEMO_SALES_ORDER_LINE_ID = "11111111-1111-4111-8111-111111111c02"
DEMO_INVOICE_ID = "11111111-1111-4111-8111-111111111c04"
DEMO_CUSTOMER_ID = "11111111-1111-4111-8111-111111111401"
DEMO_ACCOUNT_SALES_REVENUE_ID = "11111111-1111-4111-8111-111111111605"
DEMO_CUSTOMER_PAYMENT_POSTED_ID = "11111111-1111-4111-8111-111111111c05"
DEMO_JE_POSTED_ID = "11111111-1111-4111-8111-111111111606"
DEMO_JE_LINE_DEBIT_ID = "11111111-1111-4111-8111-111111111607"


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


def test_demo_seed_procurement_chain_exist(seed_db: None) -> None:
    config = load_platform_config(ROOT / "config" / "platform.yaml")
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)

        supplier = session.query(EntityRecordRow).filter_by(id=DEMO_SUPPLIER_ID).one()
        assert supplier.entity_code == "SUPPLIER"
        assert supplier.data["code"] == "SUP-DEMO-001"

        po_draft = session.query(EntityRecordRow).filter_by(id=DEMO_PO_DRAFT_ID).one()
        assert po_draft.data["po_number"] == "PO-DEMO-DRAFT"
        assert po_draft.data["status"] == "draft"

        po_line = session.query(EntityRecordRow).filter_by(id=DEMO_PO_LINE_ID).one()
        assert po_line.entity_code == "PURCHASE_ORDER_LINE"
        assert po_line.data["po_id"] == DEMO_PO_DRAFT_ID
        assert po_line.data["quantity"] == 10

        po_received = session.query(EntityRecordRow).filter_by(id=DEMO_PO_RECEIVED_ID).one()
        assert po_received.data["status"] == "received"
        assert po_received.data["balance_due"] == 200.0

        payment = session.query(EntityRecordRow).filter_by(id=DEMO_VENDOR_PAYMENT_POSTED_ID).one()
        assert payment.entity_code == "VENDOR_PAYMENT"
        assert payment.data["status"] == "posted"
        assert payment.data["amount"] == 120.0
    finally:
        session.close()


def test_demo_seed_sales_chain_exist(seed_db: None) -> None:
    config = load_platform_config(ROOT / "config" / "platform.yaml")
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)

        so = session.query(EntityRecordRow).filter_by(id=DEMO_SALES_ORDER_ID).one()
        assert so.entity_code == "SALES_ORDER"
        assert so.data["order_number"] == "SO-DEMO-001"
        assert so.data["total_amount"] == 450.0

        so_line = session.query(EntityRecordRow).filter_by(id=DEMO_SALES_ORDER_LINE_ID).one()
        assert so_line.entity_code == "SALES_ORDER_LINE"
        assert so_line.data["sales_order_id"] == DEMO_SALES_ORDER_ID

        invoice = session.query(EntityRecordRow).filter_by(id=DEMO_INVOICE_ID).one()
        assert invoice.data["status"] == "partial"
        assert invoice.data["balance_due"] == 300.0

        payment = session.query(EntityRecordRow).filter_by(id=DEMO_CUSTOMER_PAYMENT_POSTED_ID).one()
        assert payment.entity_code == "CUSTOMER_PAYMENT"
        assert payment.data["status"] == "posted"
        assert payment.data["amount"] == 150.0
    finally:
        session.close()


def test_demo_seed_accounting_double_entry_exist(seed_db: None) -> None:
    config = load_platform_config(ROOT / "config" / "platform.yaml")
    session = get_session_factory()()
    try:
        config.seed.demo.enabled = True
        apply_configured_seeds(session, config)

        cash = session.query(EntityRecordRow).filter_by(id="11111111-1111-4111-8111-111111111601").one()
        assert cash.data["account_type"] == "asset"

        entry = session.query(EntityRecordRow).filter_by(id=DEMO_JE_POSTED_ID).one()
        assert entry.entity_code == "JOURNAL_ENTRY"
        assert entry.data["reference"] == "JE-DEMO-GL-001"
        assert entry.data["status"] == "posted"

        debit_line = session.query(EntityRecordRow).filter_by(id=DEMO_JE_LINE_DEBIT_ID).one()
        assert debit_line.entity_code == "JOURNAL_ENTRY_LINE"
        assert debit_line.data["journal_entry_id"] == DEMO_JE_POSTED_ID
        assert debit_line.data["debit"] == 1500.0
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
