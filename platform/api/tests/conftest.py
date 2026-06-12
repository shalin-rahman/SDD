import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import emcap.persistence.database as database

ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = ROOT / "config" / "platform-test.yaml"
MODULES_PATH = ROOT / "modules"


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite:///:memory:")
    if url.startswith("postgresql"):
        return url
    return "sqlite:///:memory:"


@pytest.fixture(autouse=True)
def reset_database() -> None:
    database._engine = None
    database._session_factory = None


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("EMCAP_CONFIG_PATH", str(CONFIG_PATH))
    monkeypatch.setenv("EMCAP_MODULES_PATH", str(MODULES_PATH))
    monkeypatch.setenv("DATABASE_URL", _database_url())

    from emcap.main import create_app

    return TestClient(create_app())
